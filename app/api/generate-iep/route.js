import { NextResponse } from 'next/server';
import { getRagContext } from '@/lib/ragContext';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      studentGrade,
      studentAge,
      areaOfNeed,
      currentPerformance,
      disabilityCategory,
      instructionalSetting,
      exceptionalities, // expected: array of strings, e.g. ["Specific Learning Disability", "Autism"]
      customGoals, // optional: array of { title, _id? } objects supplied by the caller
      studentId,
      student_accommodations // optional: accommodations payload provided directly in request
    } = body;

    // Validate required fields
    if (!studentGrade || !studentAge || !areaOfNeed || !currentPerformance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // System prompt for expert guidance
    const systemPrompt = `You are an expert Special Education IEP writer. Receive a single JSON input (do not fetch external data). Using only the provided input values, generate a structured IEP. Do NOT invent facts—if a required input is missing, insert the exact placeholder "[MISSING: <fieldName>]".

QUALITY RULES (MANDATORY)

1) Grounding — Every goal/objective must be grounded in the provided weaknesses, strengths, PLAAFP baselines, assessments, accommodations, or custom goals. Do NOT invent or assume goals. If no source exists, use placeholders.

2) Generate goals ONLY when evidenced — Only create goals when there is clear need from weaknesses, strengths, baselines, assessments, accommodations, custom goals, or institutional context. Do NOT generate goals by default. Do NOT add fake percentages, trial counts, or measurement windows.

3) Prioritize quality over quantity — 2–4 annual goals total unless input justifies more. Each annual goal should have 2–3 short-term objectives.

4) ABSOLUTE NON-DUPLICATION — This is the most critical rule:
   - annual_goals and short_term_objectives are BROAD cross-exceptionality goals applicable school-wide.
   - annualGoalsByExceptionality and shortTermObjectivesByExceptionality are TARGETED disability-impact-specific goals.
   - These two layers MUST contain completely different goals. No goal/objective may appear in both layers, even paraphrased.
   - If you find yourself writing a similar goal for both layers, make the broad layer focus on a different skill/domain than the exceptionality layer.

5) No invented metrics — Do NOT add percentages (e.g. "80% accuracy"), trial counts (e.g. "4 out of 5 trials"), or measurement windows unless they appear in the provided institutional context or input. Use plain, observable language from the source material.

6) Accommodations linkage — Reference provided accommodations in goal conditions (e.g., "Given text-to-speech...") when relevant. Do NOT invent accommodations not in the input. Distribute them logically across goals.

7) Institutional context (MANDATORY when provided) — When "Relevant institutional context" is provided below, you MUST use it as the primary source for ALL goals and objectives. ALIGNMENT RULES: (a) Match Content Strands and Annual Goals from the institutional context to the student's weaknesses, strengths, accommodations, and custom goals. (b) Use the EXACT or near-exact wording of objectives from the institutional context — e.g., "Respond when name is called", "Indicate what type of assistance is needed", "Demonstrate awareness of letter/sound relationships", "Identify sequence of events, main ideas, and details or facts in literary and informational text". Do NOT replace these with generic paraphrases. (c) For custom_goals, include retrieved_objectives: an array of the exact objective strings from the institutional context that match each custom goal. Do NOT invent goals. If no institutional context is provided, only create goals from the provided weaknesses, strengths, accommodations, or custom goals.

Output: Return ONLY a single JSON object with exactly these top-level keys (no extra keys, no wrapper):
{
  "recommendedAccommodations": ["5-10 accommodation strings from weaknesses/PLAAFP. Prefer from selected accommodations. No duplicates."],
  "academicPerformanceAchievement": "Concise paragraph summarizing current academic achievement grounded in PLAAFP + assessments + strengths/weaknesses.",
  "plaafp_narrative": "3-4 paragraph PLAAFP narrative describing current abilities, challenges, and disability impact on learning.",
  "annual_goals": ["2-4 BROAD annual goal strings — use EXACT wording from institutional context objectives when available"],
  "short_term_objectives": ["4-8 BROAD objective strings — copy or minimally adapt EXACT objective text from institutional context (e.g., 'Respond when name is called', 'Demonstrate awareness of letter/sound relationships')"],
  "annualGoalsByExceptionality": [{"exceptionality": "Name", "goals": [{"referenceId": "0", "goal": "Targeted goal — use EXACT wording from institutional context"}]}],
  "shortTermObjectivesByExceptionality": [{"exceptionality": "Name", "objectives": [{"referenceId": "0", "objective": "Targeted objective — copy EXACT text from institutional context", "alignedAnnualGoalReferenceId": "0"}]}],
  "intervention_recommendations": "Detailed intervention/strategy recommendations specific to Florida standards.",
  "custom_goals": [{"title": "Custom goal title", "recommendation": "Brief strategy recommendation", "retrieved_objectives": ["Exact objective string from institutional context", "Another objective from context"]}]
}

Tone: professional, concise, plain-language suitable for parent review and IEP team.
Comply with Florida IEP requirements. Return valid JSON only.`;

    // Prepare custom goals text for prompt (if provided)
    const customGoalsList = Array.isArray(customGoals) && customGoals.length > 0
      ? customGoals.map((g, i) => `${i + 1}. ${g.title || g}`).join('\n')
      : null;

    // Load/normalize accommodations: prefer explicit payload, otherwise try to fetch student record
    let accommodationsRaw = student_accommodations || null;
    try {
      if (!accommodationsRaw && studentId) {
        const connectDB = (await import('@/lib/mongodb')).default;
        const Student = (await import('@/models/Student')).default;
        await connectDB();
        const stu = await Student.findById(studentId).lean();
        if (stu && stu.student_accommodations) accommodationsRaw = stu.student_accommodations;
      }
    } catch (e) {
      console.warn('Could not load student accommodations from DB:', e.message || e);
    }

    const { normalizeAccommodations, accommodationsCount } = await import('@/lib/accommodations');
    const accommodations = normalizeAccommodations(accommodationsRaw);

    // Build a compact deterministic accommodationsSummary string and per-category counts for logging
    const categories = ['presentation','response','scheduling','setting','assistive_technology_device'];
    const counts = { classroom: {}, assessment: {} };
    categories.forEach(cat => {
      counts.classroom[cat] = (accommodations.classroom[cat] || []).length;
      counts.assessment[cat] = (accommodations.assessment[cat] || []).length;
    });
    const summaryParts = [];
    summaryParts.push('Classroom: ' + categories.map(c => `${c.charAt(0).toUpperCase()+c.slice(1)}(${counts.classroom[c]})`).join(', '));
    summaryParts.push('Assessment: ' + categories.map(c => `${c.charAt(0).toUpperCase()+c.slice(1)}(${counts.assessment[c]})`).join(', '));
    summaryParts.push('ConsentObtained: ' + (accommodations.consent && accommodations.consent.parentConsentObtained ? 'true' : 'false'));
    const accommodationsSummary = summaryParts.join('. ');

    // RAG: retrieve relevant chunks from uploaded documents
    let weaknesses = [];
    try {
      if (studentId) {
        const connectDB = (await import('@/lib/mongodb')).default;
        const Student = (await import('@/models/Student')).default;
        await connectDB();
        const stu = await Student.findById(studentId).lean();
        if (stu?.weaknesses) weaknesses = Array.isArray(stu.weaknesses) ? stu.weaknesses : [];
      }
    } catch (e) {
      console.warn('Could not load student weaknesses for RAG:', e.message || e);
    }

    // Extract accommodation labels for RAG search (classroom + assessment)
    const accommodationLabels = [];
    const catKeys = ['presentation', 'response', 'scheduling', 'setting', 'assistive_technology_device'];
    ['classroom', 'assessment'].forEach(scope => {
      if (accommodations[scope]) {
        catKeys.forEach(cat => {
          const arr = accommodations[scope][cat];
          if (Array.isArray(arr)) {
            arr.forEach(item => {
              const text = (item?.label || item?.otherText || '').trim();
              if (text && !accommodationLabels.includes(text)) accommodationLabels.push(text);
            });
          }
        });
      }
    });

    const ragContext = await getRagContext({
      studentGrade,
      studentAge,
      areaOfNeed,
      disabilityCategory,
      exceptionalities: exceptionalities || [],
      weaknesses,
      customGoals: customGoals || [],
      accommodations: accommodationLabels
    });

    if (ragContext) {
      console.log('[RAG] Sending institutional context to LLM (', ragContext.length, 'chars )');
    } else {
      console.log('[RAG] No institutional context — proceeding without RAG.');
    }

    // User prompt with student data (built with join to avoid nested template-literal backtick issues)
    const userPrompt = [
      'Generate a comprehensive IEP plan for a student with the following profile:',
      '',
      `Student Grade: ${studentGrade}`,
      `Student Age: ${studentAge}`,
      `Area of Need: ${areaOfNeed}`,
      `Current Performance: ${currentPerformance}`,
      `Disability Category: ${disabilityCategory || 'Not specified'}`,
      `Instructional Setting: ${instructionalSetting}`,
      '',
      (customGoalsList ? `The student has the following CUSTOM GOALS that should be considered when recommending strategies and mapping to the IEP:\n${customGoalsList}\n` : ''),
      '',
      'Accommodations usage rule',
      '"You are given accommodations + accommodationsSummary. You MUST incorporate selected accommodations as the conditions/supports in goals/objectives (e.g., \'Given…\', \'With…\', \'Using…\') when appropriate. Do NOT invent accommodations not provided."',
      '',
      'No-duplicate rule across layers',
      '"Non-duplication is mandatory: Top-level annual_goals / short_term_objectives must be broad and cross-exceptionality; exceptionality-specific goals must be distinct and not paraphrases. Do not repeat near-identical goals/objectives anywhere."',
      '',
      'No invented metrics: Do NOT add percentages, trial counts, or measurement windows unless they appear in the institutional context. Rephrase goals/objectives from the provided context; do not fabricate them.',
      '',
      'Condition line rule: When accommodations apply, include a condition phrase (e.g., "Given text-to-speech...", "With extended time...", "Using preferential seating..."). When no accommodation applies, use a neutral phrase (e.g., "Given grade-level instruction...").',
      '',
      'If no accommodation applies to a specific goal, still include a neutral condition phrase (e.g., "Given grade-level instruction and routine classroom supports...").',
      '',
      'When accommodations exist, distribute them logically (don\'t paste the entire list into every goal). Apply reading-related accommodations to reading/writing access tasks, scheduling/setting accommodations to attention/executive function tasks, etc.',
      '',
      'Do not create new accommodations; use only the provided selections.',
      '',
      'Accommodation-consistency constraint',
      '"If an accommodation supports access (e.g., TTS/human reader), do not write goals that assume unsupported access. If the goal is to build the unsupported skill (e.g., independent decoding), explicitly state it as a targeted instructional goal and keep accommodations in place for content access."',
      '',
      'Accommodations (normalized):',
      JSON.stringify(accommodations),
      `AccommodationsSummary: ${accommodationsSummary}`,
      '',
      ...(ragContext ? [
        'Relevant institutional context (from uploaded documents — you MUST derive goals and objectives from this content):',
        ragContext,
        '',
        'ALIGNMENT MANDATE: Use the EXACT wording of objectives from the institutional context above. Examples: "Respond when name is called", "Indicate what type of assistance is needed", "Demonstrate awareness of letter/sound relationships", "Identify sequence of events, main ideas, and details or facts in literary and informational text", "Greet others and respond to greeting", "Use appropriate tone and facial expression". Do NOT replace these with generic statements. For custom_goals, populate retrieved_objectives with the exact objective strings from the context that match each custom goal. Match Content Strands (e.g., Communication, Decoding and Word Recognition, Pragmatics) to the student\'s weaknesses and custom goals.',
        ''
      ] : []),
      'Return valid JSON only with the exact keys specified in the system prompt.',
      '',
      'CRITICAL REMINDER — NON-DUPLICATION:',
      '- annual_goals / short_term_objectives = BROAD, cross-exceptionality, school-wide goals.',
      '- annualGoalsByExceptionality / shortTermObjectivesByExceptionality = TARGETED, exceptionality-specific goals addressing disability impact.',
      '- These MUST be completely different goals targeting different skills/domains. Zero overlap.',
      '',
      'Ensure all content is audit-ready, professionally written, and compliant with Florida IEP requirements.'
    ].join('\n');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate IEP content' },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    let generatedContent = JSON.parse(data.choices[0].message.content);

    // Extract and validate new top-level fields
    const recommendedAccommodations = Array.isArray(generatedContent.recommendedAccommodations) 
      ? generatedContent.recommendedAccommodations 
      : [];
    const academicPerformanceAchievement = typeof generatedContent.academicPerformanceAchievement === 'string'
      ? generatedContent.academicPerformanceAchievement
      : '';

    // Ensure annualGoalsByExceptionality / shortTermObjectivesByExceptionality exist as arrays
    // The LLM is asked to produce these directly; only provide empty fallback if missing
    if (!Array.isArray(generatedContent.annualGoalsByExceptionality)) {
      generatedContent.annualGoalsByExceptionality = [];
    }
    if (!Array.isArray(generatedContent.shortTermObjectivesByExceptionality)) {
      generatedContent.shortTermObjectivesByExceptionality = [];
    }

    // Ensure custom_goals exists as array and each item has retrieved_objectives
    if (!Array.isArray(generatedContent.custom_goals)) {
      generatedContent.custom_goals = [];
    }
    generatedContent.custom_goals = generatedContent.custom_goals.map(cg => ({
      ...cg,
      retrieved_objectives: Array.isArray(cg?.retrieved_objectives) ? cg.retrieved_objectives : []
    }));

    // Attach the extracted new fields to the final response
    generatedContent.recommendedAccommodations = recommendedAccommodations;
    generatedContent.academicPerformanceAchievement = academicPerformanceAchievement;

    return NextResponse.json({
      success: true,
      data: generatedContent,
      ragContext: ragContext || null
    });

  } catch (error) {
    console.error('Generate IEP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

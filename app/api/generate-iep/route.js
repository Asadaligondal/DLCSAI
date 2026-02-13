import { NextResponse } from 'next/server';

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

1) Grounding — Every goal/objective must be grounded in the provided weaknesses, PLAAFP baselines, or assessments. If missing, use placeholders.

2) Generate goals ONLY when evidenced — Only create goals when there is clear need from weaknesses, baselines, assessments, or documented functional needs. Do NOT generate goals by default.

3) Prioritize quality over quantity — 2–4 annual goals total unless input justifies more. Each annual goal should have 2–3 short-term objectives.

4) ABSOLUTE NON-DUPLICATION — This is the most critical rule:
   - annual_goals and short_term_objectives are BROAD cross-exceptionality goals applicable school-wide.
   - annualGoalsByExceptionality and shortTermObjectivesByExceptionality are TARGETED disability-impact-specific goals.
   - These two layers MUST contain completely different goals. No goal/objective may appear in both layers, even paraphrased.
   - If you find yourself writing a similar goal for both layers, make the broad layer focus on a different skill/domain than the exceptionality layer.

5) SMART enforcement — Every goal/objective must include: condition + observable behavior + measurable criterion + measurement window. Ban vague verbs unless paired with numeric criterion.

6) Accommodations linkage — Reference provided accommodations in goal conditions (e.g., "Given text-to-speech..."). Do NOT invent accommodations not in the input. Distribute them logically across goals.

Output: Return ONLY a single JSON object with exactly these top-level keys (no extra keys, no wrapper):
{
  "recommendedAccommodations": ["5-10 accommodation strings from weaknesses/PLAAFP. Prefer from selected accommodations. No duplicates."],
  "academicPerformanceAchievement": "Concise paragraph summarizing current academic achievement grounded in PLAAFP + assessments + strengths/weaknesses.",
  "plaafp_narrative": "3-4 paragraph PLAAFP narrative describing current abilities, challenges, and disability impact on learning.",
  "annual_goals": ["2-4 BROAD cross-exceptionality SMART annual goal strings"],
  "short_term_objectives": ["4-8 BROAD cross-exceptionality SMART objective strings that operationalize the annual_goals"],
  "annualGoalsByExceptionality": [{"exceptionality": "Name", "goals": [{"referenceId": "0", "goal": "Targeted exceptionality-specific SMART goal"}]}],
  "shortTermObjectivesByExceptionality": [{"exceptionality": "Name", "objectives": [{"referenceId": "0", "objective": "Targeted exceptionality-specific objective", "alignedAnnualGoalReferenceId": "0"}]}],
  "intervention_recommendations": "Detailed intervention/strategy recommendations specific to Florida standards.",
  "custom_goals": [{"title": "Custom goal title", "recommendation": "Strategy recommendation for this goal"}]
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
    console.log('IEP generation - accommodations counts:', counts, 'summary:', accommodationsSummary);

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
      '"Non-duplication is mandatory: Top-level annual_goals / short_term_objectives must be broad and cross-exceptionality; exceptionality-specific goals must be distinct and not paraphrases. Do not repeat near-identical goals/objectives anywhere. If two items would be similar, change the skill focus, condition, or measurable criterion."',
      '',
      'SMART measurability constraint',
      '"Every annual goal and objective must include: behavior + condition (may include accommodations) + criterion + measurement window. Avoid vague wording."',
      '',
      'Condition line rule (mandatory): For every annual goal and short-term objective, include an explicit condition phrase that reflects supports when relevant (e.g., "Given text-to-speech...", "With extended time...", "Using preferential seating...", "With a small-group setting...").',
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
    
    console.log('📊 New LLM fields extracted:');
    console.log('📋 recommendedAccommodations:', recommendedAccommodations);
    console.log('🎓 academicPerformanceAchievement:', academicPerformanceAchievement);

    // Ensure annualGoalsByExceptionality / shortTermObjectivesByExceptionality exist as arrays
    // The LLM is asked to produce these directly; only provide empty fallback if missing
    if (!Array.isArray(generatedContent.annualGoalsByExceptionality)) {
      generatedContent.annualGoalsByExceptionality = [];
    }
    if (!Array.isArray(generatedContent.shortTermObjectivesByExceptionality)) {
      generatedContent.shortTermObjectivesByExceptionality = [];
    }

    // Ensure custom_goals exists as array (LLM should return it, fallback if missing)
    if (!Array.isArray(generatedContent.custom_goals)) {
      generatedContent.custom_goals = [];
    }

    // Attach the extracted new fields to the final response
    generatedContent.recommendedAccommodations = recommendedAccommodations;
    generatedContent.academicPerformanceAchievement = academicPerformanceAchievement;

    return NextResponse.json({
      success: true,
      data: generatedContent
    });

  } catch (error) {
    console.error('Generate IEP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

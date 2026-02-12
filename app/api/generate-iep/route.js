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
    const systemPrompt = `You are an expert Special Education IEP writer. Receive a single JSON input (do not fetch external data). Using only the provided input values, generate a complete IEP document and a structured machine-readable output. Do NOT invent facts—if a required input is missing, insert the exact placeholder "[MISSING: <fieldName>]" where <fieldName> is the missing key.

QUALITY & CONSISTENCY RULES

Grounding (strength/weakness driven)
- Every goal/objective must be explicitly grounded in the provided weaknesses and/or plaafp baselines.
- If weaknesses/baselines are missing, insert placeholders like [MISSING: weaknesses] and still write measurable goals, but keep them generic and clearly marked.

Non-duplication (global)
- Non-duplication is mandatory across all goal/objective lists:
  annualGoals, shortTermObjectives, goalsByExceptionality.*.annualGoals, goalsByExceptionality.*.shortTermObjectives, structuredGoals, structuredObjectives, and any text inside documentMarkdown/documentHtml.
- Two items are considered duplicates if they target the same skill with similar condition + criterion (even if paraphrased).
- If two items would be similar, force divergence by changing one of: skill focus, condition, measurement method, criterion, or measurement window.

Layer separation
- annualGoals/shortTermObjectives must be broad cross-setting priorities (not exceptionality-specific language).
- goalsByExceptionality must be disability-impact-specific targets.
- Do not restate the same goal in both layers. If overlap risk occurs, make the general layer broader and the exceptionality layer narrower and different.

SMART enforcement
- Every annual goal and objective must include: condition + observable behavior + measurable criterion + measurement window.
- Ban vague verbs (e.g., "improve", "increase", "enhance") unless paired with a measurable observable behavior + numeric criterion.

Accommodations linkage (must be explicit in wording)
- Use the provided accommodations to contextualize goals/objectives.
- For each annual goal and each short-term objective: explicitly reference at least one relevant accommodation item (classroom or assessment) in the goal/objective text OR, if no relevant accommodation exists in input, append: "[MISSING: relevantAccommodation]" to that item.
- Do NOT invent new accommodations—only cite items present in accommodations.classroom or accommodations.assessment.

Input JSON schema (examples of keys you will receive):
{
  "student": { "id","firstName","lastName","dob","age","grade","studentId","primaryLanguage","exceptionality" },
  "school": { "name","district","schoolYear","caseManager","reportDate" },
  "plaafp": { "presentLevels":"", "academicBaseline":"", "functionalBaseline":"" },
  "strengths": [ "..." ],
  "weaknesses": [ "..." ],
  "assessments": [ { "name","date","score","interpretation" } ],
  "accommodations": { "classroom": [...], "assessment": [...], "consent": { ... } },
  "annualGoals": [ { "id","title","baseline","condition","behavior","criteria","measurement","frequency","staff","startDate","endDate" } ],
  "shortTermObjectives": [ { "id","goalId","text","criteria","measurement","target" } ],
  "goalsByExceptionality": { "exceptionalityName": { "annualGoals": [...], "shortTermObjectives": [...] } },
  "interventions": [ { "description","provider","frequency","duration","location" } ],
  "customGoals": [ { "title","description","category" } ],
  "services": [ { "type","provider","frequency","startDate","endDate" } ],
  "progressMonitoring": { "method","schedule","responsible" },
  "finalReview": { "readyToExport": boolean, "reviewNotes": "" },
  "signatures": { "parent":{ "name","date" }, "caseManager":{ "name","date" } }
}

QUALITY & CONSISTENCY RULES (MANDATORY)

A) Grounding (weakness/baseline driven)

Every goal/objective must be grounded in weaknesses and/or PLAAFP baselines.

If missing, insert placeholders like [MISSING: weaknesses] or [MISSING: academicBaseline].

B) Non-duplication (global)

No duplicates across: annualGoals, shortTermObjectives, goalsByExceptionality.*, structuredGoals, structuredObjectives, and text in documentMarkdown/documentHtml.

Duplicates = same skill focus with similar condition + criterion (even paraphrased).

If overlap risk occurs, force divergence by changing skill focus, condition, measurement method, criterion, or time window.

C) Layer separation

sections.annualGoals/shortTermObjectives: broad cross-setting priorities (no disability-label language).

sections.goalsByExceptionality: disability-impact-specific targets.

Do not restate same goal in both layers.

D) SMART enforcement

Each annual goal and objective must have: condition + observable behavior + measurable criterion + measurement window.

Avoid vague verbs unless paired with measurable behavior + numeric criteria.

Acceptance check: exceptionality layer does not repeat general layer; objectives aren't just restating goals.

Output requirements:
Return exactly one JSON object as the full response with these keys:

{
  "documentMarkdown": string,
  "documentHtml": string,
  "sections": {
    "header": { "title","studentFullName","studentId","grade","reportDate" },
    "studentContext": { },
    "plaafp": { "narrative","academicBaseline","functionalBaseline" },
    "annualGoals": [ ],
    "shortTermObjectives": [ ],
    "goalsByExceptionality": { },
    "interventions": [ ],
    "accommodations": { "classroom": [...], "assessment": [...], "consent": { ... } },
    "assessmentPlan": { "assessments": [...] },
    "progressMonitoring": { },
    "services": [ ],
    "finalReview": { "readyToExport", "reviewNotes" },
    "signatures": { }
  },
  "structuredGoals": [ ... ],
  "structuredObjectives": [ ... ],
  "accommodationsSummary": { ... },
  "metadata": { "generatedAtISO": "...", "version": "1.0" }
}

Formatting and content rules:
- Tone: professional, clear, concise, plain-language suitable for parent review and IEP team.
- For each annual goal produce SMART-style expectedOutcome and measurable successCriteria and a measurementMethod.
- For each short-term objective include a clear linkage to its parent goal (goalId).
- Group goals under exceptionality when provided; otherwise list under general Goals.
- For accommodations, echo exactly the provided items and group under "classroom" vs "assessment". Do not invent new accommodations.
- If dates are missing, leave the date field as "[MISSING: <dateField>]".
- Ensure section headers match these IDs (for in-page anchors): plaafp-narrative, goals-objectives-by-exceptionality, annual-goals, short-term-objectives, custom-goals, intervention-recommendations, final-review.
- Use the provided signatures object; if missing, include placeholders "[MISSING: signatureParent]" etc.
- Do not include any backend calls or instructions—this is content generation only.

Final output:
- Only output the single JSON object described above and nothing else.
- Append at the very end a literal marker line: ===OUTPUT_END===

Begin using only the input JSON you receive. Generate the IEP now.`;

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
      'Please provide a structured JSON response with these exact keys:',
      '{',
      '  "recommendedAccommodations": ["Array of 5-10 accommodation strings derived from weaknesses/PLAafp and existing accommodations catalog. No duplicates. Prefer from selected accommodations if present."],',
      '  "academicPerformanceAchievement": "Concise paragraph summarizing current academic achievement/performance grounded in plaafp + assessments + weaknesses/strengths. Use [MISSING: ...] placeholders if inputs are missing.",',
      '  "plaafp_narrative": "A detailed Present Level of Academic Achievement and Functional Performance narrative (3-4 paragraphs describing current abilities, challenges, and how disability impacts learning)",',,
      '  "annual_goals": ["Array of 3-4 BROAD, cross-exceptionality annual goals that address the student\'s overall strengths and weaknesses across domains"],',
      '  "short_term_objectives": ["Array of 6-8 SPECIFIC but BROADER short-term objectives that operationalize the annual goals at a classroom/grade level (do NOT repeat exceptionality-specific objectives here)"],',
      '  "intervention_recommendations": "Detailed recommendations for accommodations, modifications, and instructional strategies specific to Florida standards",',
      '  "custom_goals": [',
      '    // If the user provided custom goals, return an array of objects mapping each custom goal title to a recommendation.',
      '    // Example: { "title": "Improve reading fluency", "recommendation": "Use repeated readings with progress monitoring and fluency drills; provide audiobooks; set benchmark target X" }',
      '  ],',
      '  "annualGoalsByExceptionality": [',
      '    // For each provided exceptionality, return a dedicated object with targeted annual goals specific to that exceptionality',
      '    // Example: { "exceptionality": "Autism", "goals": [{ "referenceId": "0", "goal": "Improve social pragmatic skills as measured by X" }, ...] }',
      '  ],',
      '  "shortTermObjectivesByExceptionality": [',
      '    // For each exceptionality, return objectives aligned to the exceptionality-specific annual goals (do not duplicate the broader short_term_objectives above)',
      '  ]',
      '}',
      '',
      'Important instructions to ensure distinct, non-duplicated content:',
      '- Produce TWO separate layers of goals/objectives:',
      '  1) Top-level annual_goals and short_term_objectives: BROAD, cross-exceptionality goals that address the student\'s overall strengths and weaknesses and the academic/functional needs across settings. These should be applicable school-wide and not duplicate exceptionality-specific language.',
      '  2) annualGoalsByExceptionality and shortTermObjectivesByExceptionality: TARGETED, exceptionality-specific goals and objectives. For each exceptionality provided, generate focused goals/objectives addressing how that exceptionality impacts learning; map objectives to the exceptionality group\'s annual goals.',
      '- Do NOT repeat the same wording between the two layers. If an exceptionality-specific goal is essentially the same as a top-level annual goal, prefer returning a referenceId pointing to the top-level goal in annualGoalsByExceptionality instead of copying full text.',
      '- When mapping objectives to goals, use referenceId fields (string indices) to link objectives to their aligned annual goal.',
      '- If any custom goal is present, include it in custom_goals and also consider whether it should be represented as a top-level annual goal or as an exceptionality-specific goal; prefer to keep custom goals in custom_goals and reference them (by title/index) inside other structures if relevant.',
      '- Always return valid JSON only (no explanatory text). If information is missing for a specific recommendation, set a confidence field to "low" and include a clarifyingQuestion for that item.',
      '',
      'Ensure all content is audit-ready, professionally written, and compliant with Florida IEP requirements.'
    ].join('\n');

    // Call OpenAI API
    // --- Duplicate detection helpers (token-based, lightweight) ---
    const STOPWORDS = new Set(['the','and','to','of','in','with','a','an','is','are','for','on','that','this','be','as','by','at','or','from','it','was','were','will','can','may','such','these','those']);

    function normalizeTextForSim(s) {
      if (!s || typeof s !== 'string') return '';
      return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function tokensSet(s) {
      const n = normalizeTextForSim(s);
      if (!n) return new Set();
      return new Set(n.split(' ').filter(w => w && !STOPWORDS.has(w)));
    }

    function jaccardSet(a, b) {
      if (!a.size && !b.size) return 1;
      const intersection = [...a].filter(x => b.has(x)).length;
      const union = new Set([...a, ...b]).size;
      return union === 0 ? 0 : intersection / union;
    }

    function isSimilarText(a, b) {
      const na = normalizeTextForSim(a);
      const nb = normalizeTextForSim(b);
      if (!na || !nb) return false;
      // substring check
      if (na.includes(nb) || nb.includes(na)) return true;
      const ta = tokensSet(na);
      const tb = tokensSet(nb);
      const j = jaccardSet(ta, tb);
      return j >= 0.75;
    }

    function findDuplicates(output) {
      const items = [];
      try {
        // annual_goals
        if (Array.isArray(output.annual_goals)) {
          output.annual_goals.forEach((t, i) => items.push({ path: `annual_goals[${i}]`, text: String(t || '') }));
        }
        // short_term_objectives
        if (Array.isArray(output.short_term_objectives)) {
          output.short_term_objectives.forEach((t, i) => items.push({ path: `short_term_objectives[${i}]`, text: String(t || '') }));
        }
        // annualGoalsByExceptionality -> goals[].goal or .goals entries
        if (Array.isArray(output.annualGoalsByExceptionality)) {
          output.annualGoalsByExceptionality.forEach((grp, gIdx) => {
            const goals = Array.isArray(grp.goals) ? grp.goals : [];
            goals.forEach((g, i) => {
              const text = typeof g === 'string' ? g : (g && (g.goal || g.text)) || '';
              items.push({ path: `annualGoalsByExceptionality[${gIdx}].goals[${i}]`, text: String(text) });
            });
          });
        }
        // shortTermObjectivesByExceptionality -> objectives[].objective
        if (Array.isArray(output.shortTermObjectivesByExceptionality)) {
          output.shortTermObjectivesByExceptionality.forEach((grp, gIdx) => {
            const objs = Array.isArray(grp.objectives) ? grp.objectives : [];
            objs.forEach((o, i) => {
              const text = typeof o === 'string' ? o : (o && (o.objective || o.text)) || '';
              items.push({ path: `shortTermObjectivesByExceptionality[${gIdx}].objectives[${i}]`, text: String(text) });
            });
          });
        }
      } catch (e) {
        console.warn('findDuplicates parsing error', e.message || e);
      }

      const dupPaths = new Set();
      const n = items.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          try {
            if (!items[i].text || !items[j].text) continue;
            if (isSimilarText(items[i].text, items[j].text)) {
              dupPaths.add(items[i].path);
              dupPaths.add(items[j].path);
            }
          } catch (e) {
            // ignore pair errors
          }
        }
      }
      return Array.from(dupPaths);
    }

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

    // Add grouping of annual goals and short-term objectives by provided exceptionalities
    try {
      const exList = Array.isArray(exceptionalities) && exceptionalities.length > 0 ? exceptionalities : [];

      // Prepare empty grouped structures
      const annualGoalsByExceptionality = exList.map((ex) => ({ exceptionality: ex, goals: [] }));
      const shortTermObjectivesByExceptionality = exList.map((ex) => ({ exceptionality: ex, objectives: [] }));

      const annualGoals = Array.isArray(generatedContent.annual_goals) ? generatedContent.annual_goals : [];
      const objectives = Array.isArray(generatedContent.short_term_objectives) ? generatedContent.short_term_objectives : [];

      // Map each annual goal to exactly one exceptionality (round-robin) using index as referenceId
      const goalIndexToExceptionalityIndex = {};
      if (exList.length > 0 && annualGoals.length > 0) {
        annualGoals.forEach((goal, idx) => {
          const exIdx = idx % exList.length;
          goalIndexToExceptionalityIndex[idx] = exIdx;
          annualGoalsByExceptionality[exIdx].goals.push({ referenceId: String(idx), goal });
        });
      }

      // Assign objectives to annual goals (round-robin over goals) and thus to the same exceptionality group
      if (exList.length > 0 && objectives.length > 0 && annualGoals.length > 0) {
        objectives.forEach((obj, oIdx) => {
          const alignedGoalIndex = oIdx % annualGoals.length;
          const exIdx = goalIndexToExceptionalityIndex[alignedGoalIndex] ?? (alignedGoalIndex % exList.length);
          shortTermObjectivesByExceptionality[exIdx].objectives.push({
            referenceId: String(oIdx),
            objective: obj,
            alignedAnnualGoalReferenceId: String(alignedGoalIndex)
          });
        });
      }

      // Attach the new fields while preserving all existing keys
      generatedContent.annualGoalsByExceptionality = annualGoalsByExceptionality;
      generatedContent.shortTermObjectivesByExceptionality = shortTermObjectivesByExceptionality;
    } catch (e) {
      console.error('Error grouping goals/objectives by exceptionality:', e);
      // If grouping fails, return original generatedContent without the new fields
    }

      // If customGoals were provided in the request, ensure `custom_goals` exists (LLM should return it,
      // but provide an empty array fallback when missing).
      try {
        if (!Array.isArray(generatedContent.custom_goals)) {
          generatedContent.custom_goals = [];
        }
      } catch (e) {
        generatedContent.custom_goals = [];
      }

      // --- Similarity guard: detect near-duplicates and perform a single retry if needed ---
      try {
        const dupPaths = findDuplicates(generatedContent || {});
        if (dupPaths && dupPaths.length) {
          console.log('Duplicate items detected in LLM output:', dupPaths.length, 'paths:', dupPaths);

          // Prepare retry instruction including the original model output verbatim and flagged paths
          const originalModelOutput = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : JSON.stringify(generatedContent);

          const retryInstruction = [
            'The model output contained near-duplicate goals/objectives in the following locations:',
            dupPaths.join(', '),
            '',
            'Strict instruction: Rewrite ONLY the flagged items to be distinct; keep all other items unchanged; preserve schema and referenceIds; do not reduce counts; keep accommodations consistent. Return ONLY valid JSON with the same schema as before.'
          ].join('\n');

          // Call the LLM one more time, providing the original assistant content and the strict rewrite instruction
          try {
            const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                  { role: 'assistant', content: originalModelOutput },
                  { role: 'user', content: retryInstruction }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
              })
            });

            if (retryResponse && retryResponse.ok) {
              const retryData = await retryResponse.json();
              try {
                const parsedRetry = JSON.parse(retryData.choices[0].message.content);
                console.log('Similarity guard retry succeeded; using revised LLM output.');
                // replace generatedContent with parsedRetry
                generatedContent = parsedRetry;
              } catch (e) {
                console.warn('Similarity guard retry returned invalid JSON; keeping original output.', e.message || e);
                // keep original generatedContent
              }
            } else {
              console.warn('Retry LLM call failed or returned non-OK status; keeping original output.');
            }
          } catch (e) {
            console.warn('Error during similarity-guard retry call:', e.message || e);
          }
        }
      } catch (e) {
        console.warn('Similarity guard processing error:', e.message || e);
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

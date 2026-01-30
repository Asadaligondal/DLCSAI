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
      customGoals // optional: array of { title, _id? } objects supplied by the caller
    } = body;

    // Validate required fields
    if (!studentGrade || !studentAge || !areaOfNeed || !currentPerformance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // System prompt for expert guidance
    const systemPrompt = `You are an expert Special Education consultant specializing in Florida IEP (Individualized Education Program) development. Your responses must be:
- Aligned with Florida Department of Education standards and IDEA regulations
- Written in professional, audit-safe language appropriate for official IEP documents
- Specific, measurable, achievable, relevant, and time-bound (SMART)
- Free from jargon while maintaining educational accuracy
- Supportive and strength-based in tone

You must return ONLY valid JSON with no additional text or markdown formatting.`;

    // Prepare custom goals text for prompt (if provided)
    const customGoalsList = Array.isArray(customGoals) && customGoals.length > 0
      ? customGoals.map((g, i) => `${i + 1}. ${g.title || g}`).join('\n')
      : null;

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
      'Please provide a structured JSON response with these exact keys:',
      '{',
      '  "plaafp_narrative": "A detailed Present Level of Academic Achievement and Functional Performance narrative (3-4 paragraphs describing current abilities, challenges, and how disability impacts learning)",',
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
    const generatedContent = JSON.parse(data.choices[0].message.content);

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

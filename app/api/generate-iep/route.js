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
      exceptionalities // expected: array of strings, e.g. ["Specific Learning Disability", "Autism"]
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

    // User prompt with student data
    const userPrompt = `Generate a comprehensive IEP plan for a student with the following profile:

Student Grade: ${studentGrade}
Student Age: ${studentAge}
Area of Need: ${areaOfNeed}
Current Performance: ${currentPerformance}
Disability Category: ${disabilityCategory || 'Not specified'}
Instructional Setting: ${instructionalSetting}

Please provide a structured JSON response with these exact keys:
{
  "plaafp_narrative": "A detailed Present Level of Academic Achievement and Functional Performance narrative (3-4 paragraphs describing current abilities, challenges, and how disability impacts learning)",
  "annual_goals": ["Array of 3-4 measurable annual goals with specific criteria and timeframes"],
  "short_term_objectives": ["Array of 6-8 specific short-term objectives that support the annual goals"],
  "intervention_recommendations": "Detailed recommendations for accommodations, modifications, and instructional strategies specific to Florida standards"
}

Ensure all content is audit-ready, professionally written, and compliant with Florida IEP requirements.`;

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

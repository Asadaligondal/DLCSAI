import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      student,
      plaafp,
      strengths,
      weaknesses,
      accommodations,
      existingIEPSnapshot,
      customGoalsInput
    } = body;

    // Validate required fields
    if (!student || !customGoalsInput || !Array.isArray(customGoalsInput) || customGoalsInput.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: student, customGoalsInput' },
        { status: 400 }
      );
    }

    // Custom Goals Only System Prompt
    const CUSTOM_GOALS_ONLY_PROMPT = `You are an expert Special Education IEP writer focused ONLY on custom goals generation. You receive student context and existing IEP data as read-only background, but you MUST ONLY generate custom goals content.

STRICT SCOPE LIMITATION:
- Generate ONLY custom goals based on the provided customGoalsInput array
- DO NOT regenerate, modify, or reference any other IEP sections
- DO NOT output annual_goals, short_term_objectives, plaafp_narrative, intervention_recommendations, or any other IEP content

CUSTOM GOALS REQUIREMENTS:
1. Use provided student context (strengths, weaknesses, PLAAFP, accommodations) to enhance/refine the custom goals
2. Avoid duplicating existing IEP goals (use existingIEPSnapshot for reference only)
3. Each custom goal must be SMART-compliant: condition + observable behavior + measurable criterion + measurement window
4. Reference relevant accommodations when appropriate
5. If context is missing, use placeholder [MISSING: fieldName]

ANTI-DUPLICATION:
- Review existingIEPSnapshot to ensure custom goals target different skills/areas
- If overlap risk exists, modify the custom goal to focus on a different aspect, condition, or measurement method

INPUT STRUCTURE:
{
  "student": { "grade", "age", "disabilities", etc. },
  "plaafp": { "presentLevels", "academicBaseline", "functionalBaseline" },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "accommodations": { "classroom": {...}, "assessment": {...} },
  "existingIEPSnapshot": {
    "annualGoals": ["existing goal 1", "existing goal 2"],
    "shortTermObjectives": ["existing obj 1", "existing obj 2"],
    "goalsByExceptionality": {...}
  },
  "customGoalsInput": [
    { "title": "Custom Goal Title", "description": "Goal description", "category": "Academic|Behavioral|Functional" }
  ]
}

OUTPUT REQUIREMENTS:
Return EXACTLY this JSON structure and nothing else:
{
  "customGoals": [
    {
      "title": "Enhanced goal title",
      "recommendation": "SMART-compliant goal description with condition, behavior, criterion, and timeframe",
      "category": "Academic|Behavioral|Functional",
      "accommodationLinks": ["relevant accommodation 1", "relevant accommodation 2"],
      "measurementMethod": "How progress will be measured",
      "successCriteria": "Specific success criteria"
    }
  ],
  "customGoalsMarkdown": "## Custom Goals\\n\\n1. **Goal Title**: Description...",
  "customGoalsHtml": "<h2>Custom Goals</h2><ol><li><strong>Goal Title</strong>: Description...</li></ol>"
}

Rules:
- Only output the JSON object above
- Do not include any explanation or additional text
- Ensure all goals are grounded in student weaknesses/needs
- Reference accommodations explicitly when relevant
- Add measurement methods and success criteria for each goal`;

    // Build context for the prompt
    const existingGoalsContext = existingIEPSnapshot ? {
      annualGoals: existingIEPSnapshot.annualGoals || [],
      shortTermObjectives: existingIEPSnapshot.shortTermObjectives || [],
      goalsByExceptionality: existingIEPSnapshot.goalsByExceptionality || {}
    } : {};

    // User prompt with structured data
    const userPrompt = JSON.stringify({
      student: {
        grade: student.gradeLevel || student.grade,
        age: student.age,
        disabilities: student.disabilities || [],
        strengths: strengths || [],
        weaknesses: weaknesses || []
      },
      plaafp: plaafp || { presentLevels: '[MISSING: plaafp]' },
      strengths: strengths || ['[MISSING: strengths]'],
      weaknesses: weaknesses || ['[MISSING: weaknesses]'],
      accommodations: accommodations || { classroom: {}, assessment: {} },
      existingIEPSnapshot: existingGoalsContext,
      customGoalsInput: customGoalsInput
    });

    console.log('🎯 Custom Goals Generation Request:', {
      studentId: student.id || student._id,
      customGoalsCount: customGoalsInput.length,
      hasExistingSnapshot: !!existingIEPSnapshot
    });

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
          { role: 'system', content: CUSTOM_GOALS_ONLY_PROMPT },
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
        { error: 'Failed to generate custom goals' },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    let customGoalsResult = JSON.parse(data.choices[0].message.content);

    // Strict allowlist validation - only allow custom goals related keys
    const allowedKeys = ['customGoals', 'customGoalsMarkdown', 'customGoalsHtml'];
    const responseKeys = Object.keys(customGoalsResult);
    const unauthorizedKeys = responseKeys.filter(key => !allowedKeys.includes(key));
    
    if (unauthorizedKeys.length > 0) {
      console.error('🚫 Custom Goals Response Validation Failed - Unauthorized keys:', unauthorizedKeys);
      return NextResponse.json(
        { error: 'Invalid response: contains unauthorized content beyond custom goals' },
        { status: 500 }
      );
    }

    // Ensure required structure
    if (!customGoalsResult.customGoals || !Array.isArray(customGoalsResult.customGoals)) {
      customGoalsResult.customGoals = [];
    }

    console.log('✅ Custom Goals Generated Successfully:', {
      goalsCount: customGoalsResult.customGoals.length,
      hasMarkdown: !!customGoalsResult.customGoalsMarkdown,
      hasHtml: !!customGoalsResult.customGoalsHtml
    });

    return NextResponse.json({
      success: true,
      data: customGoalsResult
    });

  } catch (error) {
    console.error('Custom Goals Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
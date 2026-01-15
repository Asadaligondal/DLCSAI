import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { studentData, currentGoals } = body;

    // Validate required fields
    if (!studentData || !currentGoals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // System prompt for expert guidance
    const systemPrompt = `You are a Special Education expert specializing in Florida IEP services and accommodations. Based on the student's disability and the provided Annual Goals, recommend specific:
1. Related Services (e.g., Speech Therapy, Occupational Therapy, Counseling)
2. Accommodations (classroom and testing)
3. Least Restrictive Environment (LRE) justifications

Your response must be:
- Aligned with Florida Department of Education standards and IDEA regulations
- Professional and audit-safe language appropriate for official IEP documents
- Specific and actionable recommendations
- Supportive of the student's access to the general education curriculum

Format your response as a well-organized professional document with clear sections.`;

    // User prompt with student data
    const userPrompt = `Generate comprehensive Services and Recommendations for a student with the following profile:

Student Information:
- Name: ${studentData.name}
- Grade: ${studentData.gradeLevel}
- Age: ${studentData.age}
- Disability Category: ${studentData.disabilities?.join(', ') || 'Not specified'}
- Area of Need: ${studentData.areaOfNeed || 'Not specified'}
- Instructional Setting: ${studentData.instructionalSetting || 'General Education'}

Current Annual Goals:
${currentGoals}

Please provide detailed recommendations for:
1. **Related Services**: Specify type, frequency, duration, and provider
2. **Accommodations**: List specific classroom accommodations and testing accommodations
3. **Modifications**: If needed, describe curriculum modifications
4. **LRE Justification**: Explain why the recommended setting is the least restrictive environment appropriate for this student

Format the output as a professional IEP document section.`;

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
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate services recommendations' },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    const generatedContent = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      data: generatedContent
    });

  } catch (error) {
    console.error('Generate Services Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

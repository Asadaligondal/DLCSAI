import { NextResponse } from 'next/server';
import { getRagContext } from '@/lib/ragContext';
import { SYSTEM_PROMPT, buildUserPrompt, postProcessGeneratedContent } from '@/lib/generateIEPShared';

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

    // Prepare custom goals text for prompt (if provided)
    const customGoalsList = Array.isArray(customGoals) && customGoals.length > 0
      ? customGoals.map((g, i) => `${i + 1}. ${g.title || g}`).join('\n')
      : null;

    // Single student fetch for accommodations, weaknesses, strengths (avoids duplicate DB round-trips)
    let accommodationsRaw = student_accommodations || null;
    let weaknesses = [];
    let strengths = [];
    try {
      if (studentId) {
        const connectDB = (await import('@/lib/mongodb')).default;
        const Student = (await import('@/models/Student')).default;
        await connectDB();
        const stu = await Student.findById(studentId).lean();
        if (stu) {
          if (!accommodationsRaw && stu.student_accommodations) accommodationsRaw = stu.student_accommodations;
          if (stu.weaknesses) weaknesses = Array.isArray(stu.weaknesses) ? stu.weaknesses : [];
          if (stu.strengths) strengths = Array.isArray(stu.strengths) ? stu.strengths : [];
        }
      }
    } catch (e) {
      console.warn('Could not load student from DB:', e.message || e);
    }

    const { normalizeAccommodations } = await import('@/lib/accommodations');
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

    const ragResult = await getRagContext({
      exceptionalities: exceptionalities || [],
      weaknesses,
      strengths,
      customGoals: customGoals || [],
      accommodations: accommodationLabels,
      instructionalSetting: instructionalSetting || ''
    });

    const ragContext = ragResult?.flat || '';
    const ragContextByQuery = ragResult?.byQuery || [];

    if (ragContext) {
      console.log('[RAG] Sending institutional context to LLM (', ragContext.length, 'chars )');
    } else {
      console.log('[RAG] No institutional context — proceeding without RAG.');
    }

    const userPrompt = buildUserPrompt({
      studentGrade,
      studentAge,
      areaOfNeed,
      currentPerformance,
      disabilityCategory,
      instructionalSetting,
      customGoalsList,
      accommodations,
      accommodationsSummary,
      ragContext,
      ragContextByQuery
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
          { role: 'system', content: SYSTEM_PROMPT },
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
    generatedContent = postProcessGeneratedContent(generatedContent);

    return NextResponse.json({
      success: true,
      data: generatedContent,
      ragContext: ragContext || null,
      ragContextByQuery: ragContextByQuery
    });

  } catch (error) {
    console.error('Generate IEP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

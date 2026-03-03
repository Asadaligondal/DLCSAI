import { getRagContext } from '@/lib/ragContext';
import { SYSTEM_PROMPT, buildUserPrompt, postProcessGeneratedContent } from '@/lib/generateIEPShared';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req) {
  const encoder = new TextEncoder();
  let streamController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
    }
  });

  (async () => {
    try {
      const body = await req.json();
      const {
        studentGrade,
        studentAge,
        areaOfNeed,
        currentPerformance,
        disabilityCategory,
        instructionalSetting,
        exceptionalities,
        customGoals,
        studentId,
        student_accommodations
      } = body;

      if (!studentGrade || !studentAge || !areaOfNeed || !currentPerformance) {
        streamController.enqueue(encoder.encode(sseEvent({ stage: 'error', error: 'Missing required fields' })));
        streamController.close();
        return;
      }

      // Stage 1: Retrieving context
      streamController.enqueue(encoder.encode(sseEvent({ stage: 'retrieving_context' })));

      const customGoalsList = Array.isArray(customGoals) && customGoals.length > 0
        ? customGoals.map((g, i) => `${i + 1}. ${g.title || g}`).join('\n')
        : null;

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

      const categories = ['presentation', 'response', 'scheduling', 'setting', 'assistive_technology_device'];
      const counts = { classroom: {}, assessment: {} };
      categories.forEach(cat => {
        counts.classroom[cat] = (accommodations.classroom[cat] || []).length;
        counts.assessment[cat] = (accommodations.assessment[cat] || []).length;
      });
      const summaryParts = [];
      summaryParts.push('Classroom: ' + categories.map(c => `${c.charAt(0).toUpperCase() + c.slice(1)}(${counts.classroom[c]})`).join(', '));
      summaryParts.push('Assessment: ' + categories.map(c => `${c.charAt(0).toUpperCase() + c.slice(1)}(${counts.assessment[c]})`).join(', '));
      summaryParts.push('ConsentObtained: ' + (accommodations.consent && accommodations.consent.parentConsentObtained ? 'true' : 'false'));
      const accommodationsSummary = summaryParts.join('. ');

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

      // Stage 2: Generating IEP
      streamController.enqueue(encoder.encode(sseEvent({ stage: 'generating_iep' })));

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

      console.log('[IEP-Stream] Prompt sizes — system:', SYSTEM_PROMPT.length, 'chars, user:', userPrompt.length, 'chars, total:', SYSTEM_PROMPT.length + userPrompt.length, 'chars');
      console.log('[IEP-Stream] RAG context:', ragContext ? ragContext.length : 0, 'chars,', ragContextByQuery.length, 'query groups');

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
          max_tokens: 16384,
          stream: true,
          response_format: { type: 'json_object' }
        })
      });

      if (!openaiResponse.ok) {
        const err = await openaiResponse.json();
        streamController.enqueue(encoder.encode(sseEvent({ stage: 'error', error: err.error?.message || 'OpenAI API failed' })));
        streamController.close();
        return;
      }

      const reader = openaiResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
            } catch (_) {}
          }
        }
      }

      let generatedContent;
      try {
        generatedContent = JSON.parse(fullContent);
      } catch (e) {
        streamController.enqueue(encoder.encode(sseEvent({ stage: 'error', error: 'Failed to parse IEP JSON' })));
        streamController.close();
        return;
      }

      const processed = postProcessGeneratedContent(generatedContent);

      streamController.enqueue(encoder.encode(sseEvent({
        stage: 'done',
        data: processed,
        ragContext: ragContext || null,
        ragContextByQuery: ragContextByQuery || []
      })));
    } catch (error) {
      console.error('Generate IEP Stream Error:', error);
      streamController.enqueue(encoder.encode(sseEvent({ stage: 'error', error: error.message || 'Internal server error' })));
    } finally {
      streamController.close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

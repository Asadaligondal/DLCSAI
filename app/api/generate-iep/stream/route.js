import { getRagContext } from '@/lib/ragContext';
import { generateIEPParallel } from '@/lib/generateIEPShared';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req) {
  const encoder = new TextEncoder();
  let streamController;
  let streamClosed = false;

  function send(data) {
    if (streamClosed) return;
    try { streamController.enqueue(encoder.encode(sseEvent(data))); } catch { streamClosed = true; }
  }
  function closeStream() {
    if (streamClosed) return;
    streamClosed = true;
    try { streamController.close(); } catch { /* already closed */ }
  }

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
    },
    cancel() {
      streamClosed = true;
    }
  });

  (async () => {
    try {
      const body = await req.json();
      const {
        studentGrade, studentAge, areaOfNeed, currentPerformance,
        disabilityCategory, instructionalSetting,
        exceptionalities, customGoals, studentId, student_accommodations,
        ragStrategy = 'baseline'
      } = body;

      if (!studentGrade || !studentAge || !areaOfNeed || !currentPerformance) {
        send({ stage: 'error', error: 'Missing required fields' });
        closeStream();
        return;
      }

      send({ stage: 'retrieving_context' });

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

      // Extract accommodation labels for RAG + prompt
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

      const validStrategies = ['baseline', 'grouped', 'section_aligned'];
      const strategy = validStrategies.includes(ragStrategy) ? ragStrategy : 'baseline';

      const ragResult = await getRagContext({
        exceptionalities: exceptionalities || [],
        weaknesses,
        strengths,
        customGoals: customGoals || [],
        accommodations: accommodationLabels,
        instructionalSetting: instructionalSetting || ''
      }, strategy);

      const ragContext = ragResult?.flat || '';
      const ragContextByQuery = ragResult?.byQuery || [];
      const ragMetrics = ragResult?.metrics || {};

      send({ stage: 'generating_iep' });

      let sectionsCompleted = 0;
      const totalSections = 5;

      const processed = await generateIEPParallel({
        studentGrade, studentAge, areaOfNeed, currentPerformance,
        disabilityCategory, instructionalSetting,
        customGoalsList,
        accommodationsList: accommodationLabels.join(', '),
        ragContextByQuery,
        strategy,
        ragMetrics,
        onSectionComplete(key, label, error) {
          sectionsCompleted++;
          send({
            stage: 'generating_iep',
            progress: `${label} ${error ? 'failed' : 'done'} (${sectionsCompleted}/${totalSections})`,
            sectionsCompleted,
            totalSections
          });
        }
      });

      send({
        stage: 'done',
        data: processed,
        ragContext: ragContext || null,
        ragContextByQuery: ragContextByQuery || [],
        ragMetrics
      });
    } catch (error) {
      console.error('Generate IEP Stream Error:', error);
      send({ stage: 'error', error: error.message || 'Internal server error' });
    } finally {
      closeStream();
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

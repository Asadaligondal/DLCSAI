/**
 * Shared logic for IEP generation — parallel section-based architecture.
 * Each IEP section gets its own focused LLM call with only the relevant context chunks.
 */

const OPENAI_MODEL = 'gpt-4o';

// ---------------------------------------------------------------------------
// Helper: student profile string (shared across all section prompts)
// ---------------------------------------------------------------------------
function buildStudentProfile({ studentGrade, studentAge, areaOfNeed, currentPerformance, disabilityCategory, instructionalSetting }) {
  return [
    `Student Grade: ${studentGrade}`,
    `Student Age: ${studentAge}`,
    `Area of Need: ${areaOfNeed}`,
    `Current Performance: ${currentPerformance}`,
    `Disability Category: ${disabilityCategory || 'Not specified'}`,
    `Instructional Setting: ${instructionalSetting}`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Helper: format context chunks into text
// ---------------------------------------------------------------------------
function formatChunks(chunks) {
  if (!chunks || chunks.length === 0) return '';
  return chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
}

// ---------------------------------------------------------------------------
// Label remapping: maps baseline contextLabels to each strategy's actual labels
// ---------------------------------------------------------------------------
const LABEL_REMAP = {
  baseline: null, // no remap needed — labels match directly
  grouped: {
    'Exceptionalities': ['Student Needs'],
    'Weaknesses': ['Student Needs'],
    'Accommodations': ['Support Context'],
    'Custom Goals': ['Custom Goals'],
    'Strengths': ['Strengths'],
    'Instructional Setting': ['Support Context']
  }
};

// ---------------------------------------------------------------------------
// Helper: extract chunks by label from ragContextByQuery, strategy-aware
// ---------------------------------------------------------------------------
function getChunksByLabels(ragContextByQuery, labels, strategy = 'baseline') {
  if (!Array.isArray(ragContextByQuery)) return [];

  let effectiveLabels;

  if (LABEL_REMAP[strategy]) {
    const remap = LABEL_REMAP[strategy];
    const expanded = new Set();
    for (const l of labels) {
      const mapped = remap[l];
      if (mapped) mapped.forEach(m => expanded.add(m.toLowerCase()));
      else expanded.add(l.toLowerCase());
    }
    effectiveLabels = Array.from(expanded);
  } else {
    effectiveLabels = labels.map(l => l.toLowerCase());
  }

  const labelSet = new Set(effectiveLabels);
  const chunks = [];
  for (const group of ragContextByQuery) {
    if (labelSet.has((group.label || '').toLowerCase())) {
      chunks.push(...(group.chunks || []));
    }
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Section definitions: system prompt + user prompt builder + output keys
// ---------------------------------------------------------------------------

const SECTIONS = {
  exceptionality_goals: {
    label: 'Goals by Exceptionality',
    systemPrompt: `You are an expert Special Education IEP writer. You will receive a student profile and a GOAL BANK containing pre-written goals and objectives organized by Content Strands.

YOUR TASK: Generate disability-specific annual goals and short-term objectives grouped by exceptionality.

RULES:
1) COPY FROM CONTEXT — For every Content Strand that matches the student's exceptionalities, include the Annual Goal and ALL its relevant Objectives. Copy closely — fill blanks, remove underscores, refine into complete sentences. Each objective in the context = one objective in the output. There is NO limit.
2) Do NOT paraphrase into vague language. Keep the specific observable actions from the source.
3) Do NOT add percentages, trial counts, or measurement windows unless they appear in the context.
4) Never output raw templates with blanks like "________". Convert to clean professional sentences.
5) Each exceptionality should have multiple goals covering DIFFERENT domains (e.g., expressive language, receptive language, articulation, fine motor, visual motor).
6) Reference provided accommodations as conditions (e.g., "Given text-to-speech...") when relevant.

Output ONLY valid JSON:
{
  "annualGoalsByExceptionality": [{"exceptionality": "Name", "goals": [{"referenceId": "0", "goal": "Goal text"}]}],
  "shortTermObjectivesByExceptionality": [{"exceptionality": "Name", "objectives": [{"referenceId": "0", "objective": "Objective text", "alignedAnnualGoalReferenceId": "0"}]}]
}`,
    contextLabels: ['Exceptionalities'],
    buildUserPrompt({ studentProfile, contextText, accommodationsList }) {
      return [
        studentProfile,
        '',
        accommodationsList ? `Accommodations available: ${accommodationsList}` : '',
        '',
        'GOAL BANK CONTEXT (use these as your primary source — copy and adapt):',
        contextText || '(No context available — generate based on student profile only)',
        '',
        'Generate goals and objectives for EACH exceptionality listed in the student profile. Include ALL relevant goals and objectives from the context. Return valid JSON only.'
      ].join('\n');
    },
    outputKeys: ['annualGoalsByExceptionality', 'shortTermObjectivesByExceptionality']
  },

  broad_goals: {
    label: 'Broad Annual Goals & Objectives',
    systemPrompt: `You are an expert Special Education IEP writer following Florida IEP standards. You will receive a student profile and a GOAL BANK containing pre-written goals and objectives.

YOUR TASK: Generate BROAD cross-exceptionality STRUCTURED annual goals and short-term objectives/benchmarks.

ANNUAL GOAL FORMAT — every goal MUST have ALL of these fields:
• domain — one of: "Curriculum and Learning Environment", "Social or Emotional Behavior", "Independent Functioning", "Communication", "Health Care"
• condition — the context in which the student performs (e.g., "Given a 4-function calculator", "Given 20 minutes of play time", "Using a graphic organizer")
• observable_behavior — the specific, clearly observable skill or action the student will demonstrate (e.g., "will solve 10 one-step word problems using addition and subtraction")
• mastery_criteria — how well/often/how many to demonstrate mastery (e.g., "with 90% accuracy on 3 consecutive weekly trials", "on 3 out of 4 trials over a 2-week period")
• goal — the FULL goal sentence combining condition + observable_behavior + mastery_criteria into one professional statement
• progress_measurement — one of: "Curriculum Based Assessments", "Teacher-Developed Checklist or Chart", "Teacher-Developed Tests", "Rubric", "Documented Observation", "Student Assignments", "Graded Work Sample", "Unit/Chapter Tests", "Standardized Test", "Other"
• progress_reporting — one of: "Concurrent with report card", "Quarterly", "Every 4.5 weeks", "Every 6 weeks", "Every Semester"

SHORT-TERM OBJECTIVE/BENCHMARK FORMAT — intermediate measurable steps toward a goal:
• aligned_goal_index — zero-based index of the parent annual goal this objective supports
• condition — the condition under which the student performs
• observable_behavior — the intermediate skill or behavior
• mastery_criteria — the criteria for this intermediate step (typically lower than the annual goal)
• objective — the FULL objective sentence combining the above three fields

EXAMPLE (format template only — actual content comes from context):
Annual Goal:
  domain: "Curriculum and Learning Environment"
  condition: "Given a 4-function calculator"
  observable_behavior: "Polly will solve 10 one-step word problems using addition and subtraction"
  mastery_criteria: "with 90% accuracy on 3 consecutive weekly trials"
  goal: "Given a 4-function calculator, Polly will solve 10 one-step word problems using addition and subtraction with 90% accuracy on 3 consecutive weekly trials"
  progress_measurement: "Curriculum Based Assessments"
  progress_reporting: "Quarterly"

Short-Term Objective:
  aligned_goal_index: 0
  condition: "Given a number line and manipulatives"
  observable_behavior: "Polly will solve 5 one-step addition problems within 20"
  mastery_criteria: "with 80% accuracy on 2 consecutive trials"
  objective: "Given a number line and manipulatives, Polly will solve 5 one-step addition problems within 20 with 80% accuracy on 2 consecutive trials"

RULES:
1) COPY FROM CONTEXT — For every Content Strand that matches the student's weaknesses or needs, include the Annual Goal and ALL its relevant Objectives. Adapt closely — fill blanks, remove underscores, decompose into structured fields. Each objective = one output item. There is NO limit.
2) These are BROAD goals, not disability-specific. Cover domains like reading readiness, math operations, measurement, writing, fine motor, visual motor, etc.
3) Keep the specific observable actions from the source. Do NOT paraphrase into vague language.
4) Never output raw templates with blanks like "________". Convert to clean professional sentences.
5) Reference accommodations as conditions when relevant.
6) Each annual goal MUST have at least one aligned short-term objective.
7) Choose progress_measurement and progress_reporting that best fit the goal domain and skill type.

Output ONLY valid JSON:
{
  "annual_goals": [
    {
      "domain": "...",
      "condition": "...",
      "observable_behavior": "...",
      "mastery_criteria": "...",
      "goal": "Full goal sentence",
      "progress_measurement": "...",
      "progress_reporting": "..."
    }
  ],
  "short_term_objectives": [
    {
      "aligned_goal_index": 0,
      "condition": "...",
      "observable_behavior": "...",
      "mastery_criteria": "...",
      "objective": "Full objective sentence"
    }
  ]
}`,
    contextLabels: ['Weaknesses'],
    buildUserPrompt({ studentProfile, contextText, accommodationsList }) {
      return [
        studentProfile,
        '',
        accommodationsList ? `Accommodations available: ${accommodationsList}` : '',
        '',
        'GOAL BANK CONTEXT (use these as your primary source — copy, adapt, and structure):',
        contextText || '(No context available — generate based on student profile only)',
        '',
        'Generate BROAD structured annual goals and short-term objectives. Include ALL relevant Content Strands from the context. Every goal must have domain, condition, observable_behavior, mastery_criteria, progress_measurement, and progress_reporting. Every objective must link to a goal via aligned_goal_index. Return valid JSON only.'
      ].join('\n');
    },
    outputKeys: ['annual_goals', 'short_term_objectives']
  },

  narratives: {
    label: 'PLAAFP & Academic Performance',
    systemPrompt: `You are an expert Special Education IEP writer. You will receive a student profile and institutional context.

YOUR TASK: Write two detailed narratives:
1) plaafp_narrative — Present Levels of Academic Achievement and Functional Performance. Describe the student's current abilities, challenges, and disability impact. Reference specific skill areas from the context.
2) academicPerformanceAchievement — A detailed paragraph describing current academic achievement using standards-aligned language from the context.

RULES:
1) Use language and specific skill descriptions from the provided context.
2) Reference specific domains (reading, math, fine motor, communication, etc.) with detail from the context.
3) Be specific — name the skills, not just "struggles with academics."
4) Write professionally, suitable for parent review and IEP team.

Output ONLY valid JSON:
{
  "plaafp_narrative": "Detailed PLAAFP narrative...",
  "academicPerformanceAchievement": "Detailed academic achievement paragraph..."
}`,
    contextLabels: ['Exceptionalities', 'Weaknesses', 'Strengths'],
    buildUserPrompt({ studentProfile, contextText }) {
      return [
        studentProfile,
        '',
        'INSTITUTIONAL CONTEXT (use specific skill descriptions from here):',
        contextText || '(No context available — generate based on student profile only)',
        '',
        'Write both narratives with rich detail drawn from the context. Return valid JSON only.'
      ].join('\n');
    },
    outputKeys: ['plaafp_narrative', 'academicPerformanceAchievement']
  },

  accommodations_interventions: {
    label: 'Accommodations & Interventions',
    systemPrompt: `You are an expert Special Education IEP writer. You will receive a student profile, their selected accommodations, and institutional context.

YOUR TASK: Generate two things:
1) recommendedAccommodations — Complete accommodation sentences. Include ALL accommodations from the input, each phrased as "Given...", "With...", or "Using...". Add any additional ones evidenced by the context.
2) intervention_recommendations — An ARRAY of specific, actionable intervention strategies. Each string should be one specific strategy copied or closely adapted from the context. NOT generic advice — specific methods, techniques, and evidence-based practices.

RULES:
1) Every input accommodation must appear in the output as a complete sentence.
2) Interventions should be specific and actionable, drawn from the context.
3) Include as many relevant interventions as the context supports. No limit.

Output ONLY valid JSON:
{
  "recommendedAccommodations": ["Given...", "With...", "Using..."],
  "intervention_recommendations": ["Specific intervention 1", "Specific intervention 2", "..."]
}`,
    contextLabels: ['Accommodations', 'Instructional Setting'],
    buildUserPrompt({ studentProfile, contextText, accommodationsList }) {
      return [
        studentProfile,
        '',
        `Selected accommodations to include: ${accommodationsList || 'None specified'}`,
        '',
        'INSTITUTIONAL CONTEXT (draw interventions and strategies from here):',
        contextText || '(No context available — generate based on student profile only)',
        '',
        'Generate accommodations and intervention recommendations. Return valid JSON only.'
      ].join('\n');
    },
    outputKeys: ['recommendedAccommodations', 'intervention_recommendations']
  },

  custom_goals: {
    label: 'Custom Goals',
    systemPrompt: `You are an expert Special Education IEP writer. You will receive a student profile and context from a goal bank related to the student's custom goals.

YOUR TASK: For each custom goal, generate a recommendation strategy and retrieve ALL relevant objectives from the context.

RULES:
1) Each custom goal should have a specific strategy recommendation drawn from the context.
2) Retrieved objectives should be copied closely from the context — fill blanks, remove underscores.
3) Include ALL relevant objectives, not just 1-2. No limit.

Output ONLY valid JSON:
{
  "custom_goals": [{"title": "Goal title", "recommendation": "Strategy from context", "retrieved_objectives": ["Objective 1", "Objective 2", "..."]}]
}`,
    contextLabels: ['Custom Goals'],
    buildUserPrompt({ studentProfile, contextText, customGoalsList }) {
      return [
        studentProfile,
        '',
        customGoalsList ? `Custom goals to address:\n${customGoalsList}` : 'No custom goals specified.',
        '',
        'GOAL BANK CONTEXT (retrieve objectives from here):',
        contextText || '(No context available)',
        '',
        'Generate custom goal recommendations with retrieved objectives. Return valid JSON only.'
      ].join('\n');
    },
    outputKeys: ['custom_goals']
  }
};

// ---------------------------------------------------------------------------
// Single section LLM call
// ---------------------------------------------------------------------------
async function callSectionLLM(sectionKey, { studentProfile, ragContextByQuery, accommodationsList, customGoalsList, apiKey, strategy = 'baseline', sectionMetrics }) {
  const section = SECTIONS[sectionKey];
  if (!section) throw new Error(`Unknown section: ${sectionKey}`);

  const lookupLabels = section.contextLabels;
  const chunks = getChunksByLabels(ragContextByQuery, lookupLabels, strategy);
  const contextText = formatChunks(chunks);

  // Record per-section metrics
  if (sectionMetrics) {
    sectionMetrics.chunksPerSection[sectionKey] = chunks.length;
    sectionMetrics.contextCharsPerSection[sectionKey] = contextText.length;
  }

  const userPrompt = section.buildUserPrompt({
    studentProfile,
    contextText,
    accommodationsList,
    customGoalsList
  });

  console.log(`[IEP-${sectionKey}] Context: ${chunks.length} chunks, ${contextText.length} chars`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: section.systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 16384,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error for ${sectionKey}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty response for ${sectionKey}`);

  return JSON.parse(content);
}

// ---------------------------------------------------------------------------
// Run all sections in parallel, merge results
// ---------------------------------------------------------------------------
export async function generateIEPParallel({
  studentGrade, studentAge, areaOfNeed, currentPerformance,
  disabilityCategory, instructionalSetting,
  customGoalsList, accommodationsList, ragContextByQuery,
  onSectionComplete, strategy = 'baseline', ragMetrics
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const studentProfile = buildStudentProfile({
    studentGrade, studentAge, areaOfNeed, currentPerformance,
    disabilityCategory, instructionalSetting
  });

  // Mutable object for collecting per-section chunk counts
  const sectionMetrics = {
    chunksPerSection: {},
    contextCharsPerSection: {}
  };

  const sharedArgs = { studentProfile, ragContextByQuery, accommodationsList, customGoalsList, apiKey, strategy, sectionMetrics };

  const sectionKeys = Object.keys(SECTIONS);
  const results = {};

  const promises = sectionKeys.map(async (key) => {
    try {
      const result = await callSectionLLM(key, sharedArgs);
      results[key] = result;
      if (onSectionComplete) onSectionComplete(key, SECTIONS[key].label);
      return { key, success: true, result };
    } catch (err) {
      console.error(`[IEP-${key}] Failed:`, err.message);
      results[key] = {};
      if (onSectionComplete) onSectionComplete(key, SECTIONS[key].label, err.message);
      return { key, success: false, error: err.message };
    }
  });

  await Promise.all(promises);

  // Attach per-section metrics to ragMetrics if provided
  if (ragMetrics) {
    ragMetrics.chunksPerSection = sectionMetrics.chunksPerSection;
    ragMetrics.contextCharsPerSection = sectionMetrics.contextCharsPerSection;
  }

  return mergeResults(results);
}

// ---------------------------------------------------------------------------
// Merge section results into one IEP object + post-process
// ---------------------------------------------------------------------------
function mergeResults(results) {
  const merged = {
    annualGoalsByExceptionality: [],
    shortTermObjectivesByExceptionality: [],
    annual_goals: [],
    short_term_objectives: [],
    plaafp_narrative: '',
    academicPerformanceAchievement: '',
    recommendedAccommodations: [],
    intervention_recommendations: '',
    custom_goals: []
  };

  // Exceptionality goals
  if (results.exceptionality_goals) {
    merged.annualGoalsByExceptionality = results.exceptionality_goals.annualGoalsByExceptionality || [];
    merged.shortTermObjectivesByExceptionality = results.exceptionality_goals.shortTermObjectivesByExceptionality || [];
  }

  // Broad goals
  if (results.broad_goals) {
    merged.annual_goals = results.broad_goals.annual_goals || [];
    merged.short_term_objectives = results.broad_goals.short_term_objectives || [];
  }

  // Narratives
  if (results.narratives) {
    merged.plaafp_narrative = results.narratives.plaafp_narrative || '';
    merged.academicPerformanceAchievement = results.narratives.academicPerformanceAchievement || '';
  }

  // Accommodations & interventions
  if (results.accommodations_interventions) {
    merged.recommendedAccommodations = results.accommodations_interventions.recommendedAccommodations || [];
    const ir = results.accommodations_interventions.intervention_recommendations;
    if (Array.isArray(ir)) {
      merged.intervention_recommendations = ir.map(s => `• ${s.trim()}`).join('\n');
    } else if (typeof ir === 'string') {
      merged.intervention_recommendations = ir;
    }
  }

  // Custom goals
  if (results.custom_goals) {
    merged.custom_goals = results.custom_goals.custom_goals || [];
  }

  return postProcessGeneratedContent(merged);
}

// ---------------------------------------------------------------------------
// Post-process: ensure correct types, no artificial limits
// ---------------------------------------------------------------------------
export function postProcessGeneratedContent(generatedContent) {
  if (!Array.isArray(generatedContent.recommendedAccommodations)) {
    generatedContent.recommendedAccommodations = [];
  }
  if (typeof generatedContent.academicPerformanceAchievement !== 'string') {
    generatedContent.academicPerformanceAchievement = '';
  }
  if (!Array.isArray(generatedContent.annual_goals)) {
    generatedContent.annual_goals = [];
  } else {
    generatedContent.annual_goals = generatedContent.annual_goals.map((g) => {
      if (typeof g === 'string') return { goal: g, domain: '', condition: '', observable_behavior: '', mastery_criteria: '', progress_measurement: '', progress_reporting: '' };
      return {
        domain: g.domain || '',
        condition: g.condition || '',
        observable_behavior: g.observable_behavior || '',
        mastery_criteria: g.mastery_criteria || '',
        goal: g.goal || [g.condition, g.observable_behavior, g.mastery_criteria].filter(Boolean).join(' '),
        progress_measurement: g.progress_measurement || '',
        progress_reporting: g.progress_reporting || ''
      };
    });
  }
  if (!Array.isArray(generatedContent.short_term_objectives)) {
    generatedContent.short_term_objectives = [];
  } else {
    generatedContent.short_term_objectives = generatedContent.short_term_objectives.map((o) => {
      if (typeof o === 'string') return { objective: o, aligned_goal_index: -1, condition: '', observable_behavior: '', mastery_criteria: '' };
      return {
        aligned_goal_index: typeof o.aligned_goal_index === 'number' ? o.aligned_goal_index : -1,
        condition: o.condition || '',
        observable_behavior: o.observable_behavior || '',
        mastery_criteria: o.mastery_criteria || '',
        objective: o.objective || o.text || [o.condition, o.observable_behavior, o.mastery_criteria].filter(Boolean).join(' ')
      };
    });
  }

  if (!Array.isArray(generatedContent.annualGoalsByExceptionality)) {
    generatedContent.annualGoalsByExceptionality = [];
  } else {
    generatedContent.annualGoalsByExceptionality = generatedContent.annualGoalsByExceptionality.map((g) => ({
      ...g,
      goals: Array.isArray(g.goals) ? g.goals : []
    }));
  }
  if (!Array.isArray(generatedContent.shortTermObjectivesByExceptionality)) {
    generatedContent.shortTermObjectivesByExceptionality = [];
  } else {
    generatedContent.shortTermObjectivesByExceptionality = generatedContent.shortTermObjectivesByExceptionality.map((s) => ({
      ...s,
      objectives: Array.isArray(s.objectives) ? s.objectives : []
    }));
  }
  if (!Array.isArray(generatedContent.custom_goals)) {
    generatedContent.custom_goals = [];
  } else {
    generatedContent.custom_goals = generatedContent.custom_goals.map((cg) => ({
      ...cg,
      retrieved_objectives: Array.isArray(cg?.retrieved_objectives) ? cg.retrieved_objectives : []
    }));
  }

  if (Array.isArray(generatedContent.intervention_recommendations)) {
    generatedContent.intervention_recommendations = generatedContent.intervention_recommendations
      .map(s => `• ${s.trim()}`)
      .join('\n');
  } else if (typeof generatedContent.intervention_recommendations !== 'string') {
    generatedContent.intervention_recommendations = '';
  }

  return generatedContent;
}

// ---------------------------------------------------------------------------
// Exports for backward compatibility (used by non-streaming route)
// ---------------------------------------------------------------------------
export { SECTIONS, OPENAI_MODEL };

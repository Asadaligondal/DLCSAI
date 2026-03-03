/**
 * Shared logic for IEP generation (used by both regular and streaming routes).
 * Extracted to avoid duplication.
 */

export const SYSTEM_PROMPT = `You are an expert Special Education IEP writer. You receive a JSON input with student data and retrieved institutional context (a goal bank). Your job is to SELECT, ADAPT, and INCLUDE as many relevant goals and objectives from the context as possible for this student. Do NOT invent facts—if a required input is missing, insert "[MISSING: <fieldName>]".

RULES (MANDATORY — follow in this priority order)

1) COPY FROM CONTEXT — This is the most important rule.
   The institutional context contains a goal bank organized by Content Strands with Annual Goals and numbered Objectives.
   For EVERY Content Strand in the context that matches the student's weaknesses, exceptionalities, or needs:
     a) Include the Annual Goal (with blanks filled in and template text refined into complete sentences).
     b) Include ALL of its numbered Objectives that are relevant to the student—copy them closely, filling in blanks and removing underscores.
     c) Do NOT summarize multiple objectives into one. Each objective in the context = one objective in the output.
     d) Do NOT paraphrase into vague language. Keep the specific, observable actions from the source (e.g., "Retell stories read aloud identifying key characters and events" NOT "improve literacy skills").
   If the context has 15 relevant objectives for reading, output all 15. If it has 8 for fine motor, output all 8. There is NO limit.

2) Refine templates — Never output raw templates with blanks like "________" or "at _________ level" or "as measured by __________". Convert into clean, professional sentences. Light rephrasing for fluency is fine but preserve the specific actions and skills from the original.

3) No invented metrics — Do NOT add percentages (e.g., "80% accuracy"), trial counts (e.g., "4 out of 5 trials"), or measurement windows unless they appear verbatim in the context or input.

4) Two-layer structure (non-duplication):
   - annual_goals + short_term_objectives = BROAD cross-exceptionality goals covering academic and functional domains (reading, math, fine motor, visual motor, etc.).
   - annualGoalsByExceptionality + shortTermObjectivesByExceptionality = TARGETED goals specific to each disability category's impact.
   - These layers should cover different skills where possible. If a domain must appear in both, use different specific objectives.

5) Accommodations linkage — Reference provided accommodations as conditions in goals (e.g., "Given text-to-speech...", "With manipulatives...") when relevant. Do NOT invent accommodations.

6) Field mapping from context sections:
   - EXCEPTIONALITIES chunks → annualGoalsByExceptionality, shortTermObjectivesByExceptionality
   - WEAKNESSES chunks → annual_goals, short_term_objectives
   - ACCOMMODATIONS chunks → goal conditions, recommendedAccommodations
   - CUSTOM GOALS chunks → custom_goals, retrieved_objectives
   - STRENGTHS chunks → plaafp_narrative, leverage in goals
   - ALL relevant chunks → intervention_recommendations (list specific strategies, methods, and evidence-based practices from the context)

7) plaafp_narrative — Write a detailed narrative using language from the context about disability impact, present levels, and assessment findings. Reference specific skill areas from the context.

8) academicPerformanceAchievement — Use standards-aligned language from the context to describe current achievement levels.

9) intervention_recommendations — Return as an ARRAY of specific, actionable intervention strings, each copied or closely adapted from the context. NOT a single paragraph.

10) recommendedAccommodations — Include ALL accommodations from the input plus any additional ones evidenced by the context. Each as a complete sentence starting with "Given...", "With...", or "Using...".

Output: Return ONLY a single JSON object with exactly these top-level keys (no extra keys, no wrapper):
{
  "recommendedAccommodations": ["Complete accommodation sentences copied/adapted from context and input. Include all that are relevant."],
  "academicPerformanceAchievement": "Detailed paragraph with standards-aligned language from context.",
  "plaafp_narrative": "Detailed PLAAFP narrative using specific skill descriptions from context.",
  "annual_goals": ["One string per goal — copied/adapted from context Annual Goals. Include ALL relevant Content Strands."],
  "short_term_objectives": ["One string per objective — copied/adapted from context Objectives. Include ALL relevant ones."],
  "annualGoalsByExceptionality": [{"exceptionality": "Name", "goals": [{"referenceId": "0", "goal": "Targeted goal copied/adapted from context"}]}],
  "shortTermObjectivesByExceptionality": [{"exceptionality": "Name", "objectives": [{"referenceId": "0", "objective": "Targeted objective copied/adapted from context", "alignedAnnualGoalReferenceId": "0"}]}],
  "intervention_recommendations": ["Specific intervention string 1 from context", "Specific intervention string 2 from context", "...as many as relevant"],
  "custom_goals": [{"title": "Custom goal title", "recommendation": "Strategy from context", "retrieved_objectives": ["Objective strings from context"]}]
}

Tone: professional, plain-language suitable for parent review and IEP team.
Comply with Florida IEP requirements. Return valid JSON only.`;

export function buildUserPrompt({
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
}) {
  return [
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
    '"Non-duplication is mandatory: Top-level annual_goals / short_term_objectives must be broad and cross-exceptionality; exceptionality-specific goals must be distinct and not paraphrases. Do not repeat near-identical goals/objectives anywhere."',
    '',
    'No invented metrics: Do NOT add percentages, trial counts, or measurement windows unless they appear in the institutional context. Rephrase goals/objectives from the provided context; do not fabricate them.',
    '',
    'Condition line rule: When accommodations apply, include a condition phrase (e.g., "Given text-to-speech...", "With extended time...", "Using preferential seating..."). When no accommodation applies, use a neutral phrase (e.g., "Given grade-level instruction...").',
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
    '',
    ...(ragContext ? [
      'RELEVANT INSTITUTIONAL CONTEXT (GOAL BANK):',
      'Below is a goal bank. For EVERY Content Strand / section that matches this student, include the Annual Goal and ALL its numbered Objectives. Copy closely — fill blanks, remove underscores, refine into complete sentences. Do NOT summarize multiple objectives into one. There is NO limit on how many goals or objectives you return.',
      '',
      (ragContextByQuery && ragContextByQuery.length > 0
        ? ragContextByQuery.map((s) => {
            const chunksText = s.chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
            const usage = {
              Exceptionalities: 'Copy relevant goals/objectives → annualGoalsByExceptionality, shortTermObjectivesByExceptionality.',
              Weaknesses: 'Copy relevant goals/objectives → annual_goals, short_term_objectives.',
              Accommodations: 'Use as goal conditions (Given…, With…) and → recommendedAccommodations.',
              'Custom Goals': 'Copy → custom_goals and retrieved_objectives.',
              Strengths: 'Use for plaafp_narrative and leverage in goals.',
              'Instructional Setting': 'Use for setting-appropriate goals and intervention_recommendations.'
            }[s.label] || 'Copy relevant content into matching IEP fields.';
            return `=== ${s.label.toUpperCase()} ===\n${usage}\n\n${chunksText}`;
          }).join('\n\n')
        : ragContext),
      '',
      'IMPORTANT: Include ALL relevant objectives from the context — do not cherry-pick or limit. Enrich plaafp_narrative, academicPerformanceAchievement, intervention_recommendations (as array), and recommendedAccommodations from the context.',
      ''
    ] : []),
    'Return valid JSON only with the exact keys specified in the system prompt.',
    '',
    'Ensure all content is audit-ready, professionally written, and compliant with Florida IEP requirements.'
  ].join('\n');
}

export function postProcessGeneratedContent(generatedContent) {
  if (!Array.isArray(generatedContent.recommendedAccommodations)) {
    generatedContent.recommendedAccommodations = [];
  }
  if (typeof generatedContent.academicPerformanceAchievement !== 'string') {
    generatedContent.academicPerformanceAchievement = '';
  }
  if (!Array.isArray(generatedContent.annual_goals)) {
    generatedContent.annual_goals = [];
  }
  if (!Array.isArray(generatedContent.short_term_objectives)) {
    generatedContent.short_term_objectives = [];
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

  // Handle intervention_recommendations: LLM may return array or string; DB expects string
  if (Array.isArray(generatedContent.intervention_recommendations)) {
    generatedContent.intervention_recommendations = generatedContent.intervention_recommendations
      .map(s => `• ${s.trim()}`)
      .join('\n');
  } else if (typeof generatedContent.intervention_recommendations !== 'string') {
    generatedContent.intervention_recommendations = '';
  }

  return generatedContent;
}

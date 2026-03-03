/**
 * Shared logic for IEP generation (used by both regular and streaming routes).
 * Extracted to avoid duplication.
 */

export const SYSTEM_PROMPT = `You are an expert Special Education IEP writer. Receive a single JSON input (do not fetch external data). Using only the provided input values, generate a structured IEP. Do NOT invent facts—if a required input is missing, insert the exact placeholder "[MISSING: <fieldName>]".

QUALITY RULES (MANDATORY)

1) Grounding — Every goal/objective must be grounded in the provided weaknesses, strengths, PLAAFP baselines, assessments, accommodations, or custom goals. Do NOT invent or assume goals. If no source exists, use placeholders.

2) Generate goals ONLY when evidenced — Only create goals when there is clear need from weaknesses, strengths, baselines, assessments, accommodations, custom goals, or institutional context. Do NOT generate goals by default. Do NOT add fake percentages, trial counts, or measurement windows.

3) Quantity — Aim for 3–6 annual goals and 3–5 short-term objectives per goal. Do not artificially limit to 1–2; include enough to cover the student's needs.

4) ABSOLUTE NON-DUPLICATION — This is the most critical rule:
   - annual_goals and short_term_objectives are BROAD cross-exceptionality goals applicable school-wide.
   - annualGoalsByExceptionality and shortTermObjectivesByExceptionality are TARGETED disability-impact-specific goals.
   - These two layers MUST contain completely different goals. No goal/objective may appear in both layers, even paraphrased.
   - If you find yourself writing a similar goal for both layers, make the broad layer focus on a different skill/domain than the exceptionality layer.

5) No invented metrics — Do NOT add percentages (e.g. "80% accuracy"), trial counts (e.g. "4 out of 5 trials"), or measurement windows unless they appear in the provided institutional context or input. Use plain, observable language from the source material.

6) Accommodations linkage — Reference provided accommodations in goal conditions (e.g., "Given text-to-speech...") when relevant. Do NOT invent accommodations not in the input. Distribute them logically across goals.

7) Refine template text — Never output raw templates with blanks, underscores, or placeholders (e.g. "________", "___ out of _____"). Convert such text into clear, complete sentences. Preserve the meaning but remove any "________", "__________", "at _________ level", "as measured by __________", etc. Output only polished, professional sentences.

8) Field-specific institutional context — When "Relevant institutional context" is provided with sections (EXCEPTIONALITIES, WEAKNESSES, ACCOMMODATIONS, CUSTOM GOALS, STRENGTHS, INSTRUCTIONAL SETTING), use each section ONLY for the corresponding IEP output: (a) EXCEPTIONALITIES → annualGoalsByExceptionality, shortTermObjectivesByExceptionality. (b) WEAKNESSES → goals/objectives addressing weaknesses in annual_goals, short_term_objectives. (c) ACCOMMODATIONS → goal conditions (e.g., "Given...", "With..."). (d) CUSTOM GOALS → custom_goals, retrieved_objectives. (e) STRENGTHS → leverage in goals or intervention_recommendations. (f) INSTRUCTIONAL SETTING → setting-appropriate goals. Use EXACT wording from the relevant section. Refine templates into complete sentences — no blanks or underscores. If no institutional context is provided, only create goals from the provided input.

Output: Return ONLY a single JSON object with exactly these top-level keys (no extra keys, no wrapper):
{
  "recommendedAccommodations": ["5-10 accommodation strings from weaknesses/PLAAFP. Prefer from selected accommodations. No duplicates."],
  "academicPerformanceAchievement": "Concise paragraph summarizing current academic achievement grounded in PLAAFP + assessments + strengths/weaknesses.",
  "plaafp_narrative": "3-4 paragraph PLAAFP narrative describing current abilities, challenges, and disability impact on learning.",
  "annual_goals": ["3-6 BROAD annual goal strings — use EXACT wording from institutional context when available"],
  "short_term_objectives": ["3-5 per goal, 8-15 total — copy or minimally adapt EXACT objective text from institutional context"],
  "annualGoalsByExceptionality": [{"exceptionality": "Name", "goals": [{"referenceId": "0", "goal": "Targeted goal — use EXACT wording from institutional context"}]}],
  "shortTermObjectivesByExceptionality": [{"exceptionality": "Name", "objectives": [{"referenceId": "0", "objective": "Targeted objective — copy EXACT text from institutional context", "alignedAnnualGoalReferenceId": "0"}]}],
  "intervention_recommendations": "Detailed intervention/strategy recommendations specific to Florida standards.",
  "custom_goals": [{"title": "Custom goal title", "recommendation": "Strategy tied to retrieved context — not generic", "retrieved_objectives": ["Exact objective strings from institutional context that match this goal"]}]
}

Tone: professional, concise, plain-language suitable for parent review and IEP team.
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
      'Relevant institutional context (organized by field — use each section for the corresponding IEP output):',
      '',
      (ragContextByQuery && ragContextByQuery.length > 0
        ? ragContextByQuery.map((s) => {
            const chunksText = s.chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
            const usage = {
              Exceptionalities: 'Use for annualGoalsByExceptionality and shortTermObjectivesByExceptionality.',
              Weaknesses: 'Use when addressing weaknesses in annual_goals and short_term_objectives.',
              Accommodations: 'Use for goal conditions (Given..., With...).',
              'Custom Goals': 'Use for custom_goals and retrieved_objectives.',
              Strengths: 'Use when leveraging strengths in goals or intervention_recommendations.',
              'Instructional Setting': 'Use for setting-appropriate goals.'
            }[s.label] || 'Use for relevant goals and objectives.';
            return `=== ${s.label.toUpperCase()} ===\n${usage}\n\n${chunksText}`;
          }).join('\n\n')
        : ragContext),
      '',
      'Use each section above for its corresponding IEP output. Do not mix sections — e.g. use EXCEPTIONALITIES only for exceptionality-specific goals, CUSTOM GOALS only for custom_goals. Refine template text into complete sentences.',
      ''
    ] : []),
    'Return valid JSON only with the exact keys specified in the system prompt.',
    '',
    'CRITICAL REMINDER — NON-DUPLICATION:',
    '- annual_goals / short_term_objectives = BROAD, cross-exceptionality, school-wide goals.',
    '- annualGoalsByExceptionality / shortTermObjectivesByExceptionality = TARGETED, exceptionality-specific goals addressing disability impact.',
    '- These MUST be completely different goals targeting different skills/domains. Zero overlap.',
    '',
    'Ensure all content is audit-ready, professionally written, and compliant with Florida IEP requirements.'
  ].join('\n');
}

export function postProcessGeneratedContent(generatedContent) {
  const recommendedAccommodations = Array.isArray(generatedContent.recommendedAccommodations)
    ? generatedContent.recommendedAccommodations
    : [];
  const academicPerformanceAchievement = typeof generatedContent.academicPerformanceAchievement === 'string'
    ? generatedContent.academicPerformanceAchievement
    : '';

  if (!Array.isArray(generatedContent.annualGoalsByExceptionality)) {
    generatedContent.annualGoalsByExceptionality = [];
  }
  if (!Array.isArray(generatedContent.shortTermObjectivesByExceptionality)) {
    generatedContent.shortTermObjectivesByExceptionality = [];
  }
  if (!Array.isArray(generatedContent.custom_goals)) {
    generatedContent.custom_goals = [];
  }
  generatedContent.custom_goals = generatedContent.custom_goals.map(cg => ({
    ...cg,
    retrieved_objectives: Array.isArray(cg?.retrieved_objectives) ? cg.retrieved_objectives : []
  }));

  generatedContent.recommendedAccommodations = recommendedAccommodations;
  generatedContent.academicPerformanceAchievement = academicPerformanceAchievement;

  return generatedContent;
}

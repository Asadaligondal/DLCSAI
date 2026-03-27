/**
 * Detect whether stored iep_plan_data has user-visible content worth preserving in history.
 */
export function hasMeaningfulIepPlan(iep_plan_data) {
  if (!iep_plan_data || typeof iep_plan_data !== 'object') return false;
  const draft = iep_plan_data.original_ai_draft;
  if (!draft || typeof draft !== 'object') return false;
  const hasActualContent =
    (draft.plaafp_narrative && String(draft.plaafp_narrative).trim().length > 0) ||
    (Array.isArray(draft.annual_goals) && draft.annual_goals.length > 0) ||
    (Array.isArray(draft.short_term_objectives) && draft.short_term_objectives.length > 0) ||
    (draft.intervention_recommendations && String(draft.intervention_recommendations).trim().length > 0);
  return !!hasActualContent;
}

export function cloneIepPlanData(iep_plan_data) {
  try {
    return JSON.parse(JSON.stringify(iep_plan_data ?? {}));
  } catch {
    return {};
  }
}

export const MAX_IEP_VERSION_ENTRIES = 50;

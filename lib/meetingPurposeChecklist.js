/** Florida-style IEP meeting purpose checklist (stored by stable ids). */
export const MEETING_PURPOSE_OPTIONS = [
  { id: 'iep_annual_review', label: 'IEP annual review', col: 1 },
  { id: 'iep_interim_amendment', label: 'IEP interim review/amendment', col: 1 },
  {
    id: 'transition_services_needs',
    label: 'Identify transition services needs (beginning no later than 7th grade or age 12)',
    col: 1,
  },
  {
    id: 'postsecondary_transition',
    label: 'Consider postsecondary goals and transition services (beginning no later than 9th grade or age 14)',
    col: 1,
  },
  {
    id: 'diploma_accept_defer',
    label: 'Identify intent to accept or defer a standard high school diploma',
    col: 1,
  },
  { id: 'part_c_to_b', label: 'Part C to Part B transition', col: 1 },
  { id: 'review_initial_eval', label: 'Review initial evaluation results and determine eligibility', col: 1 },
  { id: 'develop_initial_iep', label: 'Develop initial IEP', col: 2 },
  { id: 'consider_reeval_need', label: 'Consider need for reevaluation', col: 2 },
  { id: 'review_reeval', label: 'Review reevaluation', col: 2 },
  { id: 'determine_eligibility', label: 'Determine eligibility', col: 2 },
  { id: 'manifestation_review', label: 'Changes after a manifestation determination review', col: 2 },
  { id: 'change_placement', label: 'Consider change of placement', col: 2 },
  { id: 'change_services', label: 'Consider change in services', col: 2 },
  { id: 'pbip', label: 'Develop, review or revise a positive behavior intervention plan (PBIP)', col: 2 },
  {
    id: 'access_points',
    label: 'Consider instruction in alternate achievement standards / access points curriculum',
    col: 3,
    starred: true,
  },
  {
    id: 'alternate_assessment',
    label: 'Consider Florida statewide standardized alternate assessment',
    col: 3,
    starred: true,
  },
  { id: 'ese_center', label: 'Consider placement in an ESE center school', col: 3, starred: true },
  { id: 'mp_other', label: 'Other', col: 3 },
];

const LABEL_BY_ID = Object.fromEntries(MEETING_PURPOSE_OPTIONS.map((o) => [o.id, o.label]));

export function summarizeMeetingPurpose(tags, otherText) {
  const t = Array.isArray(tags) ? tags : [];
  const parts = t.filter((id) => id && id !== 'mp_other').map((id) => LABEL_BY_ID[id] || id);
  const o = (otherText && String(otherText).trim()) || '';
  if (o) parts.push(`Other: ${o}`);
  return parts.join('; ');
}

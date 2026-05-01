/**
 * Professional roles for student team collaboration (labels only; keys stored on Student).
 */
export const COLLABORATION_ROLE_KEYS = [
  'CASE_MANAGER',
  'SPEECH_LANGUAGE_PATHOLOGIST',
  'OCCUPATIONAL_THERAPIST',
  'PHYSICAL_THERAPIST',
  'SCHOOL_PSYCHOLOGIST',
  'SOCIAL_WORKER',
  'BOARD_CERTIFIED_BEHAVIOR_ANALYST',
  'GENERAL_ED_TEACHER',
  'SPECIAL_ED_TEACHER',
  'RELATED_SERVICE_PROVIDER',
  'SCHOOL_NURSE',
  'OTHER',
];

export const COLLABORATION_ROLE_LABELS = {
  CASE_MANAGER: 'Case manager',
  SPEECH_LANGUAGE_PATHOLOGIST: 'Speech-language pathologist (SLP)',
  OCCUPATIONAL_THERAPIST: 'Occupational therapist (OT)',
  PHYSICAL_THERAPIST: 'Physical therapist (PT)',
  SCHOOL_PSYCHOLOGIST: 'School psychologist',
  SOCIAL_WORKER: 'School social worker',
  BOARD_CERTIFIED_BEHAVIOR_ANALYST: 'Behavior analyst (BCBA)',
  GENERAL_ED_TEACHER: 'General education teacher',
  SPECIAL_ED_TEACHER: 'Special education teacher',
  RELATED_SERVICE_PROVIDER: 'Related service provider',
  SCHOOL_NURSE: 'School nurse',
  OTHER: 'Other',
};

/** Application cap for embedded collaborationNotes length */
export const MAX_COLLABORATION_NOTES = 300;

export function isValidCollaborationRoleKey(key) {
  return typeof key === 'string' && COLLABORATION_ROLE_KEYS.includes(key);
}

export function collaborationRoleLabel(key) {
  return COLLABORATION_ROLE_LABELS[key] || key || 'Other';
}

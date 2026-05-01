/**
 * Team-input collaboration: narrow access — does not grant full IEP/profile APIs.
 * Primary case manager = Student.createdBy (roster owner).
 */

/** Normalize ObjectId or populated { _id } for comparisons */
function refIdString(ref) {
  if (ref == null) return '';
  if (typeof ref === 'object' && ref._id != null) return String(ref._id);
  return String(ref);
}

export function canManageCollaborators(user, student) {
  if (!user || !student) return false;
  if (user.role === 'admin') return true;
  return String(user._id) === refIdString(student.createdBy);
}

export function canUseCollaboration(user, student) {
  if (!user || !student) return false;
  if (user.role === 'admin') return true;
  if (String(user._id) === refIdString(student.createdBy)) return true;
  const list = student.collaborators || [];
  return list.some((c) => String(user._id) === refIdString(c.userId));
}

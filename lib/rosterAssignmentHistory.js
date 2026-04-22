import User from '@/models/User';
import Classroom from '@/models/Classroom';

export const MAX_ROSTER_ASSIGNMENT_HISTORY = 100;

/**
 * Append a roster change entry and cap array length.
 */
export function pushRosterAssignmentEntry(student, entry) {
  if (!student.rosterAssignmentHistory) student.rosterAssignmentHistory = [];
  student.rosterAssignmentHistory.push(entry);
  while (student.rosterAssignmentHistory.length > MAX_ROSTER_ASSIGNMENT_HISTORY) {
    student.rosterAssignmentHistory.shift();
  }
}

/**
 * Turn raw history subdocs into client-friendly objects with names (newest first).
 */
export async function formatRosterAssignmentHistoryForClient(raw) {
  const history = Array.isArray(raw) ? raw : [];
  if (history.length === 0) return [];

  const userIds = new Set();
  const classIds = new Set();
  for (const h of history) {
    if (h.actorId) userIds.add(String(h.actorId));
    if (h.fromCaseManagerId) userIds.add(String(h.fromCaseManagerId));
    if (h.toCaseManagerId) userIds.add(String(h.toCaseManagerId));
    if (h.fromClassroomId) classIds.add(String(h.fromClassroomId));
    if (h.toClassroomId) classIds.add(String(h.toClassroomId));
  }

  const [users, rooms] = await Promise.all([
    userIds.size
      ? User.find({ _id: { $in: [...userIds] } })
          .select('name email')
          .lean()
      : [],
    classIds.size
      ? Classroom.find({ _id: { $in: [...classIds] } })
          .select('name')
          .lean()
      : [],
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const roomMap = new Map(rooms.map((r) => [String(r._id), r]));

  const rows = history.map((h) => ({
    at: h.at,
    actor: h.actorId ? userMap.get(String(h.actorId)) || { _id: h.actorId, name: 'Unknown' } : null,
    fromCaseManager: h.fromCaseManagerId
      ? userMap.get(String(h.fromCaseManagerId)) || { _id: h.fromCaseManagerId, name: 'Unknown' }
      : null,
    toCaseManager: h.toCaseManagerId
      ? userMap.get(String(h.toCaseManagerId)) || { _id: h.toCaseManagerId, name: 'Unknown' }
      : null,
    fromClassroom: h.fromClassroomId
      ? roomMap.get(String(h.fromClassroomId)) || { _id: h.fromClassroomId, name: '—' }
      : null,
    toClassroom: h.toClassroomId
      ? roomMap.get(String(h.toClassroomId)) || { _id: h.toClassroomId, name: '—' }
      : null,
  }));

  return rows.reverse();
}

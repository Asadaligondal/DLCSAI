import Student from '@/models/Student';

/**
 * Returns the student doc if `user` may manage parent-input links for that student
 * (admin: any student; professor: only students they created).
 */
export async function getStudentForParentInput(studentId, user) {
  const q =
    user.role === 'admin'
      ? { _id: studentId }
      : { _id: studentId, createdBy: user._id };
  return Student.findOne(q).select('_id name studentId');
}

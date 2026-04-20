import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * PATCH /api/admin/students/[id]
 * Admin-only partial update. Currently used to assign/unassign a student to a
 * classroom. The `classroomId` must belong to the same provider as the student.
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    if (body.classroomId !== undefined) {
      if (body.classroomId === null || body.classroomId === '') {
        student.classroomId = null;
      } else {
        const classroom = await Classroom.findById(body.classroomId);
        if (!classroom) {
          return NextResponse.json(
            { success: false, message: 'Classroom not found' },
            { status: 404 }
          );
        }
        if (String(classroom.providerId) !== String(student.createdBy)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Classroom does not belong to this student\'s provider',
            },
            { status: 400 }
          );
        }
        student.classroomId = classroom._id;
      }
    }

    await student.save();

    return NextResponse.json({ success: true, student }, { status: 200 });
  } catch (error) {
    console.error('Admin patch student error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while updating student', error: error.message },
      { status: 500 }
    );
  }
}

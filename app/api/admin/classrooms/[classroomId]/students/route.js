import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { accommodationsCount } from '@/lib/accommodations';

/**
 * GET /api/admin/classrooms/[classroomId]/students
 * List students in a given classroom. Admin-only.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { classroomId } = await params;
    await connectDB();

    const classroom = await Classroom.findById(classroomId).lean();
    if (!classroom) {
      return NextResponse.json(
        { success: false, message: 'Classroom not found' },
        { status: 404 }
      );
    }

    const students = await Student.find({ classroomId: classroom._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const out = students.map((s) => {
      const count = accommodationsCount(s.student_accommodations || null);
      return { ...s.toObject(), accommodations_count: count, has_accommodations: count > 0 };
    });

    return NextResponse.json(
      { success: true, count: out.length, students: out },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin list classroom students error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while listing students', error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { accommodationsCount } from '@/lib/accommodations';

/**
 * GET /api/admin/providers/[providerId]/students
 * List every student owned by a provider (across classrooms and unassigned).
 * Query: ?unassigned=1 returns only students not attached to a classroom.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { providerId } = await params;
    const { searchParams } = new URL(request.url);
    const unassigned = searchParams.get('unassigned') === '1';

    await connectDB();

    const providerExists = await User.exists({ _id: providerId, role: 'professor' });
    if (!providerExists) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      );
    }

    const filter = { createdBy: providerId };
    if (unassigned) {
      filter.$or = [{ classroomId: null }, { classroomId: { $exists: false } }];
    }

    const students = await Student.find(filter)
      .populate('createdBy', 'name email')
      .populate('classroomId', 'name gradeLevel')
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
    console.error('Admin list provider students error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while listing students', error: error.message },
      { status: 500 }
    );
  }
}

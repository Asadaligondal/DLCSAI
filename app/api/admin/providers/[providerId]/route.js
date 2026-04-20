import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/admin/providers/[providerId]
 * Provider detail (professor user) + aggregate counts. Admin-only.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { providerId } = await params;
    await connectDB();

    const provider = await User.findOne({ _id: providerId, role: 'professor' })
      .select('name email schoolId emailVerified createdAt')
      .lean();

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      );
    }

    const [studentCount, classroomCount] = await Promise.all([
      Student.countDocuments({ createdBy: provider._id }),
      Classroom.countDocuments({ providerId: provider._id }),
    ]);

    return NextResponse.json(
      {
        success: true,
        provider: { ...provider, studentCount, classroomCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin get provider error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while fetching provider', error: error.message },
      { status: 500 }
    );
  }
}

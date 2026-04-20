import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/admin/providers
 * List all service providers (users with role 'professor') with aggregate counts
 * of classrooms and students. Admin-only.
 */
export async function GET(request) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    await connectDB();

    const providers = await User.find({ role: 'professor' })
      .select('name email schoolId emailVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!providers.length) {
      return NextResponse.json({ success: true, count: 0, providers: [] }, { status: 200 });
    }

    const ids = providers.map((p) => p._id);

    const [studentCounts, classroomCounts] = await Promise.all([
      Student.aggregate([
        { $match: { createdBy: { $in: ids } } },
        { $group: { _id: '$createdBy', n: { $sum: 1 } } },
      ]),
      Classroom.aggregate([
        { $match: { providerId: { $in: ids } } },
        { $group: { _id: '$providerId', n: { $sum: 1 } } },
      ]),
    ]);

    const studentMap = new Map(studentCounts.map((r) => [String(r._id), r.n]));
    const classroomMap = new Map(classroomCounts.map((r) => [String(r._id), r.n]));

    const enriched = providers.map((p) => ({
      ...p,
      studentCount: studentMap.get(String(p._id)) || 0,
      classroomCount: classroomMap.get(String(p._id)) || 0,
    }));

    return NextResponse.json(
      { success: true, count: enriched.length, providers: enriched },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin list providers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while listing providers', error: error.message },
      { status: 500 }
    );
  }
}

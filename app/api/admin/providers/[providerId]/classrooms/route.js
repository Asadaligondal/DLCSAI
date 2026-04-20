import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/admin/providers/[providerId]/classrooms
 * List classrooms under a provider with student counts. Admin-only.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { providerId } = await params;
    await connectDB();

    const providerExists = await User.exists({ _id: providerId, role: 'professor' });
    if (!providerExists) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      );
    }

    const classrooms = await Classroom.find({ providerId })
      .sort({ createdAt: -1 })
      .lean();

    const ids = classrooms.map((c) => c._id);
    const counts = ids.length
      ? await Student.aggregate([
          { $match: { classroomId: { $in: ids } } },
          { $group: { _id: '$classroomId', n: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(counts.map((r) => [String(r._id), r.n]));

    const unassignedCount = await Student.countDocuments({
      createdBy: providerId,
      $or: [{ classroomId: null }, { classroomId: { $exists: false } }],
    });

    const enriched = classrooms.map((c) => ({
      ...c,
      studentCount: countMap.get(String(c._id)) || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        count: enriched.length,
        classrooms: enriched,
        unassignedStudentCount: unassignedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin list classrooms error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while listing classrooms', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/providers/[providerId]/classrooms
 * Create a new classroom for a provider. Admin-only.
 */
export async function POST(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const admin = authResult.user;
    const { providerId } = await params;
    const body = await request.json();
    const { name, gradeLevel, schoolName, description } = body || {};

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: 'Classroom name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const providerExists = await User.exists({ _id: providerId, role: 'professor' });
    if (!providerExists) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      );
    }

    const classroom = await Classroom.create({
      name: String(name).trim(),
      gradeLevel: gradeLevel || '',
      schoolName: schoolName || '',
      description: description || '',
      providerId,
      createdBy: admin._id,
    });

    return NextResponse.json(
      { success: true, classroom },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin create classroom error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while creating classroom', error: error.message },
      { status: 500 }
    );
  }
}

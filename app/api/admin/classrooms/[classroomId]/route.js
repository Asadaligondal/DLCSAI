import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/admin/classrooms/[classroomId]
 * Get a single classroom with provider info + student count. Admin-only.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { classroomId } = await params;
    await connectDB();

    const classroom = await Classroom.findById(classroomId)
      .populate('providerId', 'name email schoolId')
      .lean();

    if (!classroom) {
      return NextResponse.json(
        { success: false, message: 'Classroom not found' },
        { status: 404 }
      );
    }

    const studentCount = await Student.countDocuments({ classroomId: classroom._id });

    return NextResponse.json(
      { success: true, classroom: { ...classroom, studentCount } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin get classroom error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while fetching classroom', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/classrooms/[classroomId]
 * Update classroom metadata. Admin-only.
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { classroomId } = await params;
    const body = await request.json();

    await connectDB();

    const update = {};
    ['name', 'gradeLevel', 'schoolName', 'description'].forEach((k) => {
      if (body[k] !== undefined) update[k] = body[k];
    });

    const classroom = await Classroom.findByIdAndUpdate(classroomId, update, {
      new: true,
      runValidators: true,
    });

    if (!classroom) {
      return NextResponse.json(
        { success: false, message: 'Classroom not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, classroom }, { status: 200 });
  } catch (error) {
    console.error('Admin update classroom error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while updating classroom', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/classrooms/[classroomId]
 * Remove a classroom. Students remain but are unassigned.
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const { classroomId } = await params;
    await connectDB();

    const classroom = await Classroom.findByIdAndDelete(classroomId);
    if (!classroom) {
      return NextResponse.json(
        { success: false, message: 'Classroom not found' },
        { status: 404 }
      );
    }

    // Unassign students that referenced this classroom so they remain visible
    // under the provider as unassigned.
    await Student.updateMany(
      { classroomId: classroom._id },
      { $set: { classroomId: null } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin delete classroom error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while deleting classroom', error: error.message },
      { status: 500 }
    );
  }
}

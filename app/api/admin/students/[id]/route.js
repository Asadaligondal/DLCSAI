import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import User from '@/models/User';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { pushRosterAssignmentEntry } from '@/lib/rosterAssignmentHistory';

/**
 * PATCH /api/admin/students/[id]
 * Admin-only: assign case manager (roster owner / createdBy) and/or classroom.
 * Classroom options must belong to the selected case manager (Classroom.providerId).
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const adminUser = authResult.user;
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {
      /* empty */
    }

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const oldCreatedBy = String(student.createdBy);
    const oldClassroomId = student.classroomId ? String(student.classroomId) : null;

    const hasCaseManagerField =
      body.caseManagerId !== undefined && body.caseManagerId !== null && String(body.caseManagerId).trim() !== '';

    const newCreatedBy = hasCaseManagerField ? String(body.caseManagerId).trim() : oldCreatedBy;

    if (newCreatedBy !== oldCreatedBy) {
      const prof = await User.findOne({ _id: newCreatedBy, role: 'professor' });
      if (!prof) {
        return NextResponse.json(
          { success: false, message: 'Case manager must be a valid service provider account' },
          { status: 400 }
        );
      }
    }

    let newClassroomId = student.classroomId;

    if (body.classroomId !== undefined) {
      if (body.classroomId === null || body.classroomId === '') {
        newClassroomId = null;
      } else {
        const classroom = await Classroom.findById(body.classroomId);
        if (!classroom) {
          return NextResponse.json({ success: false, message: 'Classroom not found' }, { status: 404 });
        }
        if (String(classroom.providerId) !== String(newCreatedBy)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Classroom does not belong to the selected case manager',
            },
            { status: 400 }
          );
        }
        newClassroomId = classroom._id;
      }
    } else if (String(newCreatedBy) !== oldCreatedBy) {
      if (student.classroomId) {
        const c = await Classroom.findById(student.classroomId);
        if (!c || String(c.providerId) !== String(newCreatedBy)) {
          newClassroomId = null;
        }
      }
    }

    const newClassroomStr = newClassroomId ? String(newClassroomId) : null;
    const changedOwner = String(newCreatedBy) !== oldCreatedBy;
    const changedClass = newClassroomStr !== oldClassroomId;

    if (changedOwner || changedClass) {
      pushRosterAssignmentEntry(student, {
        at: new Date(),
        actorId: adminUser._id,
        fromCaseManagerId: oldCreatedBy,
        toCaseManagerId: newCreatedBy,
        fromClassroomId: oldClassroomId || null,
        toClassroomId: newClassroomStr || null,
      });
    }

    student.createdBy = newCreatedBy;
    student.classroomId = newClassroomId;

    if (changedOwner) {
      const newProf = await User.findById(newCreatedBy).select('name').lean();
      if (newProf?.name) {
        student.caseManager = newProf.name;
      }
    }

    await student.save();

    const populated = await Student.findById(student._id)
      .populate('createdBy', 'name email')
      .populate('classroomId', 'name gradeLevel');

    return NextResponse.json({ success: true, student: populated }, { status: 200 });
  } catch (error) {
    console.error('Admin patch student error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while updating student', error: error.message },
      { status: 500 }
    );
  }
}

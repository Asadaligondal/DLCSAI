import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';
import { normalizeAccommodations, accommodationsCount } from '@/lib/accommodations';

/**
 * GET /api/students/[id]
 * Get a specific student by ID
 */
export async function GET(request, { params }) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const { id } = params;

    // Connect to database
    await connectDB();

    // Find the student and verify ownership
    const student = await Student.findOne({ _id: id, createdBy: user._id })
      .populate('createdBy', 'name email')
      .populate('assignedGoals', 'title description category priority');

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found or unauthorized'
        },
        { status: 404 }
      );
    }

    console.log('📥 Fetching student:', id);
    console.log('📦 Student IEP data:', student.iep_plan_data);
    if (student.iep_plan_data) {
      console.log('📝 Original AI draft present:', !!student.iep_plan_data.original_ai_draft);
      console.log('✏️ User edited version present:', !!student.iep_plan_data.user_edited_version);
      console.log('✅ Is reviewed:', student.iep_plan_data.is_reviewed);
    }

    // Ensure accommodations structure exists and is normalized for returned object
    if (student) {
      student.student_accommodations = normalizeAccommodations(student.student_accommodations);
    }

    const out = student ? ({ ...student.toObject(), accommodations_count: accommodationsCount(student.student_accommodations) }) : null;

    return NextResponse.json(
      {
        success: true,
        student: out
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Student Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching student',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students/[id]
 * Update a student
 */
export async function PUT(request, { params }) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const { id } = params;
    const body = await request.json();
    const { name, studentId, gradeLevel, age, disabilities, strengths, weaknesses, assignedGoals, annualGoals, servicesRecommendations, student_accommodations } = body;

    // Connect to database
    await connectDB();

    // Find the student and verify ownership
    const student = await Student.findOne({ _id: id, createdBy: user._id });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found or unauthorized'
        },
        { status: 404 }
      );
    }

    // Update student
    if (name !== undefined) student.name = name;
    if (studentId !== undefined) student.studentId = studentId;
    if (gradeLevel !== undefined) student.gradeLevel = gradeLevel;
    if (age !== undefined) student.age = age;
    if (disabilities !== undefined) student.disabilities = disabilities;
    if (strengths !== undefined) student.strengths = strengths;
    if (weaknesses !== undefined) student.weaknesses = weaknesses;
    if (assignedGoals !== undefined) student.assignedGoals = assignedGoals;
    if (annualGoals !== undefined) student.annualGoals = annualGoals;
    if (servicesRecommendations !== undefined) student.servicesRecommendations = servicesRecommendations;
    if (student_accommodations !== undefined) {
      student.student_accommodations = normalizeAccommodations(student_accommodations);
    }

    await student.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Student updated successfully',
        student
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update Student Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while updating student',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * Delete a student
 */
export async function DELETE(request, { params }) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const { id } = params;

    console.log('Attempting to delete student with ID:', id);

    // Connect to database
    await connectDB();

    // Find and delete the student, verify ownership
    const student = await Student.findOneAndDelete({ _id: id, createdBy: user._id });

    if (!student) {
      console.log('Student not found with ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found or unauthorized'
        },
        { status: 404 }
      );
    }

    console.log('Student deleted successfully:', student.name);
    return NextResponse.json(
      {
        success: true,
        message: 'Student deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete Student Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while deleting student',
        error: error.message
      },
      { status: 500 }
    );
  }
}

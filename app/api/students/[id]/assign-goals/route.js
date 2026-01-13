import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';
import { autoAssignGoals, getRecommendedGoals } from '@/lib/goalMapping';

/**
 * POST /api/students/[id]/assign-goals
 * Auto-assign goals to a student based on their disabilities/weaknesses/strengths
 */
export async function POST(request, { params }) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const { id } = params;
    const body = await request.json();
    const { auto = true, goalIds = [] } = body;

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

    let assignedGoalIds = [];
    let matchDetails = [];

    if (auto) {
      // Auto-assign goals based on student profile
      const result = await autoAssignGoals(student);
      assignedGoalIds = result.goalIds;
      matchDetails = result.matchDetails;
    } else {
      // Manually assign provided goal IDs
      assignedGoalIds = goalIds;
    }

    // Update student with assigned goals
    student.assignedGoals = assignedGoalIds;
    await student.save();

    // Populate the assigned goals
    await student.populate('assignedGoals', 'title description category priority');

    return NextResponse.json(
      {
        success: true,
        message: auto
          ? 'Goals automatically assigned to student'
          : 'Goals manually assigned to student',
        student,
        matchDetails: auto ? matchDetails : undefined
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assign Goals Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while assigning goals',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/students/[id]/assign-goals
 * Get recommended goals for a student without assigning them
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

    // Get recommended goals
    const recommendations = await getRecommendedGoals(student);

    return NextResponse.json(
      {
        success: true,
        recommendations
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Recommended Goals Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while getting recommendations',
        error: error.message
      },
      { status: 500 }
    );
  }
}

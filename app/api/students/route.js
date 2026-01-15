import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Goal from '@/models/Goal';
import { protectRoute } from '@/lib/authMiddleware';

/**
 * GET /api/students
 * Get all students created by the logged-in user
 */
export async function GET(request) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;

    // Connect to database
    await connectDB();

    // Find all students created by this user
    const students = await Student.find({ createdBy: user._id })
      .populate('createdBy', 'name email')
      .populate('assignedGoals', 'title description category priority')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: students.length,
        students
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Students Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching students',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Add a new student
 */
export async function POST(request) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const body = await request.json();
    const { name, studentId, gradeLevel, age, disabilities, strengths, weaknesses } = body;

    // Validate required fields
    if (!name || !studentId || !gradeLevel || !age) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide name, studentId, gradeLevel, and age'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if student with this ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student with this ID already exists'
        },
        { status: 400 }
      );
    }

    // Create new student
    const student = await Student.create({
      name,
      studentId,
      gradeLevel,
      age,
      disabilities: disabilities || [],
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      createdBy: user._id
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Student added successfully',
        student
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add Student Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while adding student',
        error: error.message
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Goal from '@/models/Goal';
import { protectRoute, protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/goals
 * Get all active goals
 * Accessible to all authenticated users
 */
export async function GET(request) {
  try {
    // Protect route (all authenticated users can view goals)
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== null) filter.isActive = isActive === 'true';

    // Find goals
    const goals = await Goal.find(filter)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: goals.length,
        goals
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Goals Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching goals',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals
 * Create a new goal (Admin only)
 */
export async function POST(request) {
  try {
    // Protect route - Admin only
    const authResult = await protectAdminRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;
    const body = await request.json();
    const {
      title,
      description,
      category,
      targetDisabilities,
      targetWeaknesses,
      requiredStrengths,
      gradeLevel,
      priority,
      isActive
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide title and description'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create new goal
    const goal = await Goal.create({
      title,
      description,
      category: category || 'academic',
      targetDisabilities: targetDisabilities || [],
      targetWeaknesses: targetWeaknesses || [],
      requiredStrengths: requiredStrengths || [],
      gradeLevel: gradeLevel || '',
      priority: priority || 'medium',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user._id
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Goal created successfully',
        goal
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Goal Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while creating goal',
        error: error.message
      },
      { status: 500 }
    );
  }
}

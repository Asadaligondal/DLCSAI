import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Goal from '@/models/Goal';
import { protectRoute, protectAdminRoute } from '@/lib/authMiddleware';
import Student from '@/models/Student';

/**
 * GET /api/goals/[id]
 * Get a specific goal by ID
 */
export async function GET(request, { params }) {
  try {
    // Protect route
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = params;

    // Connect to database
    await connectDB();

    // Find the goal
    const goal = await Goal.findById(id).populate('createdBy', 'name email');

    if (!goal) {
      return NextResponse.json(
        {
          success: false,
          message: 'Goal not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        goal
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Goal Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching goal',
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/goals/[id]
 * Update a goal (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    // Protect route (any authenticated user) - owner or admin may edit
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;

    const { id } = params;
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

    // Connect to database
    await connectDB();

    // Find the goal
    const goal = await Goal.findById(id);

    if (!goal) {
      return NextResponse.json({ success: false, message: 'Goal not found' }, { status: 404 });
    }

    // Allow if admin or owner
    const ownerId = goal.createdBy ? goal.createdBy.toString() : null;
    if (user.role !== 'admin' && ownerId !== user._id) {
      return NextResponse.json({ success: false, message: 'Not authorized to edit this goal' }, { status: 403 });
    }

    // Update goal
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (category !== undefined) goal.category = category;
    if (targetDisabilities !== undefined) goal.targetDisabilities = targetDisabilities;
    if (targetWeaknesses !== undefined) goal.targetWeaknesses = targetWeaknesses;
    if (requiredStrengths !== undefined) goal.requiredStrengths = requiredStrengths;
    if (gradeLevel !== undefined) goal.gradeLevel = gradeLevel;
    if (priority !== undefined) goal.priority = priority;
    if (isActive !== undefined) goal.isActive = isActive;

    await goal.save();

    return NextResponse.json({ success: true, message: 'Goal updated successfully', goal }, { status: 200 });
  } catch (error) {
    console.error('Update Goal Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while updating goal', error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/[id]
 * Delete a goal (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    // Protect route (owner or admin)
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;

    const { id } = params;
    console.log('Attempting to delete goal with ID:', id);

    // Connect to database
    await connectDB();

    const goal = await Goal.findById(id);
    if (!goal) {
      console.log('Goal not found with ID:', id);
      return NextResponse.json({ success: false, message: 'Goal not found' }, { status: 404 });
    }

    const ownerId = goal.createdBy ? goal.createdBy.toString() : null;
    if (user.role !== 'admin' && ownerId !== user._id) {
      return NextResponse.json({ success: false, message: 'Not authorized to delete this goal' }, { status: 403 });
    }

    await Goal.findByIdAndDelete(id);

    // Remove from any students who had this goal assigned
    await Student.updateMany({ assignedGoals: id }, { $pull: { assignedGoals: id } });

    console.log('Goal deleted successfully:', id);
    return NextResponse.json({ success: true, message: 'Goal deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while deleting goal', error: error.message }, { status: 500 });
  }
}

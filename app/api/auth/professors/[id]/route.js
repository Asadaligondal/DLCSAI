import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { hashPassword } from '@/lib/auth';

/**
 * PUT /api/auth/professors/[id]
 * Update a professor (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, password, schoolId } = body;

    await connectDB();

    const updateData = { name, email, schoolId };
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const professor = await User.findOneAndUpdate(
      { _id: id, role: 'professor' },
      updateData,
      { new: true, runValidators: true }
    );

    if (!professor) {
      return NextResponse.json(
        { success: false, message: 'Professor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Professor updated successfully', professor },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update Professor Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while updating professor', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/professors/[id]
 * Delete a professor (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    // Protect route - Admin only
    const authResult = await protectAdminRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const { id } = params;

    console.log('Attempting to delete professor with ID:', id);

    // Connect to database
    await connectDB();

    // Find and delete the professor
    const professor = await User.findOneAndDelete({ _id: id, role: 'professor' });

    if (!professor) {
      console.log('Professor not found with ID:', id);
      return NextResponse.json(
        {
          success: false,
          message: 'Professor not found'
        },
        { status: 404 }
      );
    }

    console.log('Professor deleted successfully:', professor.email);
    return NextResponse.json(
      {
        success: true,
        message: 'Professor deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete Professor Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while deleting professor',
        error: error.message
      },
      { status: 500 }
    );
  }
}

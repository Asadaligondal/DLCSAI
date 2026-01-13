import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectAdminRoute } from '@/lib/authMiddleware';

/**
 * GET /api/auth/professors
 * Get all professors (Admin only)
 */
export async function GET(request) {
  try {
    // Protect route - Admin only
    const authResult = await protectAdminRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    // Connect to database
    await connectDB();

    // Find all users with role 'professor'
    const professors = await User.find({ role: 'professor' })
      .select('name email plainPassword createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: professors.length,
        professors
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Professors Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching professors',
        error: error.message
      },
      { status: 500 }
    );
  }
}

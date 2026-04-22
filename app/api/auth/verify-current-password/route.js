import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { comparePassword } from '@/lib/auth';

/**
 * POST /api/auth/verify-current-password
 * Admin-only: checks that the request body password matches the logged-in admin (e.g. before revealing a typed secret in the UI).
 */
export async function POST(request) {
  try {
    const authResult = await protectAdminRoute(request);
    if (authResult.error) return authResult.response;

    const admin = authResult.user;
    let body = {};
    try {
      body = await request.json();
    } catch {
      /* empty */
    }
    const currentPassword = body?.currentPassword;
    if (!currentPassword || typeof currentPassword !== 'string' || !String(currentPassword).trim()) {
      return NextResponse.json(
        { success: false, message: 'Enter your admin password to continue.' },
        { status: 400 }
      );
    }

    await connectDB();
    const dbAdmin = await User.findById(admin._id).select('password');
    if (!dbAdmin?.password) {
      return NextResponse.json({ success: false, message: 'Unable to verify password' }, { status: 500 });
    }
    const passwordOk = await comparePassword(String(currentPassword).trim(), dbAdmin.password);
    if (!passwordOk) {
      return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 403 });
    }

    return NextResponse.json({ success: true, verified: true }, { status: 200 });
  } catch (error) {
    console.error('Verify current password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

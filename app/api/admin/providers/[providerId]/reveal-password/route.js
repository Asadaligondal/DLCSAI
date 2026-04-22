import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectAdminRoute } from '@/lib/authMiddleware';
import { comparePassword } from '@/lib/auth';

/**
 * POST /api/admin/providers/[providerId]/reveal-password
 * Admin-only: after verifying the admin's own password, returns stored plainPassword for that professor (if set).
 */
export async function POST(request, { params }) {
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

    const { providerId } = await params;
    await connectDB();

    const dbAdmin = await User.findById(admin._id).select('password');
    if (!dbAdmin?.password) {
      return NextResponse.json({ success: false, message: 'Unable to verify password' }, { status: 500 });
    }
    const passwordOk = await comparePassword(String(currentPassword).trim(), dbAdmin.password);
    if (!passwordOk) {
      return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 403 });
    }

    const professor = await User.findOne({ _id: providerId, role: 'professor' }).select('plainPassword').lean();
    if (!professor) {
      return NextResponse.json({ success: false, message: 'Provider not found' }, { status: 404 });
    }

    const plain =
      professor.plainPassword != null && String(professor.plainPassword).length > 0
        ? String(professor.plainPassword)
        : null;

    return NextResponse.json({ success: true, plainPassword: plain }, { status: 200 });
  } catch (error) {
    console.error('Reveal provider password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

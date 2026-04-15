import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ success: false, message: 'Invalid link' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await connectDB();
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires +pendingEmail');

    if (!user || !user.pendingEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired link. Request a new verification email from Settings.' },
        { status: 400 }
      );
    }

    const taken = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } });
    if (taken) {
      return NextResponse.json(
        { success: false, message: 'That email was taken by another account. Use a different email in Settings.' },
        { status: 400 }
      );
    }

    user.email = user.pendingEmail;
    user.emailVerified = true;
    user.pendingEmail = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return NextResponse.json({ success: true, message: 'Email verified. You can sign in with this address for password recovery.' });
  } catch (error) {
    console.error('verify-email', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

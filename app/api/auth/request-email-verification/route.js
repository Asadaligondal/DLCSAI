import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectRoute } from '@/lib/authMiddleware';
import { sendEmailVerificationEmail, isMailConfigured, getAppBaseUrl } from '@/lib/mail';

export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const me = authResult.user;
    if (me.role !== 'professor') {
      return NextResponse.json({ success: false, message: 'Not applicable' }, { status: 400 });
    }

    if (me.emailVerified !== false) {
      return NextResponse.json({ success: false, message: 'Your email is already verified' }, { status: 400 });
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address' }, { status: 400 });
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Email is not configured on this server. Add RESEND_API_KEY and EMAIL_FROM (or SMTP).' },
        { status: 503 }
      );
    }

    await connectDB();

    const taken = await User.findOne({ email, _id: { $ne: me._id } });
    if (taken) {
      return NextResponse.json({ success: false, message: 'That email is already used by another account' }, { status: 400 });
    }

    const user = await User.findById(me._id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.pendingEmail = email;
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendEmailVerificationEmail(email, verifyUrl);
    } catch (err) {
      console.error('[request-email-verification]', err.message || err);
      user.pendingEmail = null;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save({ validateBeforeSave: false });
      return NextResponse.json(
        { success: false, message: 'Could not send email. Check RESEND_API_KEY / domain, or try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `We sent a verification link to ${email}. Check your inbox.`,
    });
  } catch (error) {
    console.error('request-email-verification', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

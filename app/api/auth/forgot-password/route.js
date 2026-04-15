import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail, isMailConfigured, getAppBaseUrl } from '@/lib/mail';

const GENERIC_OK = {
  success: true,
  message: 'If an account exists for that email, we sent password reset instructions.',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ success: false, message: 'Please provide an email address' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    if (!isMailConfigured()) {
      console.error(
        '[forgot-password] Mail not configured. Set RESEND_API_KEY + EMAIL_FROM, or SMTP_* + EMAIL_FROM (and APP_URL for links).'
      );
      return NextResponse.json(
        {
          success: false,
          message:
            'Password reset email is not configured on this server. Ask an administrator to set up SMTP or contact support.',
        },
        { status: 503 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error('[forgot-password] Send failed:', err.message || err);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      return NextResponse.json(
        { success: false, message: 'Could not send email. Try again later or contact support.' },
        { status: 502 }
      );
    }

    return NextResponse.json(GENERIC_OK, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

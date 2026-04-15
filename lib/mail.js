import nodemailer from 'nodemailer';

/** Resend HTTP API (recommended): RESEND_API_KEY + EMAIL_FROM */
export function isResendConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Classic SMTP: SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM */
export function isSmtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );
}

export function isMailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

export function getAppBaseUrl() {
  const u = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return String(u).replace(/\/$/, '');
}

async function sendViaResend({ to, subject, text, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Resend HTTP ${res.status}`);
  }
}

async function sendViaSmtp({ to, subject, text, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

/**
 * Send one transactional email (password reset, email verification, etc.)
 * Prefers Resend when RESEND_API_KEY is set; otherwise Nodemailer SMTP.
 */
export async function sendTransactionalEmail({ to, subject, text, html }) {
  if (isResendConfigured()) {
    await sendViaResend({ to, subject, text, html });
    return;
  }
  if (isSmtpConfigured()) {
    await sendViaSmtp({ to, subject, text, html });
    return;
  }
  throw new Error('Email is not configured');
}

export async function sendPasswordResetEmail(to, resetUrl) {
  await sendTransactionalEmail({
    to,
    subject: 'Reset your IEP Genius password',
    text: `Reset your password by visiting this link (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Reset your password using the link below (valid for <strong>1 hour</strong>):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendEmailVerificationEmail(to, verifyUrl) {
  await sendTransactionalEmail({
    to,
    subject: 'Verify your email — IEP Genius',
    text: `Verify your email by opening this link (valid for 48 hours):\n\n${verifyUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Verify your email for <strong>IEP Genius</strong> using the link below (valid for <strong>48 hours</strong>):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import '@/models/Student';
import ParentInputRequest from '@/models/ParentInputRequest';

const INTRO =
  "Your input is very important in developing a plan that meets your child's special needs. Please take a few minutes to think about what makes your child unique, the kinds of services the school has provided that have been helpful, whether or not your child has made progress, and the goals that you would like your child to reach in the year ahead. We encourage you to make notes and bring them with you to the IEP/EP/SP team meeting. If you are not able to attend the meeting, you may use this form to provide input to the team prior to the meeting.";

function firstName(full) {
  if (!full || typeof full !== 'string') return 'your child';
  const t = full.trim().split(/\s+/)[0];
  return t || 'your child';
}

/**
 * GET /api/parent-input/[token] — public: form metadata
 */
export async function GET(request, { params }) {
  const { token } = await params;
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, message: 'Invalid link' }, { status: 400 });
  }

  try {
    await connectDB();
    const row = await ParentInputRequest.findOne({ token }).populate('student', 'name').lean();
    if (!row) {
      return NextResponse.json({ success: false, message: 'This link is invalid or has expired.' }, { status: 404 });
    }

    const studentName = row.student?.name;
    return NextResponse.json({
      success: true,
      alreadySubmitted: row.status === 'submitted',
      studentFirstName: firstName(studentName),
      intro: INTRO,
    });
  } catch (e) {
    console.error('parent-input public GET', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/parent-input/[token] — public: submit form
 */
export async function POST(request, { params }) {
  const { token } = await params;
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, message: 'Invalid link' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const strengths = String(body?.strengths ?? '').trim();
  const successesYear = String(body?.successesYear ?? '').trim();
  const concerns = String(body?.concerns ?? '').trim();
  const additional = String(body?.additional ?? '').trim();
  const parentSignerName = String(body?.parentSignerName ?? '').trim();
  const parentFormDate = String(body?.parentFormDate ?? '').trim();

  if (!strengths || !successesYear || !concerns || !parentSignerName) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please complete strengths, successes, concerns, and your name (signature).',
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const row = await ParentInputRequest.findOne({ token });
    if (!row) {
      return NextResponse.json({ success: false, message: 'This link is invalid.' }, { status: 404 });
    }
    if (row.status === 'submitted') {
      return NextResponse.json({ success: false, message: 'This form was already submitted.' }, { status: 409 });
    }

    row.strengths = strengths;
    row.successesYear = successesYear;
    row.concerns = concerns;
    row.additional = additional;
    row.parentSignerName = parentSignerName;
    row.parentFormDate = parentFormDate;
    row.status = 'submitted';
    row.submittedAt = new Date();
    await row.save();

    return NextResponse.json({ success: true, message: 'Thank you — your responses were submitted.' });
  } catch (e) {
    console.error('parent-input public POST', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

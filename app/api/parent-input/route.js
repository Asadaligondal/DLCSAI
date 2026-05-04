import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import connectDB from '@/lib/mongodb';
import { protectRoute } from '@/lib/authMiddleware';
import ParentInputRequest from '@/models/ParentInputRequest';
import { getStudentForParentInput } from '@/lib/parentInputAccess';

function buildPublicUrl(request, token) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}/parent-input/${token}`;
  return `/parent-input/${token}`;
}

/**
 * GET /api/parent-input?studentId=
 * List parent input requests for a student (case manager / admin).
 */
export async function GET(request) {
  const authResult = await protectRoute(request);
  if (authResult.error) return authResult.response;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json({ success: false, message: 'studentId is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const student = await getStudentForParentInput(studentId, authResult.user);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found or unauthorized' }, { status: 404 });
    }

    const rows = await ParentInputRequest.find({ student: studentId })
      .sort({ createdAt: -1 })
      .lean();

    const items = rows.map((r) => ({
      id: String(r._id),
      status: r.status,
      createdAt: r.createdAt,
      submittedAt: r.submittedAt,
      token: r.status === 'pending' ? r.token : null,
      strengths: r.strengths,
      successesYear: r.successesYear,
      concerns: r.concerns,
      additional: r.additional,
      parentSignerName: r.parentSignerName,
      parentFormDate: r.parentFormDate,
    }));

    return NextResponse.json({ success: true, items });
  } catch (e) {
    console.error('parent-input GET', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/parent-input  { studentId }
 * Create a new shareable link (pending).
 */
export async function POST(request) {
  const authResult = await protectRoute(request);
  if (authResult.error) return authResult.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const studentId = body?.studentId;
  if (!studentId) {
    return NextResponse.json({ success: false, message: 'studentId is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const student = await getStudentForParentInput(studentId, authResult.user);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found or unauthorized' }, { status: 404 });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const doc = await ParentInputRequest.create({
      student: studentId,
      token,
      createdBy: authResult.user._id,
    });

    const url = buildPublicUrl(request, token);

    return NextResponse.json({
      success: true,
      item: {
        id: String(doc._id),
        status: doc.status,
        createdAt: doc.createdAt,
        token: doc.token,
        url,
      },
    });
  } catch (e) {
    console.error('parent-input POST', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

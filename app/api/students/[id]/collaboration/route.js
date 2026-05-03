import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { protectRoute } from '@/lib/authMiddleware';
import { canManageCollaborators, canUseCollaboration } from '@/lib/studentCollaborationAccess';
import {
  MAX_COLLABORATION_NOTES,
  COLLABORATION_ROLE_KEYS,
  COLLABORATION_ROLE_LABELS,
  isValidCollaborationRoleKey,
  collaborationRoleLabel,
} from '@/lib/collaborationRoles';

const NOTE_MAX_LEN = 4000;

function serializeCollaborators(student) {
  const rows = student.collaborators || [];
  return rows.map((c) => {
    const u = c.userId;
    const uid = u && typeof u === 'object' && u._id ? u._id : c.userId;
    return {
      userId: String(uid),
      roleKey: c.roleKey,
      roleLabel: collaborationRoleLabel(c.roleKey),
      addedAt: c.addedAt,
      user: u && typeof u === 'object'
        ? { id: String(u._id), name: u.name || '', email: u.email || '' }
        : null,
    };
  });
}

function serializeNotes(student) {
  const rows = [...(student.collaborationNotes || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return rows.map((n) => {
    const u = n.authorId;
    const aid = u && typeof u === 'object' && u._id ? u._id : n.authorId;
    return {
      _id: n._id,
      text: n.text,
      roleKey: n.roleKey,
      roleLabel: collaborationRoleLabel(n.roleKey),
      createdAt: n.createdAt,
      author: u && typeof u === 'object'
        ? { id: String(u._id), name: u.name || '', email: u.email || '' }
        : { id: String(aid), name: '', email: '' },
    };
  });
}

/**
 * GET /api/students/[id]/collaboration
 * Notes thread + team roster; professorOptions when caller can manage team.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    const { id } = await params;

    await connectDB();
    const student = await Student.findById(id)
      .populate('createdBy', 'name email')
      .populate('collaborators.userId', 'name email role')
      .populate('collaborationNotes.authorId', 'name email');

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (!canUseCollaboration(user, student)) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const manage = canManageCollaborators(user, student);
    let professorOptions = [];
    if (manage) {
      professorOptions = await User.find({ role: 'professor' })
        .select('name email')
        .sort({ name: 1 })
        .lean();
      const primaryId = String(student.createdBy?._id || student.createdBy);
      professorOptions = professorOptions.filter((p) => String(p._id) !== primaryId);
    }

    return NextResponse.json({
      success: true,
      studentId: String(student._id),
      studentName: student.name,
      primary: {
        id: String(student.createdBy?._id || student.createdBy),
        name: student.createdBy?.name || '',
        email: student.createdBy?.email || '',
      },
      collaborators: serializeCollaborators(student),
      notes: serializeNotes(student),
      canManageCollaborators: manage,
      professorOptions,
      roleKeys: COLLABORATION_ROLE_KEYS,
      roleLabels: COLLABORATION_ROLE_LABELS,
    });
  } catch (error) {
    console.error('GET collaboration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students/[id]/collaboration
 * Append note (primary uses CASE_MANAGER role unless overridden elsewhere).
 */
export async function POST(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {
      /* empty */
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ success: false, message: 'Note text is required' }, { status: 400 });
    }
    if (text.length > NOTE_MAX_LEN) {
      return NextResponse.json(
        { success: false, message: `Note must be at most ${NOTE_MAX_LEN} characters` },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (!canUseCollaboration(user, student)) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    let roleKey = 'CASE_MANAGER';
    if (String(user._id) !== String(student.createdBy)) {
      const row = (student.collaborators || []).find((c) => String(c.userId) === String(user._id));
      if (!row) {
        return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
      }
      roleKey = row.roleKey;
    }

    student.collaborationNotes.push({
      authorId: user._id,
      roleKey,
      text,
      createdAt: new Date(),
    });

    while (student.collaborationNotes.length > MAX_COLLABORATION_NOTES) {
      student.collaborationNotes.shift();
    }

    await student.save();

    const refreshed = await Student.findById(id).populate('collaborationNotes.authorId', 'name email');

    return NextResponse.json({
      success: true,
      notes: serializeNotes(refreshed),
    });
  } catch (error) {
    console.error('POST collaboration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[id]/collaboration
 * Replace collaborator list (primary / admin only). Primary roster owner cannot be listed as collaborator.
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    const { id } = await params;
    let body = {};
    try {
      body = await request.json();
    } catch {
      /* empty */
    }

    const incoming = body.collaborators;
    if (!Array.isArray(incoming)) {
      return NextResponse.json(
        { success: false, message: 'collaborators must be an array' },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (!canManageCollaborators(user, student)) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const primaryId = String(student.createdBy);

    const oldCollabIds = new Set(
      (student.collaborators || []).map((c) => {
        const u = c.userId;
        return String(u && typeof u === 'object' && u._id ? u._id : u);
      })
    );

    const byUser = new Map();
    for (const row of incoming) {
      const uid = row?.userId != null ? String(row.userId).trim() : '';
      if (!uid || uid === primaryId) continue;
      const rk = row?.roleKey;
      if (!isValidCollaborationRoleKey(rk)) {
        return NextResponse.json(
          { success: false, message: `Invalid roleKey for user ${uid}` },
          { status: 400 }
        );
      }
      const prof = await User.findOne({ _id: uid, role: 'professor' }).select('_id').lean();
      if (!prof) {
        return NextResponse.json(
          { success: false, message: `Not a professor account: ${uid}` },
          { status: 400 }
        );
      }
      byUser.set(uid, { userId: uid, roleKey: rk, addedAt: new Date() });
    }

    const addedCollabUserIds = [...byUser.keys()].filter((uid) => !oldCollabIds.has(uid));
    const studentNameForNotif = student.name || 'Student';

    student.collaborators = [...byUser.values()];
    await student.save();

    if (addedCollabUserIds.length > 0) {
      const bodyText = `You were added to the team for ${studentNameForNotif}.`;
      await Promise.all(
        addedCollabUserIds.map((recipientId) =>
          Notification.create({
            userId: recipientId,
            type: 'collaboration_invited',
            studentId: student._id,
            title: 'Team collaboration',
            body: bodyText,
          })
        )
      );
    }

    const refreshed = await Student.findById(id)
      .populate('collaborators.userId', 'name email role');

    return NextResponse.json({
      success: true,
      collaborators: serializeCollaborators(refreshed),
    });
  } catch (error) {
    console.error('PATCH collaboration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

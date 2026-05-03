import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Student from '@/models/Student';
import { protectRoute } from '@/lib/authMiddleware';

/**
 * GET /api/notifications — list for current user (professors; empty for others).
 */
export async function GET(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    if (user.role !== 'professor') {
      return NextResponse.json({
        success: true,
        unreadCount: 0,
        notifications: [],
      });
    }

    await connectDB();

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const studentIds = [...new Set(notifications.map((n) => String(n.studentId)))];
    const students = await Student.find({ _id: { $in: studentIds } })
      .select('name')
      .lean();
    const nameById = Object.fromEntries(students.map((s) => [String(s._id), s.name || 'Student']));

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    const out = notifications.map((n) => ({
      _id: String(n._id),
      type: n.type,
      studentId: String(n.studentId),
      studentName: nameById[String(n.studentId)] || 'Student',
      title: n.title || '',
      body: n.body || '',
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications: out,
    });
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { protectRoute } from '@/lib/authMiddleware';

/**
 * PATCH /api/notifications/[id] — mark one notification as read (body optional).
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    const { id } = await params;

    await connectDB();

    const notif = await Notification.findOne({ _id: id, userId: user._id });
    if (!notif) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    notif.readAt = new Date();
    await notif.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

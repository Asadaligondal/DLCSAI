import connectDB from '@/lib/mongodb';
import Accommodation from '@/models/Accommodation';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';

export async function DELETE(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const user = authResult.user;
    if (!user || (user.role !== 'admin' && user.role !== 'professor')) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

    await connectDB();
    const removed = await Accommodation.findByIdAndDelete(id);
    if (!removed) {
      return NextResponse.json({ success: false, message: 'Accommodation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Accommodation removed' });
  } catch (error) {
    console.error('Delete Accommodation Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete accommodation', error: error.message }, { status: 500 });
  }
}

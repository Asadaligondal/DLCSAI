import connectDB from '@/lib/mongodb';
import Accommodation from '@/models/Accommodation';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    await connectDB();
    const accommodations = await Accommodation.find({}).sort({ category: 1, createdAt: -1 });
    return NextResponse.json({ success: true, accommodations });
  } catch (error) {
    console.error('Get Accommodations Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch accommodations', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    // allow both admin and professor
    const user = authResult.user;
    if (!user || (user.role !== 'admin' && user.role !== 'professor')) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { category, description } = body;
    if (!category || !description) {
      return NextResponse.json({ success: false, message: 'Category and description are required' }, { status: 400 });
    }

    await connectDB();
    const acc = await Accommodation.create({ category, description });
    return NextResponse.json({ success: true, accommodation: acc }, { status: 201 });
  } catch (error) {
    console.error('Create Accommodation Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create accommodation', error: error.message }, { status: 500 });
  }
}

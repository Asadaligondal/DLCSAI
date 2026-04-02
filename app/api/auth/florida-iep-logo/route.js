import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { protectRoute } from '@/lib/authMiddleware';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const userId = String(authResult.user._id);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large. Max 2MB.' }, { status: 400 });
    }

    if (file.type !== 'image/png') {
      return NextResponse.json({ success: false, message: 'PNG only.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'florida-iep-logo');
    await mkdir(uploadDir, { recursive: true });

    const filename = `${userId}.png`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const floridaIepLogo = `/uploads/florida-iep-logo/${filename}`;

    await connectDB();
    await User.findByIdAndUpdate(userId, { floridaIepLogo });

    return NextResponse.json({ success: true, floridaIepLogo });
  } catch (error) {
    console.error('Florida IEP logo upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const userId = String(authResult.user._id);
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'florida-iep-logo', `${userId}.png`);

    try {
      await unlink(filepath);
    } catch {
      /* file may not exist */
    }

    await connectDB();
    await User.findByIdAndUpdate(userId, { floridaIepLogo: null });

    return NextResponse.json({ success: true, floridaIepLogo: null });
  } catch (error) {
    console.error('Florida IEP logo delete error:', error);
    return NextResponse.json(
      { success: false, message: 'Remove failed', error: error.message },
      { status: 500 }
    );
  }
}

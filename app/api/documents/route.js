import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';

/**
 * GET /api/documents
 * List uploaded documents (for verification and future UI)
 */
export async function GET(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    await connectDB();

    const docs = await Document.find()
      .sort({ uploadedAt: -1 })
      .select('name originalFilename status chunkCount pageCount uploadedAt')
      .lean();

    return NextResponse.json({
      success: true,
      documents: docs.map(d => ({
        id: String(d._id),
        name: d.name,
        originalFilename: d.originalFilename,
        status: d.status,
        chunkCount: d.chunkCount,
        pageCount: d.pageCount,
        uploadedAt: d.uploadedAt
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

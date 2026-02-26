import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { deleteDocumentChunks } from '@/lib/vectorStore';

/**
 * DELETE /api/documents/[id]
 * Delete a document and its chunks
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Document ID required' },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    await deleteDocumentChunks(id);
    await Document.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Document deleted'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

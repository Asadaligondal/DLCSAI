import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { deleteDocumentChunks } from '@/lib/vectorStore';

const CONTEXT_CATEGORIES = new Set(['institutional', 'student_evaluation', 'state_regulation']);

/**
 * PATCH /api/documents/[id]
 * Update active flag, description, or context category (metadata only).
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Document ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (typeof body.active === 'boolean') updates.active = body.active;
    if (typeof body.description === 'string' && body.description.length <= 2000) {
      updates.description = body.description.trim();
    }
    if (body.contextCategory != null && CONTEXT_CATEGORIES.has(String(body.contextCategory))) {
      updates.contextCategory = body.contextCategory;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await connectDB();
    const doc = await Document.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: String(doc._id),
        active: doc.active !== false,
        description: doc.description || '',
        contextCategory: doc.contextCategory || 'institutional',
      },
    });
  } catch (error) {
    console.error('Patch document error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

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

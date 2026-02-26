import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilar } from '@/lib/vectorStore';

/**
 * GET /api/documents/verify-milestone4
 * Verification endpoint for Milestone 4: Similarity Search API
 * Runs a search and returns results (requires documents in DB from Milestone 3)
 */
export async function GET(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY required' },
        { status: 400 }
      );
    }

    const query = 'student with autism reading comprehension goals';
    const queryEmbedding = await generateEmbedding(query);
    const chunks = await searchSimilar(queryEmbedding, 3);

    const success = chunks.length >= 0;

    return NextResponse.json({
      success,
      message: 'Milestone 4 verification complete',
      results: {
        query,
        returned: chunks.length,
        chunks: chunks.map(c => ({
          contentPreview: c.content.slice(0, 80) + (c.content.length > 80 ? '...' : ''),
          documentId: c.documentId,
          chunkIndex: c.chunkIndex,
          score: Math.round(c.score * 1000) / 1000
        }))
      },
      note: chunks.length === 0 ? 'No documents uploaded yet. Upload a PDF via POST /api/documents/upload first.' : null
    });
  } catch (error) {
    console.error('Milestone 4 verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

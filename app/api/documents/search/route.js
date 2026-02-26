import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilar } from '@/lib/vectorStore';

/**
 * POST /api/documents/search
 * Search for chunks most relevant to the query (e.g., student context)
 * Body: { query: string, limit?: number, documentId?: string }
 */
export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;

    const body = await request.json();
    const { query, limit = 10, documentId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, message: 'query (string) is required' },
        { status: 400 }
      );
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return NextResponse.json(
        { success: false, message: 'query cannot be empty' },
        { status: 400 }
      );
    }

    const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const queryEmbedding = await generateEmbedding(trimmed);
    const chunks = await searchSimilar(queryEmbedding, limitNum, { documentId });

    return NextResponse.json({
      success: true,
      chunks: chunks.map(c => ({
        content: c.content,
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        score: Math.round(c.score * 1000) / 1000
      }))
    });
  } catch (error) {
    console.error('Document search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

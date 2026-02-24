import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { generateEmbedding } from '@/lib/embeddings';
import { storeDocumentChunks, searchSimilar, deleteDocumentChunks } from '@/lib/vectorStore';

const TEST_CHUNKS = [
  { content: 'Annual Goal: Reading Comprehension. The student will improve reading comprehension by identifying main idea and supporting details in grade-level text with 80% accuracy.', chunkIndex: 0 },
  { content: 'Annual Goal: Written Expression. The student will compose multi-paragraph essays with introduction, body, and conclusion with 85% of rubric criteria met.', chunkIndex: 1 },
  { content: 'Annual Goal: Math Problem Solving. The student will solve multi-step word problems using grade-level operations with 75% accuracy across 4 consecutive assessments.', chunkIndex: 2 },
  { content: 'Social Skills: The student will demonstrate appropriate social interactions with peers and adults in structured settings with minimal prompts.', chunkIndex: 3 }
];

/**
 * GET /api/documents/verify-milestone2
 * Verification endpoint for Milestone 2: Vector index + storage
 * 
 * Query params:
 *   cleanup=1 - Delete test data after verification
 */
export async function GET(request) {
  let testDocId = null;

  try {
    const { searchParams } = new URL(request.url);
    const cleanup = searchParams.get('cleanup') === '1';

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY required for Milestone 2 verification' },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Create test document
    const doc = await Document.create({
      name: 'Milestone 2 Test Document',
      originalFilename: 'test-milestone2.pdf',
      status: 'ready',
      chunkCount: 0
    });
    testDocId = doc._id;

    // 2. Generate embeddings and store chunks
    const chunksWithEmbeddings = [];
    for (const c of TEST_CHUNKS) {
      const embedding = await generateEmbedding(c.content);
      chunksWithEmbeddings.push({
        content: c.content,
        embedding,
        chunkIndex: c.chunkIndex
      });
    }

    const stored = await storeDocumentChunks(testDocId, chunksWithEmbeddings);

    // 3. Run similarity search
    const queryEmbedding = await generateEmbedding('student with autism reading comprehension goals');
    const results = await searchSimilar(queryEmbedding, 3);

    // 4. Cleanup if requested
    if (cleanup) {
      await deleteDocumentChunks(testDocId);
      await Document.findByIdAndDelete(testDocId);
    }

    const success = stored === TEST_CHUNKS.length && results.length > 0 && results[0].score > 0;

    return NextResponse.json({
      success,
      message: 'Milestone 2 verification complete',
      results: {
        storeDocumentChunks: { stored, expected: TEST_CHUNKS.length },
        searchSimilar: {
          query: 'student with autism reading comprehension goals',
          returned: results.length,
          topChunk: results[0] ? {
            contentPreview: results[0].content.slice(0, 80) + '...',
            score: Math.round(results[0].score * 1000) / 1000
          } : null,
          allScores: results.map(r => Math.round(r.score * 1000) / 1000)
        },
        cleanup: cleanup ? 'Test data deleted' : 'Use ?cleanup=1 to delete test data'
      }
    });
  } catch (error) {
    console.error('Milestone 2 verification error:', error);

    if (testDocId) {
      try {
        await deleteDocumentChunks(testDocId);
        await Document.findByIdAndDelete(testDocId);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

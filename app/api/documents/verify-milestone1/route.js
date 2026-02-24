import { NextResponse } from 'next/server';
import { chunkText } from '@/lib/chunking';
import { generateEmbedding } from '@/lib/embeddings';

const SAMPLE_TEXT = `
Annual Goal 1: Reading Comprehension
The student will improve reading comprehension by identifying the main idea and supporting details in grade-level text with 80% accuracy across 4 consecutive data points.

Short-term Objective 1.1: Given a passage, the student will identify the main idea with 75% accuracy.
Short-term Objective 1.2: Given a passage, the student will identify 2-3 supporting details with 70% accuracy.

Annual Goal 2: Written Expression
The student will improve written expression by composing a multi-paragraph essay with an introduction, body, and conclusion with 85% of rubric criteria met.
`.trim();

/**
 * GET /api/documents/verify-milestone1
 * Verification endpoint for Milestone 1: Data model + embeddings + chunking
 */
export async function GET() {
  try {
    const results = { chunking: null, embedding: null, success: false };

    // 1. Test chunking
    const chunks = chunkText(SAMPLE_TEXT, { chunkSize: 200, chunkOverlap: 50 });
    results.chunking = {
      chunkCount: chunks.length,
      sampleChunkLength: chunks[0]?.content?.length ?? 0,
      chunkIndexes: chunks.map(c => c.index)
    };

    // 2. Test embedding (requires OPENAI_API_KEY)
    if (process.env.OPENAI_API_KEY) {
      const embedding = await generateEmbedding(chunks[0]?.content || SAMPLE_TEXT.slice(0, 100));
      results.embedding = {
        length: embedding.length,
        expectedLength: 1536,
        match: embedding.length === 1536
      };
    } else {
      results.embedding = { error: 'OPENAI_API_KEY not set - skipping embedding test' };
    }

    results.success = results.chunking.chunkCount > 0 && (
      !process.env.OPENAI_API_KEY || results.embedding?.match
    );

    return NextResponse.json({
      success: results.success,
      message: 'Milestone 1 verification complete',
      results
    });
  } catch (error) {
    console.error('Milestone 1 verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

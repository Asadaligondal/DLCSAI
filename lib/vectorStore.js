import connectDB from './mongodb';
import DocumentChunk from '@/models/DocumentChunk';

/**
 * Compute cosine similarity between two vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} Similarity score 0-1 (1 = identical)
 */
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Store document chunks with embeddings in the database
 * @param {string} documentId - MongoDB ObjectId of the parent Document
 * @param {Array<{content: string, embedding: number[], chunkIndex: number, pageStart?: number, pageEnd?: number, metadata?: object}>} chunks
 * @returns {Promise<number>} Number of chunks stored
 */
export async function storeDocumentChunks(documentId, chunks) {
  if (!documentId || !Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('documentId and non-empty chunks array required');
  }

  await connectDB();

  const docs = chunks.map((c) => ({
    documentId,
    content: c.content,
    embedding: c.embedding,
    chunkIndex: c.chunkIndex,
    pageStart: c.pageStart ?? null,
    pageEnd: c.pageEnd ?? null,
    metadata: c.metadata ?? {}
  }));

  await DocumentChunk.insertMany(docs);
  return docs.length;
}

/**
 * Search for chunks most similar to the query embedding
 * Uses application-level cosine similarity (works with any MongoDB; for scale, use Atlas Vector Search)
 * @param {number[]} queryEmbedding - Embedding vector of the search query
 * @param {number} limit - Max number of chunks to return (default 10)
 * @param {Object} options - Optional filters
 * @param {string} options.documentId - Filter by document ID
 * @param {string} options.createdBy - Filter by user (if chunks had createdBy; DocumentChunk doesn't have it, but Document does - we'd need to join; skip for now)
 * @returns {Promise<Array<{content: string, documentId: string, chunkIndex: number, score: number}>>}
 */
export async function searchSimilar(queryEmbedding, limit = 10, options = {}) {
  if (!queryEmbedding?.length) {
    throw new Error('queryEmbedding required');
  }

  await connectDB();

  const filter = {};
  if (options.documentId) filter.documentId = options.documentId;

  const chunks = await DocumentChunk.find(filter)
    .select('content documentId chunkIndex embedding')
    .lean();

  const scored = chunks
    .map((c) => ({
      content: c.content,
      documentId: String(c.documentId),
      chunkIndex: c.chunkIndex,
      score: cosineSimilarity(queryEmbedding, c.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/**
 * Delete all chunks for a document
 * @param {string} documentId
 * @returns {Promise<number>} Number of chunks deleted
 */
export async function deleteDocumentChunks(documentId) {
  if (!documentId) throw new Error('documentId required');
  await connectDB();
  const result = await DocumentChunk.deleteMany({ documentId });
  return result.deletedCount;
}

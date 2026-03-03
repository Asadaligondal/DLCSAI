import connectDB from './mongodb';
import DocumentChunk from '@/models/DocumentChunk';
import mongoose from 'mongoose';

const VECTOR_INDEX_NAME = process.env.MONGODB_VECTOR_INDEX_NAME || 'document_chunks_vector';

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
 * Atlas Vector Search: uses $vectorSearch aggregation (MongoDB Atlas only).
 * Falls back to in-memory search if index doesn't exist or on error.
 * @param {number[]} queryEmbedding - Embedding vector
 * @param {number} limit - Max chunks to return
 * @param {Object} options - Optional filters
 * @returns {Promise<Array<{content: string, documentId: string, chunkIndex: number, score: number}>>}
 */
async function searchSimilarAtlas(queryEmbedding, limit = 10, options = {}) {
  await connectDB();

  const filter = {};
  if (options.documentId) filter.documentId = new mongoose.Types.ObjectId(options.documentId);

  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: Math.min(100, limit * 10),
        limit,
        ...(Object.keys(filter).length ? { filter } : {})
      }
    },
    {
      $project: {
        content: 1,
        documentId: 1,
        chunkIndex: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  const results = await DocumentChunk.aggregate(pipeline);
  return results.map((r) => ({
    content: r.content,
    documentId: String(r.documentId),
    chunkIndex: r.chunkIndex,
    score: r.score ?? 0
  }));
}

/**
 * Batch search: tries Atlas Vector Search first (when MONGODB_VECTOR_INDEX_NAME is set),
 * falls back to in-memory search. Loads chunks once for in-memory fallback.
 * @param {number[][]} queryEmbeddings - Array of embedding vectors
 * @param {number} limitPerQuery - Max chunks per query (default 10)
 * @param {Object} options - Optional filters (e.g. documentId)
 * @returns {Promise<Array<Array<{content: string, documentId: string, chunkIndex: number, score: number}>>>}
 */
export async function searchSimilarBatch(queryEmbeddings, limitPerQuery = 10, options = {}) {
  if (!Array.isArray(queryEmbeddings) || queryEmbeddings.length === 0) {
    return [];
  }

  await connectDB();

  // Try Atlas Vector Search if index is configured (Atlas clusters only)
  if (VECTOR_INDEX_NAME && process.env.MONGODB_URI?.includes('mongodb.net')) {
    try {
      const results = await Promise.all(
        queryEmbeddings.map((emb) =>
          emb?.length ? searchSimilarAtlas(emb, limitPerQuery, options) : []
        )
      );
      const totalFound = results.reduce((sum, r) => sum + r.length, 0);
      if (totalFound === 0) {
        console.warn('[RAG] Atlas returned 0 chunks, falling back to in-memory search');
      } else {
        return results;
      }
    } catch (err) {
      console.warn('[RAG] Atlas Vector Search failed, falling back to in-memory:', err.message);
    }
  }

  // In-memory: load chunks once, compute cosine similarity for each query
  const filter = {};
  if (options.documentId) filter.documentId = options.documentId;

  const chunks = await DocumentChunk.find(filter)
    .select('content documentId chunkIndex embedding')
    .lean();

  console.log('[RAG] DocumentChunk collection:', chunks.length, 'chunks');

  if (chunks.length === 0) {
    const Document = (await import('@/models/Document')).default;
    const readyDocs = await Document.countDocuments({ status: 'ready', chunkCount: { $gt: 0 } });
    if (readyDocs > 0) {
      console.error('[RAG] BUG: Documents report chunkCount > 0 but DocumentChunk collection is empty. Data may be inconsistent.');
    } else {
      console.warn('[RAG] No chunks in DB. Upload PDFs on IEP Writer page (/iep-writer), ensure they reach status "ready" with chunk count > 0.');
    }
    return queryEmbeddings.map(() => []);
  }

  const queryDim = queryEmbeddings.find(e => e?.length)?.length ?? 0;
  const chunkDim = chunks[0]?.embedding?.length ?? 0;
  if (queryDim && chunkDim && queryDim !== chunkDim) {
    console.warn('[RAG] Embedding dimension mismatch: query', queryDim, 'vs chunk', chunkDim);
  }

  return queryEmbeddings.map((queryEmbedding) => {
    if (!queryEmbedding?.length) return [];
    const scored = chunks
      .map((c) => ({
        content: c.content,
        documentId: String(c.documentId),
        chunkIndex: c.chunkIndex,
        score: cosineSimilarity(queryEmbedding, c.embedding)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerQuery);
    return scored;
  });
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

import connectDB from './mongodb';
import DocumentChunk from '@/models/DocumentChunk';
import mongoose from 'mongoose';

const VECTOR_INDEX_NAME = process.env.MONGODB_VECTOR_INDEX_NAME || 'document_chunks_vector';

// ---------------------------------------------------------------------------
// In-memory chunk cache — avoids re-fetching 6MB of embeddings from MongoDB
// on every search when Atlas Vector Search is unavailable.
// ---------------------------------------------------------------------------
let _chunkCache = null;
let _chunkCacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateChunkCache() {
  _chunkCache = null;
  _chunkCacheTs = 0;
  console.log('[RAG] Chunk cache invalidated');
}

async function getCachedChunks(filter = {}) {
  const now = Date.now();
  const hasFilter = Object.keys(filter).length > 0;

  // bypass cache if there's a specific filter (e.g. documentId)
  if (hasFilter || !_chunkCache || (now - _chunkCacheTs) > CACHE_TTL_MS) {
    const t0 = Date.now();
    const chunks = await DocumentChunk.find(filter)
      .select('content documentId chunkIndex embedding')
      .lean();
    const elapsed = Date.now() - t0;
    console.log(`[RAG] Loaded ${chunks.length} chunks from DB in ${elapsed}ms`);

    if (!hasFilter) {
      _chunkCache = chunks;
      _chunkCacheTs = now;
    }
    return chunks;
  }

  console.log(`[RAG] Using cached ${_chunkCache.length} chunks (age: ${Math.round((now - _chunkCacheTs) / 1000)}s)`);
  return _chunkCache;
}

/**
 * Compute cosine similarity between two vectors
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
  invalidateChunkCache();
  return docs.length;
}

/**
 * Search for chunks most similar to the query embedding (single query, in-memory)
 */
export async function searchSimilar(queryEmbedding, limit = 10, options = {}) {
  if (!queryEmbedding?.length) {
    throw new Error('queryEmbedding required');
  }

  await connectDB();

  const filter = {};
  if (options.documentId) filter.documentId = options.documentId;

  const chunks = await getCachedChunks(filter);

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
        numCandidates: Math.max(100, limit * 10),
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
 * Batch search: tries Atlas Vector Search first, falls back to cached in-memory search.
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
        console.warn('[RAG] Atlas returned 0 chunks, falling back to cached in-memory search');
      } else {
        return results;
      }
    } catch (err) {
      console.warn('[RAG] Atlas Vector Search failed, falling back to cached in-memory:', err.message);
    }
  }

  // In-memory fallback with cache
  const filter = {};
  if (options.documentId) filter.documentId = options.documentId;

  const chunks = await getCachedChunks(filter);

  if (chunks.length === 0) {
    const Document = (await import('@/models/Document')).default;
    const readyDocs = await Document.countDocuments({ status: 'ready', chunkCount: { $gt: 0 } });
    if (readyDocs > 0) {
      console.error('[RAG] BUG: Documents report chunkCount > 0 but DocumentChunk collection is empty.');
    } else {
      console.warn('[RAG] No chunks in DB. Upload PDFs on IEP Writer page.');
    }
    return queryEmbeddings.map(() => []);
  }

  const queryDim = queryEmbeddings.find(e => e?.length)?.length ?? 0;
  const chunkDim = chunks[0]?.embedding?.length ?? 0;
  if (queryDim && chunkDim && queryDim !== chunkDim) {
    console.warn('[RAG] Embedding dimension mismatch: query', queryDim, 'vs chunk', chunkDim);
  }

  const t0 = Date.now();
  const results = queryEmbeddings.map((queryEmbedding) => {
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
  console.log(`[RAG] In-memory similarity computed in ${Date.now() - t0}ms`);

  return results;
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(documentId) {
  if (!documentId) throw new Error('documentId required');
  await connectDB();
  const result = await DocumentChunk.deleteMany({ documentId });
  invalidateChunkCache();
  return result.deletedCount;
}

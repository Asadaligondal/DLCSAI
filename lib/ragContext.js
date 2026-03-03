import { generateEmbeddingsBatch } from './embeddings';
import { searchSimilarBatch } from './vectorStore';

const TOP_K_PER_QUERY = 5;
const FINAL_LIMIT = 12;
const MAX_MICRO_QUERIES = 10;

/**
 * Build micro-queries from student context for multi-query retrieval.
 * Each query targets a different axis: disability, weakness, accommodation, custom goals, strengths, instructional setting.
 * Excludes: grade+subject, age-appropriate.
 */
function buildMicroQueries(context) {
  const queries = [];
  const suffix = 'IEP goals objectives';

  if (Array.isArray(context.exceptionalities) && context.exceptionalities.length > 0) {
    queries.push(`${context.exceptionalities.join(' ')} ${suffix}`);
  }
  if (Array.isArray(context.weaknesses) && context.weaknesses.length > 0) {
    queries.push(`${context.weaknesses.join(' ')} ${suffix}`);
  }
  if (Array.isArray(context.accommodations) && context.accommodations.length > 0) {
    queries.push(`${context.accommodations.join(' ')} ${suffix}`);
  }
  if (Array.isArray(context.customGoals) && context.customGoals.length > 0) {
    const titles = context.customGoals.map(g => g?.title ?? g).filter(Boolean);
    if (titles.length) queries.push(`${titles.join(' ')} ${suffix}`);
  }
  if (Array.isArray(context.strengths) && context.strengths.length > 0) {
    queries.push(`${context.strengths.join(' ')} IEP goals objectives`);
  }
  if (context.instructionalSetting && String(context.instructionalSetting).trim()) {
    queries.push(`${context.instructionalSetting} IEP goals objectives`);
  }

  // De-duplicate and cap
  const seen = new Set();
  return queries
    .filter(q => q && q.trim())
    .filter(q => {
      const key = q.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_MICRO_QUERIES);
}

/**
 * Union, de-dup by documentId+chunkIndex, merge scores (keep max), rerank by score, take top N.
 */
function unionDedupRerank(allChunks) {
  const byKey = new Map();
  for (const c of allChunks) {
    const key = `${c.documentId}|${c.chunkIndex}`;
    const existing = byKey.get(key);
    if (!existing || c.score > existing.score) {
      byKey.set(key, { ...c });
    }
  }
  return Array.from(byKey.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, FINAL_LIMIT);
}

/** Labels for query axes (matches buildMicroQueries order) */
const QUERY_LABELS = ['Exceptionalities', 'Weaknesses', 'Accommodations', 'Custom Goals', 'Strengths', 'Instructional Setting'];

const QUERY_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200'
];

/**
 * Retrieve relevant chunks from uploaded documents using multi-query retrieval
 * @param {Object} studentContext - exceptionalities, weaknesses, strengths, accommodations, customGoals, instructionalSetting
 * @returns {Promise<{ flat: string, byQuery: Array<{ query: string, label: string, colorClass: string, chunks: Array<{ content: string, score: number }> }> }>}
 */
export async function getRagContext(studentContext) {
  try {
    const queries = buildMicroQueries(studentContext);
    if (queries.length === 0) return { flat: '', byQuery: [] };

    console.log('[RAG] Multi-query retrieval:', queries.length, 'queries');
    console.log('[RAG] Inputs used:', {
      exceptionalities: studentContext.exceptionalities,
      weaknesses: studentContext.weaknesses,
      strengths: studentContext.strengths,
      accommodations: studentContext.accommodations ?? [],
      customGoals: studentContext.customGoals?.map(g => g?.title ?? g) ?? [],
      instructionalSetting: studentContext.instructionalSetting
    });
    console.log('[RAG] Queries:', queries);

    const embeddings = await generateEmbeddingsBatch(queries);
    if (embeddings.length === 0) return { flat: '', byQuery: [] };

    // Batch search: load chunks once, compute all similarities in memory (avoids N DB round-trips)
    const resultsPerQuery = await searchSimilarBatch(embeddings, TOP_K_PER_QUERY);
    const allChunks = [];
    for (let i = 0; i < resultsPerQuery.length; i++) {
      allChunks.push(...resultsPerQuery[i].map(c => ({ ...c, queryIdx: i, query: queries[i] })));
    }

    if (allChunks.length === 0) {
      console.log('[RAG] No chunks returned from similarity search.');
      return { flat: '', byQuery: [] };
    }

    const final = unionDedupRerank(allChunks);
    console.log('[RAG] Similarity search returned', allChunks.length, 'raw chunks ->', final.length, 'after union/de-dup/rerank');

    const combined = final
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    // Group by query for UI display (preserve query order)
    const byQueryMap = new Map();
    for (let i = 0; i < queries.length; i++) {
      byQueryMap.set(queries[i], {
        query: queries[i],
        label: QUERY_LABELS[i] || `Query ${i + 1}`,
        colorClass: QUERY_COLORS[i % QUERY_COLORS.length],
        chunks: []
      });
    }
    for (const c of final) {
      const entry = byQueryMap.get(c.query);
      if (entry) entry.chunks.push({ content: c.content, score: c.score });
    }
    const byQuery = Array.from(byQueryMap.values()).filter(e => e.chunks.length > 0);

    console.log('[RAG] Final context length:', combined.length, 'chars');

    return { flat: combined, byQuery };
  } catch (err) {
    console.warn('[RAG] Context retrieval failed:', err.message);
    return { flat: '', byQuery: [] };
  }
}

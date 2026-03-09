import { generateEmbeddingsBatch } from './embeddings';
import { searchSimilarBatch } from './vectorStore';

const TOP_K_BASELINE = 20;
const TOP_K_GROUPED = 25;
const TOP_K_SECTION = 20;
const FINAL_LIMIT = 60;
const MAX_MICRO_QUERIES = 10;
const SCORE_THRESHOLD_GROUPED = 0.4;

// ---------------------------------------------------------------------------
// Strategy A: Baseline — 6 queries by student attribute
// ---------------------------------------------------------------------------
function buildQueriesBaseline(context) {
  const queries = [];
  const labels = [];
  const suffix = 'IEP goals objectives';

  if (Array.isArray(context.exceptionalities) && context.exceptionalities.length > 0) {
    queries.push(`${context.exceptionalities.join(' ')} ${suffix}`);
    labels.push('Exceptionalities');
  }
  if (Array.isArray(context.weaknesses) && context.weaknesses.length > 0) {
    queries.push(`${context.weaknesses.join(' ')} ${suffix}`);
    labels.push('Weaknesses');
  }
  if (Array.isArray(context.accommodations) && context.accommodations.length > 0) {
    queries.push(`${context.accommodations.join(' ')} ${suffix}`);
    labels.push('Accommodations');
  }
  if (Array.isArray(context.customGoals) && context.customGoals.length > 0) {
    const titles = context.customGoals.map(g => g?.title ?? g).filter(Boolean);
    if (titles.length) {
      queries.push(`${titles.join(' ')} ${suffix}`);
      labels.push('Custom Goals');
    }
  }
  if (Array.isArray(context.strengths) && context.strengths.length > 0) {
    queries.push(`${context.strengths.join(' ')} ${suffix}`);
    labels.push('Strengths');
  }
  if (context.instructionalSetting && String(context.instructionalSetting).trim()) {
    queries.push(`${context.instructionalSetting} ${suffix}`);
    labels.push('Instructional Setting');
  }

  return dedup(queries, labels);
}

// ---------------------------------------------------------------------------
// Strategy B: Grouped Consolidation — 3-4 merged queries
// ---------------------------------------------------------------------------
function buildQueriesGrouped(context) {
  const queries = [];
  const labels = [];
  const suffix = 'IEP goals objectives';

  const needsParts = [
    ...(Array.isArray(context.exceptionalities) ? context.exceptionalities : []),
    ...(Array.isArray(context.weaknesses) ? context.weaknesses : [])
  ];
  if (needsParts.length > 0) {
    queries.push(`${needsParts.join(' ')} ${suffix}`);
    labels.push('Student Needs');
  }

  const supportParts = [
    ...(Array.isArray(context.accommodations) ? context.accommodations : []),
    ...(context.instructionalSetting ? [String(context.instructionalSetting).trim()] : [])
  ].filter(Boolean);
  if (supportParts.length > 0) {
    queries.push(`${supportParts.join(' ')} ${suffix}`);
    labels.push('Support Context');
  }

  if (Array.isArray(context.customGoals) && context.customGoals.length > 0) {
    const titles = context.customGoals.map(g => g?.title ?? g).filter(Boolean);
    if (titles.length) {
      queries.push(`${titles.join(' ')} ${suffix}`);
      labels.push('Custom Goals');
    }
  }

  if (Array.isArray(context.strengths) && context.strengths.length > 0) {
    queries.push(`${context.strengths.join(' ')} ${suffix}`);
    labels.push('Strengths');
  }

  return dedup(queries, labels);
}

// ---------------------------------------------------------------------------
// Strategy C: Section-Aligned — 5 purpose-built queries, one per IEP section
// ---------------------------------------------------------------------------
function buildQueriesSection(context) {
  const queries = [];
  const labels = [];

  const except = Array.isArray(context.exceptionalities) ? context.exceptionalities.join(' ') : '';
  const weak = Array.isArray(context.weaknesses) ? context.weaknesses.join(' ') : '';
  const accom = Array.isArray(context.accommodations) ? context.accommodations.join(' ') : '';
  const strengths = Array.isArray(context.strengths) ? context.strengths.join(' ') : '';
  const setting = context.instructionalSetting ? String(context.instructionalSetting).trim() : '';
  const customTitles = Array.isArray(context.customGoals)
    ? context.customGoals.map(g => g?.title ?? g).filter(Boolean).join(' ')
    : '';

  // Q0: for exceptionality_goals section
  if (except || weak) {
    queries.push(`disability-specific IEP goals objectives for ${except} ${weak}`.trim());
    labels.push('exceptionality_goals');
  }

  // Q1: for broad_goals section
  if (weak || except) {
    queries.push(`broad academic functional annual goals objectives ${weak} ${except}`.trim());
    labels.push('broad_goals');
  }

  // Q2: for narratives section
  const narrParts = [except, weak, strengths].filter(Boolean).join(' ');
  if (narrParts) {
    queries.push(`present levels academic achievement functional performance ${narrParts}`.trim());
    labels.push('narratives');
  }

  // Q3: for accommodations_interventions section
  if (accom || setting) {
    queries.push(`accommodations interventions strategies ${accom} ${setting}`.trim());
    labels.push('accommodations_interventions');
  }

  // Q4: for custom_goals section
  if (customTitles) {
    queries.push(`${customTitles} IEP goals objectives strategies`);
    labels.push('custom_goals');
  }

  return dedup(queries, labels);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function dedup(queries, labels) {
  const seen = new Set();
  const outQ = [];
  const outL = [];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i]?.trim();
    if (!q) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    outQ.push(q);
    outL.push(labels[i]);
  }
  return { queries: outQ.slice(0, MAX_MICRO_QUERIES), labels: outL.slice(0, MAX_MICRO_QUERIES) };
}

function unionDedupRerank(allChunks, limit = FINAL_LIMIT, scoreThreshold = 0) {
  const byKey = new Map();
  for (const c of allChunks) {
    const key = `${c.documentId}|${c.chunkIndex}`;
    const existing = byKey.get(key);
    if (!existing || c.score > existing.score) {
      byKey.set(key, { ...c });
    }
  }
  return Array.from(byKey.values())
    .filter(c => c.score >= scoreThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function computeScoreStats(chunks) {
  if (!chunks.length) return { scoreMin: 0, scoreMax: 0, scoreMean: 0, scoreMedian: 0 };
  const scores = chunks.map(c => c.score).sort((a, b) => a - b);
  const sum = scores.reduce((s, v) => s + v, 0);
  const mid = Math.floor(scores.length / 2);
  return {
    scoreMin: +scores[0].toFixed(4),
    scoreMax: +scores[scores.length - 1].toFixed(4),
    scoreMean: +(sum / scores.length).toFixed(4),
    scoreMedian: +(scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2).toFixed(4)
  };
}

function estimateTokens(texts) {
  return texts.reduce((sum, t) => sum + Math.ceil((t || '').length / 4), 0);
}

const QUERY_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200'
];

// ---------------------------------------------------------------------------
// Main entry point — strategy dispatcher with metrics
// ---------------------------------------------------------------------------
export async function getRagContext(studentContext, strategy = 'baseline') {
  const t0 = Date.now();
  const emptyResult = { flat: '', byQuery: [], metrics: buildEmptyMetrics(strategy) };

  try {
    // Build queries based on strategy
    let queryResult;
    let topK;
    let scoreThreshold = 0;

    switch (strategy) {
      case 'grouped':
        queryResult = buildQueriesGrouped(studentContext);
        topK = TOP_K_GROUPED;
        scoreThreshold = SCORE_THRESHOLD_GROUPED;
        break;
      case 'section_aligned':
        queryResult = buildQueriesSection(studentContext);
        topK = TOP_K_SECTION;
        break;
      default:
        queryResult = buildQueriesBaseline(studentContext);
        topK = TOP_K_BASELINE;
        break;
    }

    const { queries, labels } = queryResult;
    if (queries.length === 0) return emptyResult;

    console.log(`[RAG][${strategy}] ${queries.length} queries:`, queries);

    // Embed
    const tEmbed0 = Date.now();
    const embeddings = await generateEmbeddingsBatch(queries);
    const embeddingTimeMs = Date.now() - tEmbed0;
    if (embeddings.length === 0) return emptyResult;

    // Search
    const tSearch0 = Date.now();
    const resultsPerQuery = await searchSimilarBatch(embeddings, topK);
    const searchTimeMs = Date.now() - tSearch0;

    const allChunks = [];
    for (let i = 0; i < resultsPerQuery.length; i++) {
      allChunks.push(...resultsPerQuery[i].map(c => ({ ...c, queryIdx: i, query: queries[i] })));
    }

    if (allChunks.length === 0) {
      console.log(`[RAG][${strategy}] No chunks returned.`);
      return emptyResult;
    }

    // For section_aligned, skip global dedup — each section gets its own dedicated pool
    let final;
    if (strategy === 'section_aligned') {
      final = allChunks
        .filter(c => c.score >= scoreThreshold)
        .sort((a, b) => b.score - a.score);
    } else {
      final = unionDedupRerank(allChunks, FINAL_LIMIT, scoreThreshold);
    }

    console.log(`[RAG][${strategy}] ${allChunks.length} raw -> ${final.length} final chunks`);

    const combined = final
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    // Group by query label
    const byQueryMap = new Map();
    for (let i = 0; i < queries.length; i++) {
      byQueryMap.set(queries[i], {
        query: queries[i],
        label: labels[i],
        colorClass: QUERY_COLORS[i % QUERY_COLORS.length],
        chunks: []
      });
    }
    for (const c of final) {
      const entry = byQueryMap.get(c.query);
      if (entry) entry.chunks.push({ content: c.content, score: c.score });
    }
    const byQuery = Array.from(byQueryMap.values()).filter(e => e.chunks.length > 0);

    const retrievalTimeMs = Date.now() - t0;

    const metrics = {
      strategy,
      retrievalTimeMs,
      embeddingTimeMs,
      searchTimeMs,
      queryCount: queries.length,
      embeddingTokensEstimate: estimateTokens(queries),
      chunksRawTotal: allChunks.length,
      chunksAfterDedup: final.length,
      ...computeScoreStats(final),
      chunksPerSection: {},
      contextCharsPerSection: {}
    };

    console.log(`[RAG][${strategy}] Done in ${retrievalTimeMs}ms (embed: ${embeddingTimeMs}ms, search: ${searchTimeMs}ms)`);

    return { flat: combined, byQuery, metrics };
  } catch (err) {
    console.warn(`[RAG][${strategy}] Failed:`, err.message);
    return emptyResult;
  }
}

function buildEmptyMetrics(strategy) {
  return {
    strategy,
    retrievalTimeMs: 0, embeddingTimeMs: 0, searchTimeMs: 0,
    queryCount: 0, embeddingTokensEstimate: 0,
    chunksRawTotal: 0, chunksAfterDedup: 0,
    scoreMin: 0, scoreMax: 0, scoreMean: 0, scoreMedian: 0,
    chunksPerSection: {}, contextCharsPerSection: {}
  };
}

import { generateEmbedding } from './embeddings';
import { searchSimilar } from './vectorStore';

const RAG_LIMIT = 8;

/**
 * Build a search query from student context for RAG retrieval
 */
function buildSearchQuery(context) {
  const parts = [];
  if (context.studentGrade) parts.push(`grade ${context.studentGrade}`);
  if (context.studentAge) parts.push(`age ${context.studentAge}`);
  if (context.areaOfNeed) parts.push(context.areaOfNeed);
  if (context.disabilityCategory) parts.push(context.disabilityCategory);
  if (Array.isArray(context.exceptionalities) && context.exceptionalities.length > 0) {
    parts.push(context.exceptionalities.join(' '));
  }
  if (Array.isArray(context.weaknesses) && context.weaknesses.length > 0) {
    parts.push(context.weaknesses.join(' '));
  }
  if (Array.isArray(context.customGoals) && context.customGoals.length > 0) {
    const titles = context.customGoals.map(g => g.title || g).filter(Boolean);
    if (titles.length) parts.push(titles.join(' '));
  }
  if (Array.isArray(context.accommodations) && context.accommodations.length > 0) {
    parts.push(context.accommodations.join(' '));
  }
  parts.push('IEP goals objectives');
  return parts.join(' ');
}

/**
 * Retrieve relevant chunks from uploaded documents for IEP generation
 * @param {Object} studentContext - studentGrade, studentAge, areaOfNeed, exceptionalities, weaknesses, customGoals, accommodations
 * @returns {Promise<string>} Combined chunk content or empty string if none
 */
export async function getRagContext(studentContext) {
  try {
    const query = buildSearchQuery(studentContext);
    if (!query.trim()) return '';

    console.log('[RAG] Searching for relevant context...');
    console.log('[RAG] Inputs used for query:', {
      studentGrade: studentContext.studentGrade,
      studentAge: studentContext.studentAge,
      areaOfNeed: studentContext.areaOfNeed,
      disabilityCategory: studentContext.disabilityCategory,
      exceptionalities: studentContext.exceptionalities,
      weaknesses: studentContext.weaknesses,
      customGoals: studentContext.customGoals?.map(g => g?.title ?? g) ?? [],
      accommodations: studentContext.accommodations ?? []
    });
    console.log('[RAG] Query:', query);

    const queryEmbedding = await generateEmbedding(query);
    const chunks = await searchSimilar(queryEmbedding, RAG_LIMIT);

    if (chunks.length === 0) {
      console.log('[RAG] No chunks returned from similarity search.');
      return '';
    }

    console.log('[RAG] Similarity search returned', chunks.length, 'chunks:');
    chunks.forEach((c, i) => {
      console.log(`[RAG] --- Chunk ${i + 1} (score: ${c.score.toFixed(3)}) ---`);
      console.log(c.content);
      console.log('[RAG] ---');
    });

    const combined = chunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    console.log('[RAG] Final context length:', combined.length, 'chars');

    return combined;
  } catch (err) {
    console.warn('[RAG] Context retrieval failed:', err.message);
    return '';
  }
}

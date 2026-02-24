/**
 * Recursive character splitter with overlap for RAG chunking.
 * @param {string} text - Full text to chunk
 * @param {Object} options - Chunking options
 * @param {number} options.chunkSize - Max characters per chunk (default 800)
 * @param {number} options.chunkOverlap - Overlap between chunks (default 100)
 * @returns {Array<{content: string, index: number}>} Array of chunk objects
 */
export function chunkText(text, options = {}) {
  const { chunkSize = 800, chunkOverlap = 100 } = options;

  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const chunks = [];
  let start = 0;

  while (start < trimmed.length) {
    let end = Math.min(start + chunkSize, trimmed.length);
    let slice = trimmed.slice(start, end);

    if (end < trimmed.length) {
      const lastPara = slice.lastIndexOf('\n\n');
      const lastLine = slice.lastIndexOf('\n');
      const lastSpace = slice.lastIndexOf(' ');
      const breakAt = Math.max(lastPara, lastLine, lastSpace);
      if (breakAt > chunkSize * 0.4) {
        slice = trimmed.slice(start, start + breakAt + 1);
        end = start + breakAt + 1;
      }
    }

    if (slice.trim()) {
      chunks.push({ content: slice.trim(), index: chunks.length });
    }

    start = end - (end < trimmed.length ? chunkOverlap : 0);
  }

  return chunks;
}

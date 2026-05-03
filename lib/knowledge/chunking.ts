const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 160;

export function cleanKnowledgeText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkKnowledgeText(input: string, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
  const text = cleanKnowledgeText(input);

  if (!text) {
    return [];
  }

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const targetEnd = Math.min(cursor + chunkSize, text.length);
    const paragraphBreak = text.lastIndexOf("\n\n", targetEnd);
    const sentenceBreak = text.lastIndexOf(". ", targetEnd);
    const candidateEnd = Math.max(paragraphBreak, sentenceBreak);
    const end = candidateEnd > cursor + chunkSize * 0.55 ? candidateEnd + 1 : targetEnd;
    const chunk = text.slice(cursor, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    cursor = Math.max(0, end - overlap);
  }

  return chunks;
}

export function formatEmbeddingForPgvector(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

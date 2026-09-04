export type SourcePage = {
  page: number;
  text: string;
};

export type TextChunk = {
  index: number;
  pageStart: number;
  pageEnd: number;
  text: string;
  tokenCount: number;
};

export type RankableChunk = TextChunk & { id: string };

export type RankedChunk<T extends RankableChunk> = T & { score: number };

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what', 'when', 'where', 'which', 'who', 'why', 'with',
]);

export function normalizeText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
}

function splitLongText(text: string, maxChars: number, overlapChars: number) {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf('. ', end), text.lastIndexOf(' ', end));
      if (boundary > start + Math.floor(maxChars * 0.55)) end = boundary + 1;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlapChars);
  }
  return chunks;
}

export function chunkPages(
  pages: SourcePage[],
  options: { maxChars?: number; overlapChars?: number } = {},
): TextChunk[] {
  const maxChars = Math.max(300, options.maxChars ?? 1200);
  const overlapChars = Math.min(Math.max(0, options.overlapChars ?? 180), Math.floor(maxChars / 3));
  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const normalized = normalizeText(page.text);
    if (!normalized) continue;
    const pieces = splitLongText(normalized, maxChars, overlapChars);
    for (const piece of pieces) {
      chunks.push({
        index: chunks.length,
        pageStart: page.page,
        pageEnd: page.page,
        text: piece,
        tokenCount: tokenize(piece).length,
      });
    }
  }

  return chunks;
}

export function rankChunks<T extends RankableChunk>(chunks: T[], query: string, limit = 5): RankedChunk<T>[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || limit <= 0) return [];
  const querySet = new Set(queryTokens);
  const normalizedQuery = normalizeText(query).toLocaleLowerCase();

  return chunks
    .map((chunk) => {
      const frequencies = new Map<string, number>();
      for (const token of tokenize(chunk.text)) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
      let score = 0;
      for (const token of querySet) {
        const frequency = frequencies.get(token) ?? 0;
        if (frequency > 0) score += 1 + Math.log1p(frequency) * 0.2;
      }
      score /= querySet.size;
      if (normalizedQuery.length > 3 && chunk.text.toLocaleLowerCase().includes(normalizedQuery)) score += 0.5;
      return { ...chunk, score: Number(score.toFixed(4)) };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, Math.min(Math.max(1, limit), 10));
}

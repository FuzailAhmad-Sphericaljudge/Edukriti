import { rankChunks, type RankableChunk } from '@edukriti/rag';
import { retrievalRequestSchema, retrievalResponseSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';

type StoredChunk = RankableChunk & {
  sourceId: string;
};

export async function POST(request: Request) {
  if (!env.DB) return apiError(503, 'STORAGE_UNAVAILABLE', 'Retrieval storage is not available in this environment.');

  const parsed = retrievalRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, 'INVALID_RETRIEVAL_REQUEST', 'Provide a source, query, and result limit.', parsed.error.issues);

  const result = await env.DB.prepare(
    'SELECT id, source_id AS sourceId, chunk_index AS `index`, page_start AS pageStart, page_end AS pageEnd, token_count AS tokenCount, content AS text FROM source_chunks WHERE source_id = ? ORDER BY chunk_index ASC LIMIT 1000',
  ).bind(parsed.data.sourceId).all<StoredChunk>();

  const ranked = rankChunks(result.results, parsed.data.query, parsed.data.limit);
  return Response.json(
    retrievalResponseSchema.parse({
      query: parsed.data.query,
      grounded: ranked.length > 0,
      citations: ranked.map((chunk) => ({
        sourceId: parsed.data.sourceId,
        chunkId: chunk.id,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        excerpt: chunk.text.slice(0, 700),
        score: chunk.score,
      })),
    }),
  );
}

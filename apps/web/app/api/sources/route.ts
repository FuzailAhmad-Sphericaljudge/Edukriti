import { chunkPages } from '@edukriti/rag';
import { sourceIngestionResponseSchema } from '@edukriti/contracts';
import { env } from 'cloudflare:workers';

import { apiError } from '@/lib/api-error';
import { extractPdfPages } from '@/lib/pdf';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'text/plain']);

function safeFilename(value: string) {
  return value.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'material';
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const learnerIdValue = form.get('learnerId');
    const learnerId = typeof learnerIdValue === 'string' && learnerIdValue.trim() ? learnerIdValue.trim() : 'demo-learner';

    if (!(file instanceof File)) return apiError(400, 'FILE_REQUIRED', 'Choose a PDF or text file to continue.');
    if (!ALLOWED_TYPES.has(file.type)) return apiError(415, 'UNSUPPORTED_FILE', 'The Phase 3 MVP accepts PDF and plain-text files.');
    if (file.size === 0) return apiError(400, 'EMPTY_FILE', 'The uploaded file is empty.');
    if (file.size > MAX_FILE_BYTES) return apiError(413, 'FILE_TOO_LARGE', 'The file must be 8 MB or smaller.');
    if (!env.DB || !env.FILES) return apiError(503, 'STORAGE_UNAVAILABLE', 'Document storage is not available in this environment.');

    const bytes = await file.arrayBuffer();
    const pages = file.type === 'application/pdf'
      ? await extractPdfPages(bytes)
      : [{ page: 1, text: new TextDecoder().decode(bytes) }];
    const chunks = chunkPages(pages);
    if (chunks.length === 0) return apiError(422, 'NO_EXTRACTABLE_TEXT', 'No readable text was found. Scanned PDFs require OCR, which is planned after the MVP.');

    const sourceId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const filename = safeFilename(file.name);
    const storageKey = `sources/${learnerId}/${sourceId}/${filename}`;

    await env.FILES.put(storageKey, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { sourceId, learnerId, originalFilename: file.name.slice(0, 255) },
    });

    const statements = [
      env.DB.prepare(
        'INSERT OR IGNORE INTO learners (id, display_name, level, preferred_language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(learnerId, 'Demo Learner', 'beginner', 'hinglish', createdAt, createdAt),
      env.DB.prepare(
        'INSERT INTO learning_sources (id, learner_id, filename, content_type, byte_size, storage_key, status, page_count, chunk_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(sourceId, learnerId, file.name.slice(0, 255), file.type, file.size, storageKey, 'ready', pages.length, chunks.length, createdAt),
      ...chunks.map((chunk) =>
        env.DB.prepare(
          'INSERT INTO source_chunks (id, source_id, chunk_index, page_start, page_end, token_count, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ).bind(crypto.randomUUID(), sourceId, chunk.index, chunk.pageStart, chunk.pageEnd, chunk.tokenCount, chunk.text, createdAt),
      ),
    ];

    try {
      await env.DB.batch(statements);
    } catch (error) {
      await env.FILES.delete(storageKey);
      throw error;
    }

    return Response.json(
      sourceIngestionResponseSchema.parse({
        source: {
          id: sourceId,
          learnerId,
          kind: file.type === 'application/pdf' ? 'pdf' : 'text',
          filename: file.name.slice(0, 255),
          contentType: file.type,
          byteSize: file.size,
          storageKey,
          status: 'ready',
          pageCount: pages.length,
          chunkCount: chunks.length,
          createdAt,
        },
        message: 'Material processed and ready for grounded teaching.',
      }),
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document processing failed.';
    return apiError(500, 'PROCESSING_FAILED', message);
  }
}

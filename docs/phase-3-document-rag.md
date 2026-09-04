# Phase 3 — Document Processing and RAG

## Implemented pipeline

1. Validate PDF or text uploads by MIME type, byte size, and content.
2. Treat all uploaded content as untrusted data.
3. Extract page-aware text from PDFs with the serverless `unpdf` build.
4. Reject PDFs above 80 pages and race extraction against a 15-second timeout.
5. Normalize text and split it into bounded, overlapping chunks.
6. Store original file bytes in R2 and searchable metadata/chunks in D1.
7. Rank chunks using deterministic multilingual lexical relevance.
8. Return page-linked citations and an explicit `grounded` result.
9. Return an empty grounded result rather than inventing evidence.

## API surface

- `POST /api/sources`: multipart upload with `file` and `learnerId`
- `POST /api/retrieval`: `{ sourceId, query, limit }`

Both endpoints return structured errors. Public payloads are parsed with shared Zod contracts.

## Prototype constraints

- PDF and TXT are enabled now; DOCX and PPTX follow later.
- Maximum upload size is 8 MB.
- Maximum PDF length is 80 pages.
- Scanned PDFs without a text layer need an OCR phase and return a clear error today.
- Retrieval is lexical so the free deployment works without a paid embedding API. An embedding reranker can be added behind the same contracts later.

## Phase 4 handoff

The lesson-planning engine should receive a validated lesson request and retrieved citations, generate a structured plan, reject unsupported source claims, and persist the parsed `lessonPlanSchema` result.

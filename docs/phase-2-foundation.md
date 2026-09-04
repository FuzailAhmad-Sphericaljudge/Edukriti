# Phase 2 — Application Foundation

## Architecture

- `apps/web`: Vinext/React user interface and Cloudflare-compatible API routes
- `packages/contracts`: shared Zod schemas for every public AI-teaching boundary
- D1: learner profiles, lessons, checkpoint attempts, and learning reports
- R2: uploaded source documents and generated media

## Implemented foundation

- Responsive learner dashboard and recognizable Edukriti visual system
- npm workspace structure on Node.js 24
- Strict TypeScript application scaffold
- Shared contracts for learners, sources, lesson requests, lesson plans, checkpoints, evaluations, and reports
- Durable relational schema with indexes matching learner-history queries
- R2 file binding for the future upload pipeline
- API health endpoint at `/api/health`
- Contract tests covering valid requests, invalid sources, duration limits, and timestamps

## Boundary rule

AI responses must be parsed through the shared contracts before being persisted or rendered. Uploaded files remain in R2; D1 stores their metadata and processing state.

## Phase 3 handoff

The document-processing pipeline should accept a validated learning source, extract text, chunk it with page metadata, create embeddings, and expose retrieval results as citations compatible with `citationSchema`.

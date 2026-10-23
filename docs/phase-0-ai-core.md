# Phase 0: AI Core Stabilization & Dual-Tier Adapter Architecture

## Overview
Phase 0 stabilizes the Edukriti codebase, introduces the `@edukriti/ai` provider adapter with native Google Gemini support, replaces hardcoded teaching/assessment pathways with AI-driven pipelines, wires comprehensive health checks, and adds an internal `/admin/status` diagnostic console.

## Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │              Edukriti App                    │
                      │  (Web, Classroom, Tutor, Checkpoint, Quiz)   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │        @edukriti/teaching-engine             │
                      │   - generateLessonPlanWithAi                 │
                      │   - evaluateCheckpointWithAi                 │
                      │   - buildAdaptationWithAi                    │
                      │   - buildAssessmentWithAi                    │
                      │   - evaluateAssessmentAnswerWithAi           │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │                 @edukriti/ai                 │
                      │              ResilientAiAdapter              │
                      │  (Timeout, Token Budget, Secret-Safe Logger) │
                      └──────────────┬────────────────┬──────────────┘
                                     │                │
                    Primary Provider │                │ Automatic Fallback
                                     ▼                ▼
                     ┌──────────────────────┐  ┌──────────────────────┐
                     │   GeminiProvider     │  │   FallbackProvider   │
                     │  (gemini-2.5-flash)  │  │(Deterministic Cached)│
                     └──────────────────────┘  └──────────────────────┘
                                     │
                     ┌───────────────┴──────┐
                     │   OpenAIProvider     │
                     │    (gpt-4o-mini)     │
                     └──────────────────────┘
```

## Key Deliverables
1. **Repository Health & CI**:
   - Fixed `ProgressValue` JSX children type error in `apps/web/components/adaptive-practice.tsx`.
   - Added GitHub Actions workflow (`.github/workflows/ci.yml`) enforcing tests, linting, typechecking, and build.
   - Added `npm run typecheck` script to root `package.json`.

2. **Packages/AI Package (`@edukriti/ai`)**:
   - Core interfaces: `generateStructured<T>(schema, prompt, options)`, `generateText`, `stream`, `embed`.
   - `GeminiProvider`: Full integration with Google Gemini 2.5 Flash via `responseSchema` / `application/json` mode and `text-embedding-004`.
   - `OpenAIProvider`: Full integration with OpenAI Responses / Chat Completions with strict JSON schema.
   - `FallbackProvider`: Deterministic, in-memory cached offline generator for zero-cost operation and offline judging.
   - `ResilientAiAdapter`: Automatically retries once on schema/network failure, then seamlessly delegates to deterministic fallback.
   - Safe request logger (`aiLogger`) redacting all keys, bearer tokens, and secrets.
   - Token budget tracker (`TokenBudgetTracker`) and deterministic response cache (`AiCache`).

3. **Teaching Engine Upgrade (`@edukriti/teaching-engine`)**:
   - Upgraded from 4 hardcoded topics to universal AI lesson generation across any domain.
   - Replaced hardcoded electricity checkpoints and assessments with dynamic, conceptual question generation and semantic response evaluation.
   - Preserved all previous deterministic code as verified offline fallbacks.

4. **Environment & Runtime Bindings**:
   - Wired `GEMINI_API_KEY`, `GEMINI_MODEL`, `LLM_PROVIDER`, `LLM_MODEL` in `apps/web/db/env.d.ts`.
   - Created `.env.example` and `apps/web/.env.example`.
   - Created `/api/health/ai` diagnostic endpoint.
   - Created `/admin/status` diagnostic dashboard.

## Manual Steps Required
To activate live Google Gemini generation:
1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Add it to your local environment file or Cloudflare secrets:
   ```bash
   # In apps/web/.env.local (for local development)
   GEMINI_API_KEY="your-gemini-api-key-here"
   LLM_PROVIDER="gemini"
   LLM_MODEL="gemini-2.5-flash"
   ```
3. For Cloudflare Workers deployment:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

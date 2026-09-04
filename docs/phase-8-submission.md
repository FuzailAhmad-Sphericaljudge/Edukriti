# Phase 8: submission and evaluator guide

## Problem

Most learning platforms offer either fixed videos or chat responses. Edukriti demonstrates a teacher-like loop that plans, explains, demonstrates, questions, evaluates, adapts, assesses, and remembers.

## What evaluators should test

1. Create a 20-minute beginner electricity lesson in Hinglish.
2. Review the generated concepts, timings, checkpoints, visuals, and source status.
3. Select **Enter AI classroom**. The visual class opens immediately; select **Start teacher voice** to authorize browser speech.
4. At a checkpoint answer: `Current gets used up by the bulb.`
5. Observe the diagnosed current-consumption misconception, constructive feedback, new water-pipe analogy, and alternate voice explanation.
6. Complete the remaining checkpoint and final assessment.
7. Review the calculated score, strengths, weak concepts, revision plan, and recommended next topic.
8. Return to the dashboard and reopen the stored lesson or report.

## Evaluation alignment

| Criterion | Evidence in the prototype |
| --- | --- |
| Human-like teaching and adaptation | Segmented narration, checkpoints, semantic feedback, diagnosed misconceptions, alternate teaching strategy |
| AI/ML and LLM implementation | Optional strict structured-output provider plus validated deterministic fallback |
| RAG and grounding | Page extraction, chunking, retrieval scores, citations, and no-evidence fallback |
| Teaching video | Teacher-led classroom with voice, captions, progress, and synchronized visual surface |
| Multilingual capability | English, Hindi, and Hinglish lesson generation and voice locale selection |
| Voice and avatar | Project-specific human teacher portrait and browser-native speech |
| Innovation | One continuous teaching loop where responses control progression and re-teaching |
| UX | Six connected product screens with loading, error, locked, feedback, and completion states |
| Documentation | README, eight phase documents, architecture, API list, limitations, setup, and demo script |

## Reliability and safety

- Public inputs and stored outputs are validated with shared Zod contracts.
- Uploaded content is normalized as untrusted evidence.
- Source retrieval is read-only and returns no result for meaningless queries.
- Attempt IDs make checkpoint, assessment, and report retries idempotent.
- Reports are computed only after all final questions have recorded answers.
- Optional external AI failure falls back to the deterministic teaching engine.
- No secret is shipped to the browser.

## Verification command

```bash
npm run verify
git diff --check
```

The verification suite covers contracts, timestamps, empty input, retrieval no-op behavior, duration changes, citations, voice locales, captions, semantic answers, misconceptions, alternative explanations, assessment construction, and report scoring.

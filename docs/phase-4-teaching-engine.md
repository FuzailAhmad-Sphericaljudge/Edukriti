# Phase 4 — AI Teaching Engine

## Implemented teaching flow

- Validates learner, topic/source, level, language, duration, style, and goal.
- Retrieves the strongest source passages before planning material-based lessons.
- Generates two segments for 5 minutes, four for 20 minutes, and six for 60 minutes.
- Produces objectives, narration, visual briefs, checkpoints, and page citations.
- Routes visuals by subject: equations, diagrams, graphs, timelines, maps, code, or key points.
- Supports English, Hindi, and Hinglish teaching copy.
- Persists the complete validated lesson plan in D1.
- Displays a lesson-plan preview before the video classroom begins.

## Provider architecture

The default deterministic provider keeps the free demo reliable. An optional OpenAI Responses provider is ready behind `OPENAI_API_KEY` and `OPENAI_MODEL`. It requests strict Structured Outputs and then parses the result through `lessonPlanSchema` before persistence.

If the optional provider is unavailable or returns an invalid response, Edukriti falls back to the deterministic provider so the learner journey continues.

## Trust boundary

Retrieved document passages are explicitly treated as untrusted educational evidence. Instructions found inside uploaded material cannot override the teacher prompt. Unsupported claims are omitted, and material-based planning fails clearly when retrieval produces no evidence.

## Phase 5 handoff

Phase 5 should turn each validated lesson segment into synchronized narration, subtitles, avatar delivery, and the requested subject-aware visual surface.

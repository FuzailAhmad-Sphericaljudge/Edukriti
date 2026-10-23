# Phase 2: Ask Aarohi — Omnipresent AI Study Companion

Ask Aarohi transforms Edukriti from a fixed lesson player into an omnipresent, intelligent, multimodal study companion capable of answering any educational query across STEM, Humanities, and Computer Science.

---

## 1. Core Architecture & Pipeline

```
Student Query (Text / Voice / Photo)
  │
  ▼
[1. Safety & Injection Defense] ──► Flags harmful / injection prompts; returns gentle educational redirect
  │
  ▼
[2. Intent & Style Classifier]  ──► Intent: concept | numerical_problem | doubt | exam_tip | experiment_help
  │                               Style: default | eli10 | exam_style | deep_dive (with follow-up handling)
  ▼
[3. Multimodal OCR Vision]     ──► Extracts diagrams and problem text from uploaded image attachments
  │
  ▼
[4. Curated KB Retrieval]      ──► Scans 25+ curated textbook chunks across 6 subjects; extracts [1][2] citations
  │
  ▼
[5. Pedagogical Synthesis]     ──► Gemini 2.5 Flash (default) / OpenAI GPT-4o-mini / Offline deterministic engine
  │                               Formats KaTeX math ($...$, $$...$$), code blocks, and comparison tables
  ▼
[6. Numerical Recomputation]   ──► Deterministic symbolic solver recomputes canonical formulas with SI units
  │
  ▼
[7. Claim & Math Validator]    ──► Flags unsupported claims; annotates recomputation verification badge
  │
  ▼
Streaming Delivery (SSE)       ──► Yields progressive status, OCR, delta chunks, and final verified payload
```

---

## 2. Key Capabilities Implemented

### A. Global Tutor Drawer & Dedicated `/tutor` Study Station
- **Global Drawer**: Accessible on every route via a persistent floating pill button and the universal `Ctrl+/` (or `Cmd+/`) shortcut. Features backdrop dismissal, auto-focus, and smooth slide-in transitions.
- **Dedicated `/tutor` Page**: Features quick doubt trigger chips by subject (Physics, Chemistry, Mathematics, Computer Science, History & Polity), bookmark notes management, JSON export, and single-click "Copy All Notes".

### B. Step-by-Step Numerical Solver & SI Verification Engine
- **Safe Arithmetic Evaluator (`evaluateSafeMath`)**: Evaluates expressions deterministically with zero executable code or `eval()`.
- **SI Unit Auto-Normalization (`normalizeToSiUnits`)**: Automatically converts `km/h` to `m/s`, `mA` to `A`, `kΩ` to `Ω`, `g` to `kg`, and `min` to `s`. Generates an explicit "Standardize to SI Base Units" step when non-SI units are detected.
- **Canonical Formula Recomputation (`recomputeCanonicalProblem`)**: Recomputes Ohm's law ($V=IR$), Newton's second law ($F=ma$), kinematics ($v=u+at$, $s=ut+\frac{1}{2}at^2$), kinetic energy ($KE=\frac{1}{2}mv^2$), work done ($W=Fd$), electrical power ($P=VI$), and quadratic roots.
- **Verification Badge**: Validates model answers against deterministic recomputation within a 5% tolerance window, providing transparent feedback to students.

### C. Multimodal Photo Doubts
- Ingests textbook photos, diagrams, and numerical problems (PNG, JPEG, WebP up to 5MB).
- Features drag-and-drop target highlighting, file size display, and base64 structuring for Gemini Vision multimodal analysis.

### D. Voice & Hands-Free Auto-Study
- **Voice Recognition**: Integrates browser `SpeechRecognition` with regional Indian English (`en-IN`) and Hindi (`hi-IN`) locales.
- **Hands-Free Mode**: When active, Aarohi reads answers aloud using neural speech synthesis and automatically opens the microphone to listen for the student's next question upon completion.
- **Live Visualizer Waveforms**: Animated pulse waveforms for both listening and speaking states provide tactile visual cues.

### E. Curated Grounding & Missing Evidence Fallback
- Anchors explanations in open-access textbook sources (OpenStax, Wikipedia) with clickable `[1][2]` citation pills.
- **Missing Evidence Labeling**: When questions fall outside syllabus material, Aarohi synthesizes answers from general academic knowledge and explicitly displays the label `not from course material`.

### F. Pedagogical Styles & Follow-Up Handling
- **Explain Like I'm 10 (`eli10`)**: Playful, vivid analogies (water pipes, bicycles, kitchens) with zero unnecessary jargon.
- **Exam-Style (`exam_style`)**: Concise bullet points, official definitions, high-scoring keywords, and common student mistakes.
- **Deep Dive (`deep_dive`)**: First-principles derivation, mathematical nuances, and edge-case behavior.
- **Follow-up Handling**: Automatically detects conversational triggers such as *"simpler"*, *"another example"*, *"why?"*, *"exam tip"*.

---

## 3. Golden Evaluation Benchmark

Edukriti includes an automated evaluation harness (`scripts/evaluate-tutor.ts` / `npm run eval`) testing **105 golden questions** spanning all 6 subjects and 5 pedagogical intents:

| Metric | Measured Value | Target | Status |
| :--- | :--- | :--- | :--- |
| **Total Questions Evaluated** | **105** | $\ge 100$ | Passed |
| **Overall Benchmark Pass Rate** | **100% (105 / 105)** | $\ge 85\%$ | Passed |
| **Numerical Recomputation Accuracy** | **100% (9 / 9)** | $\ge 90\%$ | Passed |
| **Curriculum Grounding Rate** | **100%** | $\ge 80\%$ | Passed |
| **Mean Pipeline Latency** | **5 ms (deterministic)** | $< 250\text{ ms}$ | Passed |

Complete benchmark details with question-by-question metrics are recorded in `docs/EVAL.md`.

# Edukriti — Hackathon Submission Notes

## One-line pitch

Edukriti is a multilingual adaptive AI teacher that converts any topic or uploaded learning material into an interactive, avatar-led lesson that explains, questions, evaluates, adapts, and tracks real learning progress.

## About the project

Edukriti is designed to recreate the most valuable behavior of a good teacher: understanding the learner, planning a lesson, explaining concepts progressively, checking understanding, identifying misconceptions, changing the teaching approach, and recommending what to learn next.

Instead of giving every student the same recorded lecture or acting as a basic question-answer chatbot, Edukriti creates a personalized learning journey based on the student's level, language, preferred teaching style, learning goal, source material, and available time.

## Problem statement

Most digital learning platforms are either static video libraries or text-based chatbots. Recorded videos cannot recognize when a learner is confused, and basic chatbots usually answer isolated questions without creating or managing a complete lesson. Learners need an accessible system that can teach at their pace, in their language, and adapt when they struggle.

## Our solution

Edukriti accepts a topic or uploaded PDF/TXT material and creates a validated lesson plan. The AI teacher then presents the lesson through a human-like avatar, natural browser voice, captions, and subject-aware visuals. During teaching, it asks checkpoint questions and accepts typed or spoken answers. It evaluates meaning rather than only exact wording, detects misconceptions, and re-explains the concept using a different analogy or strategy.

After the lesson, Edukriti conducts an assessment and generates a persistent learning report containing the score, strengths, weak concepts, misconceptions, revision advice, and recommended next topic. It also provides automatic notes, flashcards, a seven-day revision plan, adaptive practice, and a progress dashboard.

## Why it is innovative

The central innovation is the complete adaptive teaching loop:

> Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue

The system does not merely generate a script or place an avatar in front of text. Student responses directly change the subsequent experience. Incorrect answers activate support mode, alternative explanations, and easier cues; correct streaks increase practice difficulty. Learning reports influence which concepts are practiced first.

## Key features

- Topic-based teaching and uploaded-material learning
- PDF/TXT extraction with page-aware chunking and citations
- Personalized 5-, 20-, and 60-minute lessons
- Beginner, intermediate, and advanced teaching depth
- English, Hindi, and Hinglish instruction
- Human-like teacher avatar, voice, captions, and voice-speed controls
- Subject-aware equations, diagrams, graphs, timelines, maps, code, and key-point visuals
- Typed and spoken questions with lesson context
- Checkpoint evaluation and misconception detection
- Adaptive re-teaching with a different analogy and visual strategy
- Final assessment with immediate feedback
- Persistent learning reports and learner analytics
- Automatic notes, flashcards, and seven-day revision plan
- Adaptive practice with support, core, and challenge modes
- Public cross-device deployment

## AI/ML and RAG implementation

Uploaded documents are normalized and split into bounded overlapping chunks while preserving page references. A retrieval layer ranks the chunks relevant to the learner's topic and goal. Retrieved evidence is passed into the teaching planner, and citations are retained in the lesson segments.

The optional OpenAI provider uses structured generation validated against strict schemas. A deterministic teaching provider keeps the complete demonstration reliable without requiring a paid API key. Student responses are evaluated semantically using concept signals, expected relationships, answer development, and misconception patterns rather than exact string matching.

## System architecture

1. Input layer — topic, learner preferences, or uploaded learning material.
2. Knowledge layer — extraction, normalization, chunking, retrieval, and citations.
3. Teaching engine — lesson structure, narration, examples, checkpoints, visual selection, and adaptation.
4. Classroom layer — avatar, speech, captions, visual explanation, questions, and follow-up tutoring.
5. Evaluation layer — checkpoints, final assessment, misconception detection, and feedback.
6. Learning memory — D1-backed reports, strengths, weak concepts, revision advice, practice, and progress analytics.

## Personalization approach

Edukriti personalizes lessons using the learner's educational level, language, teaching style, learning goal, available time, uploaded evidence, checkpoint responses, assessment results, strengths, and weak concepts. Five-minute lessons prioritize essentials, twenty-minute lessons create a structured explanation sequence, and sixty-minute lessons increase depth and assessment coverage.

## Multilingual implementation

The lesson planner generates English, Hindi, or Hinglish narration and checkpoint prompts. Speech synthesis and recognition use language-specific browser locales. The source material and teaching language can differ because retrieved evidence is used as knowledge while the teaching layer controls the output language.

## Voice and avatar approach

The classroom combines an AI teacher portrait, speaking-state motion, synchronized captions, browser speech synthesis, adjustable speed, selectable voices, and speech recognition. This creates a video-led teaching experience without exposing voice credentials in the browser or requiring a paid voice service for the core demo.

## Assessment methodology

Edukriti uses conceptual, multiple-choice, short-answer, application, and explain-in-your-own-words questions. It records whether concepts were understood, identifies weak areas and misconceptions, selects a next teaching action, and generates a learning report from the student's actual saved assessment responses.

## Responsible AI and safety

- Uploaded content is treated as untrusted evidence, not executable instruction.
- Source-based lessons retain citations for traceability.
- Public inputs and generated structures are schema validated.
- Model and storage credentials remain server-side.
- The system communicates prototype limitations honestly.
- Edukriti is intended to augment educators, not replace qualified teachers or expert judgment.

## Technology and third-party disclosure

- React, TypeScript, Vinext, Tailwind CSS, Base UI, and Lucide for the application experience
- Cloudflare Workers for the server runtime
- Cloudflare D1 for structured learning history
- Cloudflare R2 for uploaded learning materials
- Zod for validation at API and AI-output boundaries
- Browser Web Speech API for speech synthesis and recognition
- `unpdf` for local PDF text extraction
- Optional OpenAI structured generation; deterministic provider for the no-key demo
- GitHub for source code and Vercel as the public proxy URL

## Current limitations

- The current upload flow supports PDF and TXT; DOCX and PPTX are planned.
- The avatar is an animated high-quality portrait rather than a photorealistic real-time lip-synced character.
- Voice quality and speech recognition depend on browser and operating-system support.
- Semantic evaluation needs broader expert-built evaluation sets before high-stakes educational use.
- The public hackathon prototype does not yet provide institutional authentication or role management.

## Future vision

Our vision is to make a high-quality personal teacher accessible to every learner across languages, abilities, devices, and bandwidth conditions.

The near-term roadmap includes DOCX/PPTX ingestion, more Indian languages, interactive simulations, concept maps, better neural voice, and stronger avatar lip synchronization. The next stage adds long-term learner memory, exam preparation, personalized homework, multiple teacher personalities, and consent-based emotion-aware pacing. At scale, Edukriti can support teacher and parent dashboards, LMS integrations, collaborative classrooms, low-bandwidth delivery, offline/local models, and institutional safety and governance controls.

## Expected impact

Edukriti can give learners personalized explanation and practice even when one-to-one tutoring is unavailable. It can help educators extend their reach, provide additional support in a student's preferred language, reveal misconceptions earlier, and create a continuous path from lesson content to measurable mastery.

## Suggested 3–7 minute demo flow

1. Enter a topic or upload study material.
2. Select level, language, teaching style, and available time.
3. Show the generated structured lesson plan and evidence citations.
4. Enter the AI classroom and play avatar narration with captions and visuals.
5. Ask Aarohi a typed or spoken follow-up question.
6. Give an incorrect checkpoint answer to demonstrate misconception detection and adaptive re-teaching.
7. Complete the final assessment.
8. Show the learning report, weak-concept adaptive practice, revision studio, and progress dashboard.

## Closing statement

Edukriti is not just an AI that knows the answer. It is an AI teacher that plans how to teach, observes whether learning happened, changes its method when needed, and guides the student toward mastery.

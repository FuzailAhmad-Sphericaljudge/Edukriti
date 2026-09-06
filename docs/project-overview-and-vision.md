# Edukriti: Project overview and future vision

## About the project

Edukriti is a multilingual adaptive AI teacher that turns a topic or uploaded learning material into a structured, avatar-led lesson. It plans what to teach, explains concepts using voice and subject-aware visuals, checks understanding, identifies misconceptions, changes its approach, evaluates learning, and recommends what the student should do next.

The project addresses a central weakness of conventional e-learning: videos cannot react to the learner, while basic chatbots usually answer isolated questions without managing a complete teaching process. Edukriti combines grounded knowledge retrieval, lesson planning, interactive teaching, adaptation, assessment, revision, and progress tracking in one journey.

## What makes it different

Edukriti follows a teacher-like loop:

> Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue

The learner's level, preferred language, teaching style, objective, available time, uploaded evidence, answers, misconceptions, and assessment performance influence the experience. The result is not a fixed lecture or a generic chatbot response.

## Current prototype

- Topic-based and uploaded-material learning
- PDF/TXT extraction, chunking, retrieval, and page citations
- Personalized 5-, 20-, and 60-minute lesson plans
- English, Hindi, and Hinglish teaching
- Avatar-led classroom with voice, captions, and subject-aware visuals
- Typed and spoken learner questions
- Semantic checkpoint evaluation and adaptive re-teaching
- Final assessment and durable learning reports
- Automatic notes, flashcards, seven-day revision plan, and adaptive practice
- Learner progress dashboard and mastery analytics

## Responsible AI approach

Uploaded text is treated as untrusted evidence rather than executable instruction. Source-based lessons retain citations so learners can trace explanations. Structured schemas validate AI outputs and API inputs. Credentials stay server-side. The prototype communicates its limits and does not position itself as a replacement for qualified teachers or expert judgment.

## Future vision

The long-term vision is to make high-quality personalized teaching accessible across languages, abilities, devices, and bandwidth conditions.

Near-term priorities include DOCX/PPTX support, more Indian languages, richer interactive simulations, concept maps, higher-quality speech, and closer avatar lip synchronization. The next growth stage adds long-term learner memory, exam preparation, personalized homework, multiple teacher personalities, and consent-based emotion-aware pacing. At scale, Edukriti can support educator/parent dashboards, classroom and LMS integrations, low-bandwidth delivery, offline models, and institutional safety controls.

## Additional notes

- OpenAI structured generation is optional; a deterministic teaching provider keeps the full demonstration functional without a paid key.
- Browser speech APIs keep the core voice experience free, but available voices and recognition quality vary by device.
- The current avatar is a high-quality animated portrait rather than a real-time photorealistic video avatar.
- Semantic evaluation is suitable for a prototype and should be expanded with broader subjects, expert-created evaluation sets, and safety testing before high-stakes deployment.
- Edukriti is designed to augment educators by providing personalized explanations and practice at scale—not to remove teachers from the learning process.

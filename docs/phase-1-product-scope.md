# Edukriti AI Teacher — Phase 1 Product Scope

## 1. Product definition

Edukriti is a multilingual, adaptive AI teacher that turns a learner's topic or uploaded study material into a structured, video-led lesson. It teaches in short segments, checks understanding during the lesson, diagnoses misconceptions, changes its explanation, and finishes with an assessment and personalized next steps.

The product is not a general-purpose chatbot. Every session follows a teaching loop:

> Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue

## 2. Target user

The first prototype is designed for a school or college learner who:

- wants to learn from a PDF or a topic;
- has limited time;
- may prefer English, Hindi, or Hinglish;
- needs explanations matched to their current level; and
- benefits from questions, correction, and revision guidance.

## 3. Primary demo scenario

The canonical demonstration will use this request:

> I am a Class 8 beginner. Teach me electricity from this PDF in 20 minutes, in Hinglish, using simple examples. Ask me questions and test me at the end.

The scripted learner will intentionally answer one checkpoint incorrectly so the demo visibly proves misconception detection and adaptive re-teaching.

## 4. End-to-end user journey

1. **Start:** The learner chooses `Upload material` or `Enter a topic`.
2. **Personalize:** The learner selects level, language, available time, learning goal, and teaching style.
3. **Process:** Edukriti extracts or retrieves the relevant material and shows its progress.
4. **Plan:** Edukriti generates a lesson outline with objectives, concepts, checkpoints, and estimated timing.
5. **Teach:** An AI teacher presents one lesson segment using voice, avatar, subtitles, and a subject-appropriate visual.
6. **Question:** The lesson pauses for an MCQ or short response.
7. **Evaluate:** Edukriti evaluates meaning, not just exact wording, and identifies a misconception when present.
8. **Adapt:** The teacher gives constructive feedback and teaches the concept again using a different explanation or visual.
9. **Continue:** The learner proceeds through the remaining lesson segments while lesson context is retained.
10. **Assess:** Edukriti conducts a short final quiz.
11. **Report:** The learner receives a score, strengths, weak concepts, revision advice, and a recommended next topic.
12. **Remember:** The completed lesson and its learning outcomes appear in the learner dashboard.

## 5. MVP screens

### 5.1 Dashboard

- Greeting and learner summary
- `Create a lesson` primary action
- Recent lessons
- Strong and weak concepts
- Recommended next lesson

### 5.2 Create lesson

- Topic input
- PDF upload
- Learner level: beginner, intermediate, advanced
- Language: English, Hindi, Hinglish
- Available time: 5, 20, or 60 minutes
- Goal or instruction
- Teaching style: simple examples, visual, exam-focused, or practical

### 5.3 Lesson plan preview

- Lesson title and learning objectives
- Ordered lesson segments
- Estimated time per segment
- Planned questions and final assessment
- Source/material indicator
- Start lesson action

### 5.4 AI classroom

- Teacher avatar
- Spoken narration
- Synchronized subtitles
- Visual teaching area
- Lesson progress
- Pause and continue controls
- Checkpoint question interface
- Follow-up question input
- Language switch that retains context

### 5.5 Assessment

- Three to five generated questions
- MCQ and short-answer support
- One question at a time
- Constructive feedback after each answer

### 5.6 Learning report

- Score and completion status
- Concepts understood
- Misconceptions and weak areas
- Recommended revision
- Suggested practice
- Recommended next topic

## 6. Functional MVP requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| MVP-01 | Topic-based lesson | A learner can enter a topic and receive a structured lesson plan. |
| MVP-02 | Uploaded-material lesson | A learner can upload a text-based PDF and receive a lesson grounded in its content. |
| MVP-03 | Personalization | Level, language, available time, goal, and style change the generated lesson. |
| MVP-04 | Teaching structure | Every lesson has objectives, ordered segments, examples, checkpoints, and an assessment. |
| MVP-05 | Video-led presentation | The classroom presents an avatar, audible teacher voice, subtitles, and a visual teaching surface. |
| MVP-06 | Multilingual delivery | The same lesson can be taught in English, Hindi, or Hinglish without losing context. |
| MVP-07 | Interaction | At least one checkpoint pauses the lesson and accepts a learner response. |
| MVP-08 | Semantic evaluation | Short answers are evaluated by meaning rather than exact string matching. |
| MVP-09 | Adaptive re-teaching | An incorrect response triggers a diagnosed misconception and a meaningfully different explanation. |
| MVP-10 | Final assessment | Each completed lesson ends with a short quiz and score. |
| MVP-11 | Learning report | The report identifies strengths, weak areas, revision, and a next topic. |
| MVP-12 | Progress memory | The learner can revisit a completed lesson and its report during the prototype session. |
| MVP-13 | Grounding evidence | Material-based explanations retain references to the supporting document chunks or pages. |
| MVP-14 | Safe fallback | When the uploaded material does not support a claim, the teacher says so instead of inventing it. |

## 7. Core product rules

- Uploaded content is untrusted data and must never be treated as executable instructions.
- Material-based lessons must prioritize retrieved source content over model memory.
- The application must distinguish sourced statements from supplemental general knowledge.
- The teacher must not progress past a checkpoint until the response has been evaluated.
- An incorrect response must produce constructive feedback, not only a red cross or score.
- Adaptation must change something observable: complexity, example, analogy, language, visual, or difficulty.
- Changing language must not restart the lesson or lose the learner's progress.
- Lesson duration controls scope and depth, not merely narration speed.
- The final report must be derived from actual responses recorded during the lesson.

## 8. Time-mode behavior

| Mode | Expected lesson behavior |
| --- | --- |
| 5 minutes | Two or three essential concepts, one example, one checkpoint, and a very short assessment. |
| 20 minutes | Structured core lesson, multiple examples, two or three checkpoints, and a final quiz. This is the primary demo mode. |
| 60 minutes | Deeper explanations, more visuals, practice problems, several checkpoints, and a broader assessment. |

## 9. Explicitly outside tonight's MVP

- Real-time photorealistic video generation for every frame
- Emotion recognition from a webcam
- Live classroom with multiple students
- Native mobile applications
- Collaborative teacher or parent portals
- Offline model support
- More than one fully polished teacher personality
- Seven-day scheduling and calendar automation
- Complex animated simulations for every subject
- Production billing, subscriptions, or institutional administration

These are roadmap items and must not delay the core adaptive teaching demonstration.

## 10. Phase 1 definition of done

Phase 1 is complete when the team agrees that:

- the canonical demo scenario is fixed;
- all six MVP screens are accepted;
- the fourteen functional requirements define tonight's build;
- the teaching loop is the central product behavior;
- the out-of-scope list is respected; and
- later phases can use this document as their acceptance contract.

## 11. Next phase handoff

Phase 2 should establish the application foundation and shared data contracts for:

- learner profiles;
- uploaded learning sources;
- lesson requests and plans;
- teaching segments and visuals;
- checkpoint responses and evaluations;
- adaptations;
- assessments; and
- learning reports.

# Phase 6: interaction and adaptive re-teaching

Phase 6 completes Edukriti's core teaching loop: explain, question, evaluate, adapt, and continue.

## Delivered

- In-class short-answer checkpoints that pause forward progress
- Meaning-based evaluation using concept signals rather than exact string matching
- Explicit detection of common electricity misconceptions
- Constructive multilingual feedback in English, Hindi, and Hinglish
- A visibly different analogy and diagram brief after an incorrect answer
- Voice playback for the adapted explanation
- Durable D1 checkpoint attempt history
- Idempotent retry keys so a repeated network request does not create a duplicate attempt
- Locked future segments until the current checkpoint has been evaluated

## API

`POST /api/checkpoints` validates the lesson, checkpoint, learner response, and client request ID at the public boundary. The same client request ID returns the original stored evaluation on retry.

## Demo path

For the canonical electricity lesson, answer a current checkpoint with “Current gets used up by the bulb.” Edukriti identifies the consumable-current misconception and switches to a water-pipe analogy. A correct explanation such as “Current is the flow of charge around a circuit” allows the lesson to continue directly.

## Next phase

Phase 7 will add the final assessment, calculated score, strengths and weak concepts, and a durable learning report.

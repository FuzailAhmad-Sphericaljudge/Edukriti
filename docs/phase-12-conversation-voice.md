# Phase 12: Conversation and voice memory

Phase 12 turns Ask Aarohi from a single-response panel into a short contextual tutoring conversation and makes voice preferences persistent.

## Delivered

- Aarohi receives up to six recent user/assistant turns, allowing natural follow-ups such as “why?”, “make it simpler”, and “give another example”.
- The classroom displays the latest three question-and-answer exchanges as a compact chat thread.
- Aarohi’s understanding-check question can be selected to continue the conversation.
- Tutor context remains bounded and resets when the learner changes lesson segments.
- Learners can select an installed browser voice or keep automatic neural/regional voice selection.
- Voice selection and speed persist locally across visits while preserving a privacy-safe fallback when browser storage is unavailable.

## Acceptance checks

- Tutor requests validate role, content length, and a maximum of six context turns.
- A follow-up request includes earlier exchanges and returns a validated answer.
- Each answer can be spoken independently.
- Saved voice and speed preferences reload on the same device.

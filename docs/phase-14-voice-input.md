# Phase 14: Two-way voice input

Phase 14 lets a learner speak to Aarohi instead of relying only on the keyboard.

## Delivered

- Microphone input in the Ask Aarohi panel.
- Spoken checkpoint answers, with the transcript remaining editable before submission.
- English, Hindi, and Hinglish recognition locales matched to the lesson language.
- Live listening state, microphone-permission feedback, and retry messaging.
- Safe typed-answer fallback when browser speech recognition is unavailable.

## Acceptance checks

- Voice controls never block typing or lesson navigation.
- A spoken transcript is appended to existing text instead of overwriting it.
- Starting and stopping recognition updates the button state.
- Production lint, tests, and build pass.

Voice recognition requires HTTPS, microphone permission, and a compatible browser such as a current Chrome or Edge release.

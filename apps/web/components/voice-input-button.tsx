'use client';

import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type RecognitionEvent = Event & {
  results: ArrayLike<{ 0: { transcript: string } }>;
};
type RecognitionErrorEvent = Event & { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

const locales = {
  english: 'en-IN',
  hindi: 'hi-IN',
  hinglish: 'en-IN',
} as const;

export function VoiceInputButton({
  language,
  onTranscript,
  disabled = false,
  compact = false,
}: {
  language: keyof typeof locales;
  onTranscript: (text: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    );
    return () => recognitionRef.current?.abort();
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Constructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      setSupported(false);
      return;
    }
    setError('');
    const recognition = new Constructor();
    recognition.lang = locales[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission is blocked.'
          : 'Could not hear clearly. Try again.',
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError('Microphone could not start. Please try again.');
      setListening(false);
    }
  }

  return (
    <div className={compact ? '' : 'mt-2'}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled || !supported}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${listening ? 'border-red-300 bg-red-400/15 text-red-200' : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-45`}
        aria-pressed={listening}
        aria-label={listening ? 'Stop voice input' : 'Answer using microphone'}
        title={
          supported ? 'Answer using microphone' : 'Voice input unavailable'
        }
      >
        {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        {compact
          ? null
          : listening
            ? 'Listening...'
            : supported
              ? 'Speak answer'
              : 'Voice input unavailable'}
      </button>
      {error && !compact && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

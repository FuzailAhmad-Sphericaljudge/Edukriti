'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import type { TeachingLanguage } from '@edukriti/contracts';

interface TutorVoiceProps {
  language: TeachingLanguage;
  onTranscript: (text: string) => void;
  lastAnswerToSpeak?: string;
  isStreaming?: boolean;
  disabled?: boolean;
  handsFreeActive: boolean;
  onToggleHandsFree: (active: boolean) => void;
}

type SpeechRecognitionType = any;

export function TutorVoice({
  language,
  onTranscript,
  lastAnswerToSpeak,
  isStreaming = false,
  disabled = false,
  handsFreeActive,
  onToggleHandsFree,
}: TutorVoiceProps) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const spokenTextRef = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = Boolean(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
      const hasSynth = typeof window.speechSynthesis !== 'undefined';
      setSupported(hasSpeech || hasSynth);
      synthRef.current = window.speechSynthesis || null;
    }
  }, []);

  // Hands-free auto-speak when answer is ready
  useEffect(() => {
    if (
      handsFreeActive &&
      lastAnswerToSpeak &&
      !isStreaming &&
      lastAnswerToSpeak !== spokenTextRef.current
    ) {
      spokenTextRef.current = lastAnswerToSpeak;
      speakText(lastAnswerToSpeak, () => {
        // When speech finishes, auto-listen for next question in hands-free mode!
        if (handsFreeActive) {
          startListening();
        }
      });
    }
  }, [handsFreeActive, lastAnswerToSpeak, isStreaming]);

  const getLocale = (lang: TeachingLanguage) => {
    if (lang === 'hindi') return 'hi-IN';
    return 'en-IN';
  };

  const startListening = () => {
    if (listening || disabled) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.lang = getLocale(language);
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) {
          onTranscript(transcript);
        }
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;

    // Clean markdown/math from spoken text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code example provided.')
      .replace(/\$\$[\s\S]*?\$\$/g, 'mathematical formula')
      .replace(/\$[^$]+\$/g, 'formula')
      .replace(/\[\d+\]/g, '')
      .replace(/[#*`_]/g, '')
      .trim();

    if (!cleanText) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLocale(language);
    utterance.rate = 1.0;

    // Find regional voice if available
    const voices = synthRef.current.getVoices();
    const targetLang = getLocale(language);
    const preferredVoice = voices.find((v) => v.lang === targetLang && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Google')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onEnd?.();
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {/* Microphone toggle */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={listening ? 'Stop listening' : 'Speak your question'}
        className={`inline-flex size-9 items-center justify-center rounded-xl border transition ${
          listening
            ? 'animate-pulse border-red-400 bg-red-500/20 text-red-300'
            : 'border-white/15 bg-white/5 text-slate-300 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200'
        } disabled:opacity-50`}
        aria-label={listening ? 'Listening to voice' : 'Start voice input'}
      >
        {listening ? <Mic className="size-4 text-red-400" /> : <MicOff className="size-4" />}
      </button>

      {/* Listening Waveform Indicator */}
      {listening && (
        <div
          className="flex items-center gap-0.5 rounded-lg border border-red-500/30 bg-red-500/10 px-1.5 py-1.5"
          title="Aarohi is actively listening..."
        >
          <span className="size-1 rounded-full bg-red-400 animate-pulse" />
          <span className="h-3 w-1 rounded-full bg-red-400 animate-bounce [animation-delay:100ms]" />
          <span className="h-4 w-1 rounded-full bg-red-400 animate-pulse [animation-delay:200ms]" />
          <span className="h-2 w-1 rounded-full bg-red-400 animate-bounce [animation-delay:300ms]" />
        </div>
      )}

      {/* Read Answer Voice Toggle */}
      {lastAnswerToSpeak && (
        <button
          type="button"
          onClick={() => (speaking ? stopSpeaking() : speakText(lastAnswerToSpeak))}
          title={speaking ? 'Mute Aarohi' : 'Listen to Aarohi answer'}
          className={`inline-flex size-9 items-center justify-center rounded-xl border transition ${
            speaking
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
              : 'border-white/15 bg-white/5 text-slate-300 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200'
          }`}
          aria-label={speaking ? 'Stop speech' : 'Listen to answer'}
        >
          {speaking ? <VolumeX className="size-4 text-emerald-300" /> : <Volume2 className="size-4" />}
        </button>
      )}

      {/* Speaking Waveform Indicator */}
      {speaking && (
        <div
          className="flex items-center gap-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-1.5"
          title="Aarohi is speaking..."
        >
          <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="h-3 w-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:100ms]" />
          <span className="h-4 w-1 rounded-full bg-emerald-400 animate-pulse [animation-delay:200ms]" />
          <span className="h-2 w-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
        </div>
      )}

      {/* Hands-Free Mode Toggle */}
      <button
        type="button"
        onClick={() => onToggleHandsFree(!handsFreeActive)}
        title="Hands-Free Mode: Aarohi speaks answers and listens automatically"
        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 transition ${
          handsFreeActive
            ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-sm shadow-amber-500/20'
            : 'border-white/15 bg-white/5 text-slate-400 hover:border-amber-400/40 hover:text-amber-300'
        }`}
      >
        <Radio className={`size-3.5 ${handsFreeActive ? 'animate-pulse text-amber-400' : ''}`} />
        <span className="hidden sm:inline">Hands-Free</span>
      </button>
    </div>
  );
}

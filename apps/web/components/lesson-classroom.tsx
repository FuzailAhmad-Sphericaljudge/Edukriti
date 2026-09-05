'use client';

import { checkpointAttemptResponseSchema, tutorResponseSchema, type CheckpointAttemptResponse, type LessonPlanGenerationResponse, type LessonPlan, type TutorResponse } from '@edukriti/contracts';
import { captionAt, lessonProgress, speechChunks, speechLocale, teachingVoiceScore } from '@edukriti/teaching-engine';
import { ArrowLeft, ArrowRight, BookOpen, Captions, Check, CirclePause, CirclePlay, CircleStop, Code2, Lightbulb, LockKeyhole, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShareLessonButton } from '@/components/share-lesson-button';

type Segment = LessonPlan['segments'][number];
type PlayerState = 'idle' | 'speaking' | 'paused' | 'finished';
type VoiceSpeed = 0.8 | 0.95 | 1.1 | 1.25;
type TutorExchange = { question: string; response: TutorResponse };

const voiceSpeeds: Array<{ value: VoiceSpeed; label: string }> = [
  { value: 0.8, label: '0.8×' },
  { value: 0.95, label: '1×' },
  { value: 1.1, label: '1.1×' },
  { value: 1.25, label: '1.25×' },
];

function TeachingVisual({ segment }: { segment: Segment }) {
  if (segment.visualType === 'equation') {
    const isForce = /force|newton|motion/i.test(`${segment.title} ${segment.visualBrief}`);
    const symbols = isForce ? ['F', 'm', 'a'] : ['V', 'I', 'R'];
    const labels = isForce ? ['Force', 'Mass', 'Acceleration'] : ['Voltage', 'Current', 'Resistance'];
    return <div className="grid h-full place-items-center p-6 text-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Concept equation</p><div className="mt-5 flex items-center justify-center gap-3 font-heading text-4xl font-black sm:text-6xl"><span className="rounded-2xl bg-white/10 px-4 py-3">{symbols[0]}</span><span>=</span><span className="rounded-2xl bg-amber-300 px-4 py-3 text-slate-950">{symbols[1]}</span><span>×</span><span className="rounded-2xl bg-white/10 px-4 py-3">{symbols[2]}</span></div><div className="mt-5 grid grid-cols-3 gap-2 text-xs text-white/65">{labels.map((label) => <span key={label}>{label}</span>)}</div></div></div>;
  }
  if (segment.visualType === 'code') {
    return <div className="m-5 rounded-2xl border border-white/10 bg-slate-950 p-5 font-mono text-sm leading-7 text-sky-200"><Code2 className="mb-3 size-5 text-amber-300" /><span className="text-fuchsia-300">function</span> learn(concept) {'{'}<br />&nbsp;&nbsp;<span className="text-emerald-300">return</span> explain(concept) + practice();<br />{'}'}</div>;
  }
  if (segment.visualType === 'graph') {
    return <div className="grid h-full place-items-center p-6"><svg viewBox="0 0 420 220" role="img" aria-label="Rising concept graph" className="w-full max-w-lg"><path d="M42 18v164h344" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="3" /><path d="M55 164 C125 150, 150 125, 206 130 S305 73, 375 42" fill="none" stroke="#fcd34d" strokeLinecap="round" strokeWidth="8" /><circle cx="206" cy="130" r="8" fill="#7dd3fc" /><circle cx="375" cy="42" r="8" fill="#7dd3fc" /></svg></div>;
  }
  const steps = segment.visualBrief.split(/[,.]/).filter(Boolean).slice(0, 3);
  return <div className="grid h-full place-items-center p-6"><div className="w-full max-w-lg"><Lightbulb className="mx-auto size-10 text-amber-300" /><h3 className="mt-4 text-center font-heading text-2xl font-bold">{segment.title}</h3><div className="mt-6 grid gap-3 sm:grid-cols-3">{(steps.length > 1 ? steps : ['Understand the idea', 'Connect an example', 'Apply what you learned']).map((step, index) => <div key={step} className="rounded-2xl border border-white/10 bg-white/7 p-4 text-center text-sm leading-5"><span className="mx-auto mb-3 grid size-7 place-items-center rounded-full bg-sky-400 font-bold text-slate-950">{index + 1}</span>{step.trim()}</div>)}</div></div></div>;
}

export function LessonClassroom({ lesson }: { lesson: LessonPlanGenerationResponse }) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [captionIndex, setCaptionIndex] = useState(0);
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(0.95);
  const [selectedVoiceName, setSelectedVoiceName] = useState('auto');
  const [spokenText, setSpokenText] = useState(lesson.plan.segments[0]!.narration);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, CheckpointAttemptResponse>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkpointError, setCheckpointError] = useState('');
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorHistory, setTutorHistory] = useState<TutorExchange[]>([]);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorError, setTutorError] = useState('');
  const requestIds = useRef<Record<string, string>>({});
  const segment = lesson.plan.segments[segmentIndex]!;
  const progress = lessonProgress(segmentIndex, lesson.plan.segments.length);
  const caption = useMemo(() => captionAt(spokenText, captionIndex), [captionIndex, spokenText]);
  const checkpointResult = segment.checkpoint ? attempts[segment.checkpoint.id] : undefined;
  const rankedVoices = useMemo(() => [...voices].sort((left, right) => teachingVoiceScore(right.name, right.lang, lesson.plan.language) - teachingVoiceScore(left.name, left.lang, lesson.plan.language)), [lesson.plan.language, voices]);
  const preferredVoice = useMemo(() => selectedVoiceName === 'auto' ? rankedVoices[0] ?? null : voices.find((voice) => voice.name === selectedVoiceName) ?? rankedVoices[0] ?? null, [rankedVoices, selectedVoiceName, voices]);
  const stopSpeech = useCallback(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  useEffect(() => {
    const available = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    setSpeechAvailable(available);
    if (!available) return stopSpeech;
    const refreshVoices = () => setVoices(window.speechSynthesis.getVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
      stopSpeech();
    };
  }, [stopSpeech]);

  useEffect(() => {
    try {
      const savedSpeed = Number(window.localStorage.getItem('edukriti.voice-speed'));
      if (voiceSpeeds.some((speed) => speed.value === savedSpeed)) setVoiceSpeed(savedSpeed as VoiceSpeed);
      setSelectedVoiceName(window.localStorage.getItem('edukriti.voice-name') || 'auto');
    } catch {
      // Browser privacy settings may disable preference storage.
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!speechAvailable) return;
    stopSpeech();
    setSpokenText(text);
    setCaptionIndex(0);
    const chunks = speechChunks(text);
    let offset = 0;
    chunks.forEach((chunk, index) => {
      const chunkOffset = offset;
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = speechLocale(lesson.plan.language);
      utterance.rate = voiceSpeed;
      utterance.pitch = 1.03;
      utterance.volume = 1;
      utterance.voice = preferredVoice ?? [...window.speechSynthesis.getVoices()].sort((left, right) => teachingVoiceScore(right.name, right.lang, lesson.plan.language) - teachingVoiceScore(left.name, left.lang, lesson.plan.language))[0] ?? null;
      utterance.onstart = () => setCaptionIndex(chunkOffset);
      utterance.onboundary = (event) => setCaptionIndex(chunkOffset + event.charIndex);
      if (index === chunks.length - 1) {
        utterance.onend = () => setPlayerState('finished');
        utterance.onerror = () => setPlayerState('idle');
      }
      window.speechSynthesis.speak(utterance);
      offset += chunk.length + 1;
    });
    setPlayerState('speaking');
  }, [lesson.plan.language, preferredVoice, speechAvailable, stopSpeech, voiceSpeed]);

  const speak = useCallback(() => {
    if (playerState === 'paused') { window.speechSynthesis.resume(); setPlayerState('speaking'); return; }
    speakText(segment.narration);
  }, [playerState, segment.narration, speakText]);

  const pause = () => { window.speechSynthesis.pause(); setPlayerState('paused'); };
  const stop = () => { stopSpeech(); setPlayerState('idle'); setCaptionIndex(0); };
  const canMoveTo = (nextIndex: number) => !lesson.plan.segments.slice(0, nextIndex).some((item) => item.checkpoint && !attempts[item.checkpoint.id]);
  const move = (nextIndex: number) => {
    if (!canMoveTo(nextIndex)) return;
    stopSpeech();
    setSegmentIndex(nextIndex);
    setSpokenText(lesson.plan.segments[nextIndex]!.narration);
    setCaptionIndex(0);
    setPlayerState('idle');
    setCheckpointError('');
    setTutorQuestion('');
    setTutorHistory([]);
    setTutorError('');
  };
  const tryMove = (nextIndex: number) => {
    if (!canMoveTo(nextIndex)) {
      setCheckpointError('Complete the current checkpoint to unlock the next lesson step.');
      return;
    }
    move(nextIndex);
  };

  const changeAnswer = (checkpointId: string, value: string) => {
    setAnswers((current) => ({ ...current, [checkpointId]: value }));
    if (attempts[checkpointId]) setAttempts((current) => { const next = { ...current }; delete next[checkpointId]; return next; });
    delete requestIds.current[checkpointId];
    setCheckpointError('');
  };

  const askTutor = async () => {
    const question = tutorQuestion.trim();
    if (question.length < 2) { setTutorError('Type a question for Aarohi first.'); return; }
    setTutorBusy(true);
    setTutorError('');
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.plan.id, currentSegmentId: segment.id, question, history: tutorHistory.flatMap((exchange) => [{ role: 'user', content: exchange.question }, { role: 'assistant', content: exchange.response.answer }]).slice(-6) }),
      });
      if (!response.ok) throw new Error('Aarohi could not answer right now. Please try again.');
      const answer = tutorResponseSchema.parse(await response.json());
      setTutorHistory((current) => [...current, { question, response: answer }].slice(-3));
      setTutorQuestion('');
    } catch (error) {
      setTutorError(error instanceof Error ? error.message : 'Aarohi could not answer right now.');
    } finally {
      setTutorBusy(false);
    }
  };

  const submitCheckpoint = async () => {
    if (!segment.checkpoint) return;
    const answer = answers[segment.checkpoint.id]?.trim() ?? '';
    if (answer.length < 2) { setCheckpointError('Write a short answer first.'); return; }
    const clientRequestId = requestIds.current[segment.checkpoint.id] ?? crypto.randomUUID();
    requestIds.current[segment.checkpoint.id] = clientRequestId;
    setSubmitting(true);
    setCheckpointError('');
    try {
      const response = await fetch('/api/checkpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.plan.id, checkpointId: segment.checkpoint.id, response: answer, clientRequestId }) });
      if (!response.ok) throw new Error('Your answer could not be evaluated. Please try again.');
      const result = checkpointAttemptResponseSchema.parse(await response.json());
      setAttempts((current) => ({ ...current, [segment.checkpoint!.id]: result }));
    } catch (error) {
      setCheckpointError(error instanceof Error ? error.message : 'Your answer could not be evaluated.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="min-h-screen bg-[#071126] text-white">
    <header className="border-b border-white/10 bg-[#0b1730] px-4 py-3 sm:px-7"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><a href={`/lessons/${lesson.plan.id}/plan`} aria-label="Back to lesson plan" className="grid size-9 shrink-0 place-items-center rounded-lg text-white transition hover:bg-white/10"><ArrowLeft className="size-4" /></a><div className="min-w-0"><p className="truncate font-heading font-bold">{lesson.plan.title}</p><p className="text-xs text-white/50">Segment {segmentIndex + 1} of {lesson.plan.segments.length}</p></div></div><div className="flex shrink-0 items-center gap-2"><div className="hidden sm:block"><ShareLessonButton title={lesson.plan.title} dark /></div><Badge className="bg-emerald-400/15 text-emerald-300"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-300" />AI classroom</Badge></div></div></header>
    <div className="h-1 bg-white/10"><div className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all" style={{ width: `${progress}%` }} /></div>
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1c38] shadow-2xl">
        <div className="grid min-h-[520px] md:grid-cols-[40%_60%]">
          <div className="relative min-h-[320px] overflow-hidden border-b border-white/10 bg-slate-900 md:border-r md:border-b-0"><Image src="/teacher-avatar.png" alt="Edukriti AI teacher" fill priority sizes="(max-width: 768px) 100vw, 40vw" className={`object-cover object-top transition-transform duration-700 ${playerState === 'speaking' ? 'scale-[1.025]' : 'scale-100'}`} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071126] via-[#071126]/60 to-transparent p-5 pt-20"><div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${playerState === 'speaking' ? 'animate-pulse bg-emerald-400' : 'bg-white/40'}`} /><span className="text-sm font-bold">Aarohi · AI Teacher</span></div><p className="mt-1 text-xs text-white/60">{playerState === 'speaking' ? 'Teaching now' : playerState === 'paused' ? 'Lesson paused' : 'Ready when you are'}</p></div></div>
          <div className="relative min-h-[340px] bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,.15),transparent_35%)]"><TeachingVisual segment={segment} /><div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-[#050b18]/90 px-4 py-3 text-center shadow-xl backdrop-blur"><div className="mb-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300"><Captions className="size-3.5" /> Live captions</div><p className="text-sm leading-6 text-white sm:text-base">{caption}</p></div></div>
        </div>
        <div className="border-t border-white/10 bg-[#09152c] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" disabled={segmentIndex === 0} onClick={() => move(segmentIndex - 1)} className="grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous segment"><ArrowLeft className="size-4" /></button>
              {playerState === 'speaking' ? <button type="button" onClick={pause} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-50"><CirclePause className="size-4" /> Pause voice</button> : <button type="button" onClick={speak} disabled={!speechAvailable} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50">{playerState === 'finished' ? <RotateCcw className="size-4" /> : <CirclePlay className="size-4 fill-slate-950" />}{playerState === 'paused' ? 'Resume voice' : playerState === 'finished' ? 'Replay voice' : 'Start teacher voice'}</button>}
              {(playerState === 'speaking' || playerState === 'paused') && <button type="button" onClick={stop} className="grid size-10 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Stop teacher voice"><CircleStop className="size-5" /></button>}
              <button type="button" disabled={segmentIndex === lesson.plan.segments.length - 1} onClick={() => tryMove(segmentIndex + 1)} className="grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30" aria-label={segment.checkpoint && !checkpointResult ? 'Answer the checkpoint to continue' : 'Next segment'}><ArrowRight className="size-4" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/55"><Volume2 className="size-4" /> {speechAvailable ? `${preferredVoice?.name ?? `${speechLocale(lesson.plan.language)} teacher voice`} · ${voiceSpeed}× speed` : 'Captions mode · voice unavailable'}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-xs text-white/45">Natural sentence pauses and live captions are enabled.</p>
            <div className="flex flex-wrap items-center justify-end gap-2"><label className="sr-only" htmlFor="teacher-voice">Teacher voice</label><select id="teacher-voice" value={selectedVoiceName} onChange={(event) => { stop(); setSelectedVoiceName(event.target.value); try { window.localStorage.setItem('edukriti.voice-name', event.target.value); } catch { /* Preference storage is optional. */ } }} className="h-8 max-w-44 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white outline-none"><option value="auto" className="text-slate-950">Auto voice</option>{rankedVoices.slice(0, 12).map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name} className="text-slate-950">{voice.name} ({voice.lang})</option>)}</select><div className="flex rounded-full bg-white/5 p-1" aria-label="Teacher voice speed">{voiceSpeeds.map((speed) => <button key={speed.value} type="button" onClick={() => { stop(); setVoiceSpeed(speed.value); try { window.localStorage.setItem('edukriti.voice-speed', String(speed.value)); } catch { /* Preference storage is optional. */ } }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${voiceSpeed === speed.value ? 'bg-sky-300 text-slate-950' : 'text-white/55 hover:text-white'}`}>{speed.label}</button>)}</div></div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-sky-400/[0.06] p-4 sm:p-5">
          <div className="flex items-center gap-2"><Sparkles className="size-5 text-sky-300" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-200">Ask Aarohi</p></div>
          <p className="mt-2 text-sm leading-6 text-white/65">Ask anything about this lesson. Aarohi uses the current concept and lesson sources to explain it clearly.</p>
          <div className="mt-3 flex flex-wrap gap-2">{[`Explain ${segment.title} more simply`, 'Give me a real-world example'].map((suggestion) => <button key={suggestion} type="button" onClick={() => setTutorQuestion(suggestion)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-white/65 transition hover:border-sky-300/30 hover:text-white">{suggestion}</button>)}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><Textarea value={tutorQuestion} onChange={(event) => { setTutorQuestion(event.target.value); setTutorError(''); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void askTutor(); } }} disabled={tutorBusy} placeholder="What would you like to understand?" className="min-h-20 border-white/15 bg-slate-950/40 text-white placeholder:text-white/35" /><button type="button" onClick={() => void askTutor()} disabled={tutorBusy || tutorQuestion.trim().length < 2} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="size-4" />{tutorBusy ? 'Thinking...' : 'Ask AI Teacher'}</button></div>
          {tutorError && <p role="alert" className="mt-2 text-xs text-red-300">{tutorError}</p>}
          {tutorHistory.length > 0 && <div aria-live="polite" className="mt-4 max-h-[460px] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/35 p-4">{tutorHistory.map((exchange, index) => <div key={`${exchange.question}-${index}`} className="space-y-3"><p className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-sky-300 px-4 py-3 text-sm leading-6 text-slate-950">{exchange.question}</p><div className="max-w-[94%] rounded-2xl rounded-bl-md bg-white/[0.07] p-4"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]"><span className="rounded-full bg-sky-300/15 px-2 py-1 text-sky-200">{exchange.response.provider === 'openai' ? 'Live AI answer' : 'Lesson knowledge'}</span>{exchange.response.grounded && <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-emerald-200">Source grounded</span>}</div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/80">{exchange.response.answer}</p><button type="button" onClick={() => speakText(exchange.response.answer)} disabled={!speechAvailable} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"><Volume2 className="size-4" /> Hear answer</button>{exchange.response.citations.length > 0 && <p className="mt-3 text-xs text-white/45">Lesson sources: {exchange.response.citations.map((citation) => citation.page ? `page ${citation.page}` : citation.chunkId).join(', ')}</p>}</div>{index === tutorHistory.length - 1 && <button type="button" onClick={() => setTutorQuestion(exchange.response.followUpQuestion)} className="text-left text-sm font-medium text-sky-200 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-100">Continue: {exchange.response.followUpQuestion}</button>}</div>)}</div>}
        </div>
      </section>
      <aside className="space-y-4"><section className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300">Now teaching</p><h1 className="mt-2 font-heading text-2xl font-bold leading-tight">{segment.title}</h1><p className="mt-3 text-sm leading-6 text-white/60">{segment.objective}</p><div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs"><span>{segment.estimatedMinutes} min</span><span className="capitalize">{segment.visualType.replace('_', ' ')}</span></div></section>
        {segment.checkpoint && <section className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5"><Sparkles className="size-5 text-amber-300" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">Understanding checkpoint</p><p className="mt-2 text-sm leading-6">{segment.checkpoint.prompt}</p><Textarea value={answers[segment.checkpoint.id] ?? ''} onChange={(event) => changeAnswer(segment.checkpoint!.id, event.target.value)} disabled={submitting} placeholder="Explain it in your own words…" className="mt-4 min-h-24 border-white/15 bg-slate-950/40 text-white placeholder:text-white/35" />{checkpointError && <p role="alert" className="mt-2 text-xs text-red-300">{checkpointError}</p>}<button type="button" onClick={submitCheckpoint} disabled={submitting || Boolean(checkpointResult)} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Checking meaning…' : checkpointResult ? 'Answer evaluated' : 'Check my answer'}</button>
          {checkpointResult && <div className={`mt-4 rounded-2xl border p-4 ${checkpointResult.evaluation.isCorrect ? 'border-emerald-300/25 bg-emerald-400/10' : 'border-orange-300/25 bg-orange-400/10'}`}><p className="flex items-center gap-2 text-sm font-bold">{checkpointResult.evaluation.isCorrect ? <Check className="size-4 text-emerald-300" /> : <Lightbulb className="size-4 text-orange-300" />}{checkpointResult.evaluation.isCorrect ? 'Concept understood' : 'Let’s clear this up'}</p><p className="mt-2 text-sm leading-6 text-white/75">{checkpointResult.evaluation.feedback}</p>{checkpointResult.adaptation && <div className="mt-3 border-t border-white/10 pt-3"><p className="text-xs font-bold text-orange-200">{checkpointResult.adaptation.title}</p><p className="mt-2 text-sm leading-6 text-white/80">{checkpointResult.adaptation.explanation}</p><button type="button" onClick={() => speakText(checkpointResult.adaptation!.explanation)} disabled={!speechAvailable} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"><Volume2 className="size-4" /> Hear new explanation</button></div>}</div>}
        </section>}
        {segmentIndex === lesson.plan.segments.length - 1 && (!segment.checkpoint || checkpointResult) && <section className="rounded-[24px] border border-emerald-300/20 bg-emerald-400/10 p-5"><Sparkles className="size-5 text-emerald-300" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">Lesson complete</p><h2 className="mt-2 font-heading text-xl font-bold">Ready to test yourself?</h2><p className="mt-2 text-sm leading-6 text-white/60">Finish a short assessment to get your score and personal learning report.</p><a href={`/lessons/${lesson.plan.id}/assessment`} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">Start final assessment <ArrowRight className="size-4" /></a></section>}
        <section className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5"><div className="flex items-center gap-2"><BookOpen className="size-4 text-emerald-300" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Lesson path</p></div><ol className="mt-4 space-y-3">{lesson.plan.segments.map((item, index) => { const unlocked = canMoveTo(index); return <li key={item.id}><button type="button" aria-disabled={!unlocked} onClick={() => tryMove(index)} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-sm transition ${!unlocked ? 'text-white/30 hover:bg-white/5' : index === segmentIndex ? 'bg-sky-400/15 text-sky-200' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${index < segmentIndex ? 'bg-emerald-400 text-slate-950' : index === segmentIndex ? 'bg-sky-300 text-slate-950' : 'bg-white/10'}`}>{index < segmentIndex ? <Check className="size-3.5" /> : !unlocked ? <LockKeyhole className="size-3" /> : index + 1}</span><span className="line-clamp-1 flex-1">{item.title}</span>{!unlocked && <span className="text-[10px] font-bold uppercase tracking-wide">Locked</span>}</button></li>; })}</ol></section>
      </aside>
    </div>
  </main>;
}

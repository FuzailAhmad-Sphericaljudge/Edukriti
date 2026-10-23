'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bookmark,
  BookmarkCheck,
  GraduationCap,
  ChevronRight,
  Calculator,
  ShieldAlert,
  BookOpen,
  Info,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Download,
  Trash2,
} from 'lucide-react';
import { exportConversationAsMarkdown } from '../../lib/tutor-export';
import type {
  Citation,
  TeachingLanguage,
  TutorIntent,
  TutorNote,
  TutorPedagogicalStyle,
  TutorRequest,
  TutorResponse,
  TutorStreamEvent,
  TutorImageAttachment,
} from '@edukriti/contracts';
import { MarkdownMath } from './markdown-math';
import { PhotoDoubtUploader } from './photo-doubt-uploader';
import { TutorVoice } from './tutor-voice';

export interface TutorConversationPanelProps {
  lessonId?: string;
  initialTopic?: string;
  className?: string;
  compact?: boolean;
}

type MessageItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: TutorResponse;
  image?: TutorImageAttachment;
  isStreaming?: boolean;
  statusPhase?: string;
};

export function TutorConversationPanel({
  lessonId,
  initialTopic = '',
  className = '',
  compact = false,
}: TutorConversationPanelProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuestion, setInputQuestion] = useState(initialTopic);
  const [style, setStyle] = useState<TutorPedagogicalStyle>('default');
  const [language, setLanguage] = useState<TeachingLanguage>('english');
  const [selectedImage, setSelectedImage] = useState<TutorImageAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'positive' | 'negative'>>({});
  const [savedNotes, setSavedNotes] = useState<TutorNote[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('edukriti_tutor_notes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const saveNote = (msg: MessageItem) => {
    if (!msg.response) return;
    const newNote: TutorNote = {
      id: `note-${Date.now()}`,
      question: msg.response.answer.slice(0, 40),
      answer: msg.response.answer,
      intent: msg.response.intent,
      subject: initialTopic || 'General Study',
      tags: [msg.response.intent, style, language],
      savedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    try {
      localStorage.setItem('edukriti_tutor_notes', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const isNoteSaved = (answerText: string) =>
    savedNotes.some((n) => n.answer === answerText);

  const handleFeedback = async (msgId: string, rating: 'positive' | 'negative', snippet: string) => {
    setFeedbackMap((prev) => ({ ...prev, [msgId]: rating }));
    try {
      await fetch('/api/tutor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          rating,
          questionSnippet: snippet.slice(0, 150) || 'Academic inquiry',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Offline fallback
    }
  };

  const handleDownloadChat = () => {
    const md = exportConversationAsMarkdown(messages, initialTopic || 'General Study');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aarohi-session-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (typeof window !== 'undefined' && window.confirm('Clear current tutor conversation history?')) {
      setMessages([]);
    }
  };

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSubmitting]);

  const handleSubmit = async (overrideQuestion?: string) => {
    const questionText = (overrideQuestion ?? inputQuestion).trim();
    if (!questionText && !selectedImage) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: questionText || 'Please solve this photo problem.',
        image: selectedImage || undefined,
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        statusPhase: 'Connecting with Aarohi...',
      },
    ]);

    setInputQuestion('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setIsSubmitting(true);

    const historyPayload = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const tutorReq: TutorRequest = {
      lessonId,
      question: questionText || 'Solve this photo problem.',
      history: historyPayload,
      style,
      language,
      image: imagePayload || undefined,
    };

    try {
      // Connect to SSE streaming endpoint
      const response = await fetch('/api/tutor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tutorReq),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed, switching to standard endpoint.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: TutorStreamEvent = JSON.parse(line.slice(6));

            if (event.type === 'status') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, statusPhase: event.message }
                    : m,
                ),
              );
            } else if (event.type === 'delta') {
              streamedText += event.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: streamedText }
                    : m,
                ),
              );
            } else if (event.type === 'complete') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: event.response.answer,
                        response: event.response,
                        isStreaming: false,
                        statusPhase: undefined,
                      }
                    : m,
                ),
              );
            }
          } catch {
            // Skip parse errors
          }
        }
      }
    } catch {
      // Fallback: standard POST /api/tutor
      try {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tutorReq),
        });
        const data: TutorResponse = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: data.answer,
                  response: data,
                  isStreaming: false,
                  statusPhase: undefined,
                }
              : m,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    'Aarohi could not answer right now. Please check your connection and try again.',
                  isStreaming: false,
                  statusPhase: undefined,
                }
              : m,
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === 'assistant' && !m.isStreaming);

  return (
    <div className={`flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 text-slate-100 ${className}`}>
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-400 text-slate-950 shadow-sm shadow-sky-400/30">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Ask Aarohi</h2>
            <p className="text-[11px] text-slate-400">
              Interactive AI Tutor • Multi-turn • Citations & Math
            </p>
          </div>
        </div>

        {/* Style & Language Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Style Pills */}
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
            {(
              [
                { id: 'default', label: 'Standard' },
                { id: 'eli10', label: "Like I'm 10" },
                { id: 'exam_style', label: 'Exam' },
                { id: 'deep_dive', label: 'Deep' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  style === s.id
                    ? 'bg-sky-400 font-semibold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as TeachingLanguage)}
            className="h-7 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] text-slate-200 outline-none hover:border-white/20"
            aria-label="Select tutoring language"
          >
            <option value="english" className="bg-slate-900">English</option>
            <option value="hindi" className="bg-slate-900">हिंदी</option>
            <option value="hinglish" className="bg-slate-900">Hinglish</option>
          </select>

          {/* Export and Clear controls */}
          <div className="flex items-center gap-1 ml-auto">
            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadChat}
                  title="Export session as Markdown notes"
                  className="inline-flex size-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white transition"
                  aria-label="Export chat as Markdown notes"
                >
                  <Download className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="inline-flex size-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message History Container */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          compact ? 'max-h-[380px] min-h-[220px]' : 'min-h-[340px] max-h-[580px]'
        }`}
      >
        {messages.length === 0 ? (
          <div className="grid place-items-center py-10 text-center text-slate-400">
            <GraduationCap className="size-10 text-sky-400/80 mb-2" />
            <h3 className="font-heading text-base font-semibold text-white">
              Hello! I’m Aarohi, your AI study teacher.
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-300">
              Ask any doubt in science, maths, coding, or history. Upload a problem photo, use voice, or choose a prompt below.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
              {[
                'Why does a ball stop rolling on grass?',
                'Explain Ohm’s law with a simple analogy',
                'A circuit has 12V and 4Ω resistor. Calculate current.',
                'How does photosynthesis generate glucose?',
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void handleSubmit(starter)}
                  className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-sky-200 hover:border-sky-400/40 hover:bg-sky-500/10 transition"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-sm ${
                  msg.role === 'user'
                    ? 'border border-sky-400/30 bg-sky-950/60 text-white'
                    : 'border border-white/10 bg-slate-900/90 text-slate-100 shadow-md'
                }`}
              >
                {/* Photo attachment preview */}
                {msg.image && (
                  <div className="mb-2 max-w-[200px] overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.image.dataUrl}
                      alt={msg.image.caption || 'Doubt image'}
                      className="size-full object-cover"
                    />
                  </div>
                )}

                {/* Status Phase Header for streaming */}
                {msg.isStreaming && msg.statusPhase && (
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                    <Loader2 className="size-3 animate-spin" />
                    <span>{msg.statusPhase}</span>
                  </div>
                )}

                {/* Main Content */}
                {msg.role === 'assistant' ? (
                  <MarkdownMath
                    content={msg.content || 'Thinking...'}
                    citations={msg.response?.citations}
                    onCitationClick={(citation) => setActiveCitation(citation)}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Numerical Verification Badge */}
                {msg.response?.mathVerification && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-2 text-xs text-emerald-300">
                    <Calculator className="size-4 shrink-0 text-emerald-400" />
                    <span>{msg.response.mathVerification.notes}</span>
                  </div>
                )}

                {/* Grounding / Source Attribution Notice */}
                {msg.response && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {msg.response.grounded ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <BookOpen className="size-3" /> Grounded in course material
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Info className="size-3" /> {msg.response.sourceAttributionNotice || 'General academic knowledge'}
                        </span>
                      )}
                      {!msg.response.safetyPassed && (
                        <span className="inline-flex items-center gap-1 text-red-300">
                          <ShieldAlert className="size-3" /> Safety Filter Active
                        </span>
                      )}
                    </div>

                    {/* Action buttons: Feedback, Save to notes & Make a lesson */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 border-r border-white/10 pr-1.5">
                        <button
                          type="button"
                          onClick={() => void handleFeedback(msg.id, 'positive', msg.content)}
                          title="Helpful explanation"
                          className={`rounded p-1 transition ${
                            feedbackMap[msg.id] === 'positive'
                              ? 'text-emerald-400 bg-emerald-500/20'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          <ThumbsUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleFeedback(msg.id, 'negative', msg.content)}
                          title="Needs improvement"
                          className={`rounded p-1 transition ${
                            feedbackMap[msg.id] === 'negative'
                              ? 'text-rose-400 bg-rose-500/20'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <ThumbsDown className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveNote(msg)}
                        title="Bookmark to study notes"
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                      >
                        {isNoteSaved(msg.response.answer) ? (
                          <BookmarkCheck className="size-3.5 text-amber-400" />
                        ) : (
                          <Bookmark className="size-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {isNoteSaved(msg.response.answer) ? 'Saved' : 'Save'}
                        </span>
                      </button>

                      <a
                        href={`/lessons/new?topic=${encodeURIComponent(
                          msg.content.slice(0, 60),
                        )}&language=${language}`}
                        className="inline-flex items-center gap-1 rounded bg-sky-400/20 px-2 py-0.5 text-sky-300 hover:bg-sky-400/30 transition"
                      >
                        Make Lesson <ChevronRight className="size-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Follow up prompt & suggestions */}
                {msg.response?.followUpQuestion && (
                  <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-950/30 p-2.5 text-xs">
                    <p className="font-semibold text-sky-200">
                      Aarohi asks: {msg.response.followUpQuestion}
                    </p>
                    {msg.response.suggestedQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.response.suggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => void handleSubmit(q)}
                            className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-300 hover:bg-sky-400/20 transition text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Citation Popover if active */}
      {activeCitation && (
        <div className="mx-4 my-2 flex items-center justify-between rounded-xl border border-sky-400/30 bg-sky-950/70 p-2.5 text-xs text-sky-200">
          <div>
            <span className="font-bold text-white">
              {activeCitation.title || activeCitation.chunkId}
            </span>
            <p className="text-[11px] text-slate-300">
              Source: {activeCitation.source || activeCitation.sourceId} • Page {activeCitation.page || 1}
            </p>
            <p className="mt-1 text-[11px] italic text-slate-400">“{activeCitation.excerpt}”</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCitation(null)}
            className="ml-3 rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {/* Input Form & Bottom Bar */}
      <div className="border-t border-white/10 p-3 sm:px-4">
        <div className="flex items-center gap-2">
          {/* Photo Doubt Uploader */}
          <PhotoDoubtUploader
            onImageSelected={setSelectedImage}
            selectedImage={selectedImage}
            disabled={isSubmitting}
          />

          {/* Voice & Hands-Free Component */}
          <TutorVoice
            language={language}
            onTranscript={(transcript) => {
              setInputQuestion((prev) => `${prev} ${transcript}`.trim());
              // If hands-free is active, auto-submit transcript
              if (handsFree) {
                void handleSubmit(`${inputQuestion} ${transcript}`.trim());
              }
            }}
            lastAnswerToSpeak={lastAssistantMessage?.response?.answer}
            isStreaming={isSubmitting}
            disabled={isSubmitting}
            handsFreeActive={handsFree}
            onToggleHandsFree={setHandsFree}
          />

          {/* Text Input */}
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={
              selectedImage
                ? 'Add a question about this photo (optional)...'
                : 'Ask Aarohi anything (e.g. solve 12V 4Ω circuit)...'
            }
            disabled={isSubmitting}
            className="h-10 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          />

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || (!inputQuestion.trim() && !selectedImage)}
            className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-400 text-slate-950 transition hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-400/20"
            aria-label="Send question to Aarohi"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

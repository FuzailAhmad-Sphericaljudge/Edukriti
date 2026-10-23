'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Trash2,
  Atom,
  FlaskConical,
  Binary,
  Landmark,
  Layers,
  Download,
  Copy,
} from 'lucide-react';
import type { TutorNote } from '@edukriti/contracts';
import { TutorConversationPanel } from '@/components/tutor/tutor-conversation-panel';

export default function TutorPage() {
  const [savedNotes, setSavedNotes] = useState<TutorNote[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('edukriti_tutor_notes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [copiedAll, setCopiedAll] = useState(false);

  const subjectQuestions: Record<string, string[]> = {
    Physics: [
      "Explain Newton's first law of motion and inertia",
      'Calculate resistance: 24V supply causes 6A current',
      "What is Snell's law and total internal reflection?",
    ],
    Chemistry: [
      "What is the mole concept and Avogadro's number?",
      'Explain ionic vs covalent chemical bonding',
      'How does an acid-base neutralization reaction work?',
    ],
    Mathematics: [
      'What does the discriminant determine in a quadratic equation?',
      'State the Pythagorean theorem and geometric interpretation',
      'Explain the Fundamental Theorem of Calculus',
    ],
    'Computer Science': [
      'How does binary search achieve O(log n) time complexity?',
      'Explain the difference between a Stack and a Queue',
      'What is Big-O notation and why is it used?',
    ],
    'History & Polity': [
      'What are Fundamental Rights in the Indian Constitution?',
      'What was the Salt Satyagraha Dandi March of 1930?',
      'Explain the three main organs under separation of powers',
    ],
  };

  const deleteNote = (id: string) => {
    const updated = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(updated);
    try {
      localStorage.setItem('edukriti_tutor_notes', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearAllNotes = () => {
    setSavedNotes([]);
    try {
      localStorage.removeItem('edukriti_tutor_notes');
    } catch {
      // Ignore
    }
  };

  const copyAllNotes = async () => {
    if (savedNotes.length === 0) return;
    const text = savedNotes
      .map(
        (n, i) =>
          `[Note ${i + 1}] ${n.subject || 'General'} (${new Date(n.savedAt).toLocaleDateString()}):\n${n.answer}`
      )
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Ignore
    }
  };

  const exportNotesAsJson = () => {
    if (savedNotes.length === 0) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(savedNotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'edukriti-study-notes.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-400 text-slate-950 shadow-sm shadow-sky-400/30">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h1 className="font-heading text-sm font-bold text-white sm:text-base">
                  Ask Aarohi — AI Study Station
                </h1>
                <p className="text-[11px] text-slate-400">
                  Step-by-step solutions • Multimodal doubts • KaTeX math • Hands-free
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'chat' ? 'notes' : 'chat')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                activeTab === 'notes'
                  ? 'border-amber-400/40 bg-amber-500/20 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className="size-3.5" />
              <span>Notes ({savedNotes.length})</span>
            </button>
            <Link
              href="/lessons/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-sky-400/30 transition hover:bg-sky-300"
            >
              <BookOpen className="size-3.5" />
              <span className="hidden sm:inline">New Lesson</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        {/* Left Sidebar: Subject Explorers & Quick Tips */}
        <div className="hidden lg:flex w-72 flex-col gap-4">
          {/* Subject Badges */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Curriculum Subjects
            </h3>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              Grounds queries in OpenStax & Wikipedia verified educational corpora.
            </p>
            <div className="mt-3 grid gap-2">
              {[
                { icon: Atom, name: 'Physics', desc: 'Mechanics, Ohm’s Law, Optics' },
                { icon: FlaskConical, name: 'Chemistry', desc: 'Mole concept, pH, Bonding' },
                { icon: Layers, name: 'Mathematics', desc: 'Calculus, Algebra, Probability' },
                { icon: Binary, name: 'Computer Science', desc: 'Algorithms, Data Structures' },
                { icon: Landmark, name: 'History & Polity', desc: 'Constitution, Independence' },
              ].map((sub) => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left text-xs transition ${
                    selectedSubject === sub.name
                      ? 'border-sky-400/40 bg-sky-500/10 text-white shadow-sm'
                      : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <sub.icon
                    className={`size-4 shrink-0 ${
                      selectedSubject === sub.name ? 'text-sky-400' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">{sub.name}</span>
                    <p className="text-[10px] text-slate-400">{sub.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Question Chips for Selected Subject */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                Quick {selectedSubject} Doubts:
              </span>
              <div className="mt-2 space-y-1.5">
                {(subjectQuestions[selectedSubject] || []).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setActivePrompt(q)}
                    className="block w-full text-left rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-200 transition"
                  >
                    “{q}”
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Study Tips */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-xs text-slate-300">
            <h4 className="font-bold text-sky-300">Pro-Tips with Aarohi</h4>
            <ul className="mt-2 space-y-1.5 text-[11px] list-disc list-inside text-slate-400">
              <li>Upload photos of textbook numericals to solve step-by-step.</li>
              <li>Toggle <strong>Hands-Free</strong> for continuous voice study.</li>
              <li>Switch style to <strong>“Like I’m 10”</strong> for easy analogies.</li>
              <li>Click <strong>Make Lesson</strong> to transform answers into full video lessons.</li>
            </ul>
          </div>
        </div>

        {/* Center Main: Conversation Panel or Saved Notes */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          {activeTab === 'chat' ? (
            <TutorConversationPanel
              key={activePrompt}
              initialTopic={activePrompt}
              className="flex-1 shadow-2xl"
            />
          ) : (
            <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Saved Study Notes</h2>
                  <p className="text-xs text-slate-400">
                    Important formulas, explanations, and concepts bookmarked during tutoring.
                  </p>
                </div>
                {savedNotes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportNotesAsJson}
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300 hover:bg-sky-500/20 transition"
                      title="Download notes as JSON"
                    >
                      <Download className="size-3" /> Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={copyAllNotes}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition"
                      title="Copy all notes to clipboard"
                    >
                      <Copy className="size-3" /> {copiedAll ? 'Copied!' : 'Copy All'}
                    </button>
                    <button
                      type="button"
                      onClick={clearAllNotes}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="size-3" /> Clear All
                    </button>
                  </div>
                )}
              </div>

              {savedNotes.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Bookmark className="mx-auto size-8 text-slate-600 mb-2" />
                  <p className="text-xs">No notes saved yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click “Save” on any Aarohi answer to keep it here for quick revision.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {savedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-white/10 bg-slate-950 p-4 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2 mb-2">
                        <span className="font-semibold text-sky-300 uppercase">
                          {note.subject || 'Study Note'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(note.savedAt).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="text-slate-500 hover:text-red-400"
                            aria-label="Delete note"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-200 leading-relaxed font-mono text-[11px]">
                        {note.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

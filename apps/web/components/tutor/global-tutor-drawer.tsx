'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import { TutorConversationPanel } from './tutor-conversation-panel';

export function GlobalTutorDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcuts: Escape to close, Ctrl+/ (or Cmd+/) to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Trigger Button on all pages */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-sky-500/20 backdrop-blur-md transition hover:scale-105 hover:border-sky-300 hover:bg-slate-800"
          aria-label="Open Ask Aarohi AI tutor"
        >
          <span className="flex size-2 rounded-full bg-sky-400 animate-ping" />
          <Sparkles className="size-4 text-sky-400" />
          <span>Ask Aarohi</span>
          <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] text-sky-300 font-mono">
            AI
          </span>
          <kbd className="hidden sm:inline-block rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">
            Ctrl+/
          </kbd>
        </button>
      )}

      {/* Slide-out Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-slate-950 shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Ask Aarohi AI Tutor Drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with maximize and close */}
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-sky-400 text-slate-950">
                  <Sparkles className="size-3.5" />
                </div>
                <span className="font-heading text-sm font-bold text-white">Ask Aarohi Drawer</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/tutor"
                  title="Open full tutor page"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Maximize2 className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close tutor drawer (Esc)"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-hidden p-2">
              <TutorConversationPanel className="h-full border-none bg-transparent shadow-none" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

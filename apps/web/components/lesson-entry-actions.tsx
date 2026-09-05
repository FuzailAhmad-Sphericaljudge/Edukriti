'use client';

import { ArrowRight, FileText, LoaderCircle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const defaults = {
  level: 'beginner',
  language: 'hinglish',
  duration: '20',
};

function openSetup(mode: 'topic' | 'upload', values = defaults) {
  const params = new URLSearchParams({ mode, ...values });
  window.location.assign(`/lessons/new?${params.toString()}`);
}

export function LessonEntryActions() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'start_lesson_setup',
          title: 'Start lesson setup',
          description: 'Open Edukriti lesson setup with the learner preferences preselected. This stages a lesson and does not create it.',
          inputSchema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['topic', 'upload'] },
              level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              language: { type: 'string', enum: ['english', 'hindi', 'hinglish'] },
              duration: { type: 'string', enum: ['5', '20', '60'] },
            },
            required: ['mode', 'level', 'language', 'duration'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            if (!input || typeof input !== 'object') throw new Error('Lesson setup preferences are required.');
            const values = input as Record<string, unknown>;
            const mode = values.mode;
            const level = values.level;
            const language = values.language;
            const duration = values.duration;
            if ((mode !== 'topic' && mode !== 'upload') || !['beginner', 'intermediate', 'advanced'].includes(String(level)) || !['english', 'hindi', 'hinglish'].includes(String(language)) || !['5', '20', '60'].includes(String(duration))) {
              throw new Error('Invalid lesson setup preferences.');
            }
            openSetup(mode, { level: String(level), language: String(language), duration: String(duration) });
            return { status: 'staged', mode, level, language, durationMinutes: Number(duration) };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  async function startInstantDemo() {
    setDemoLoading(true);
    setDemoError('');
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          learnerId: 'public-demo-learner',
          topic: "Newton's laws of motion",
          level: 'beginner',
          language: 'hinglish',
          durationMinutes: 5,
          style: 'visual',
          goal: 'Explain force, mass, and acceleration with simple everyday examples',
        }),
      });
      const body = await response.json() as { plan?: { id?: string }; error?: { message?: string } };
      if (!response.ok || !body.plan?.id) throw new Error(body.error?.message || 'The demo lesson could not start.');
      window.location.assign(`/lessons/${body.plan.id}/classroom?demo=1`);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : 'The demo lesson could not start.');
      setDemoLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={startInstantDemo} disabled={demoLoading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15223f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#21345b] active:translate-y-px disabled:cursor-wait disabled:opacity-70">
          {demoLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}{demoLoading ? 'Preparing demo...' : 'Try instant demo'}
        </button>
        <a href="/lessons/new?mode=topic&level=beginner&language=hinglish&duration=20" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/80 active:translate-y-px">
          Start with a topic <ArrowRight data-icon="inline-end" />
        </a>
        <a href="/lessons/new?mode=upload&level=beginner&language=hinglish&duration=20" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white/75 px-4 text-sm font-medium text-foreground transition hover:bg-white active:translate-y-px">
          <FileText data-icon="inline-start" /> Upload material
        </a>
      </div>
      {demoError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{demoError} <button type="button" onClick={startInstantDemo} className="underline underline-offset-2">Try again</button></p>}
    </div>
  );
}

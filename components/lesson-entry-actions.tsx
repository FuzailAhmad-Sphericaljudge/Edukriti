'use client';

import { ArrowRight, FileText } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

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

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button size="lg" className="h-11 rounded-xl px-4" onClick={() => openSetup('topic')}>
        Start with a topic <ArrowRight data-icon="inline-end" />
      </Button>
      <Button size="lg" variant="outline" className="h-11 rounded-xl border-primary/20 bg-white/75 px-4" onClick={() => openSetup('upload')}>
        <FileText data-icon="inline-start" /> Upload material
      </Button>
    </div>
  );
}

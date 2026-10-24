'use client';

import React from 'react';
import { MockTestArena } from '@/components/practice/mock-test-arena';
import { ArrowLeft } from 'lucide-react';

export default function MockTestPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/80 bg-gradient-to-b from-primary/5 via-background to-background py-6">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-9">
          <div className="flex items-center gap-3">
            <a
              href="/practice"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </a>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Full-Length Timed Examination
              </h1>
              <p className="text-xs text-muted-foreground">
                Sectional test interface with countdown timing, palette review, and real-attempt percentile scoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-9">
        <MockTestArena />
      </div>
    </main>
  );
}


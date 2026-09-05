'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

export function ShareLessonButton({ title, dark = false }: { title: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function shareLesson() {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Learn ${title} with Edukriti`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopied(false);
      }
    }
  }

  return <button type="button" onClick={shareLesson} className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${dark ? 'border-white/15 text-white/75 hover:bg-white/10 hover:text-white' : 'border-border bg-background/70 text-muted-foreground hover:text-foreground'}`} aria-label={`Share ${title}`}>{copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}{copied ? 'Link copied' : 'Share lesson'}</button>;
}

'use client';

import type { LessonPlanGenerationResponse, RetrievalResponse, SourceIngestionResponse } from '@edukriti/contracts';
import { BookOpen, Check, Clock3, FileSearch, Languages, LoaderCircle, Sparkles, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type Mode = 'topic' | 'upload';
type Status = 'idle' | 'uploading' | 'retrieving' | 'planning' | 'ready' | 'error';

export function LessonSetupForm({
  initialMode,
  initialLevel,
  initialLanguage,
  initialDuration,
}: {
  initialMode: Mode;
  initialLevel: string;
  initialLanguage: string;
  initialDuration: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SourceIngestionResponse | null>(null);
  const [retrieval, setRetrieval] = useState<RetrievalResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    setRetrieval(null);
    const formElement = event.currentTarget;
    const data = new FormData(formElement);

    try {
      let sourceId: string | undefined;
      if (mode === 'upload') {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error('Choose a PDF or text file first.');
        const upload = new FormData();
        upload.set('file', file);
        upload.set('learnerId', 'demo-learner');
        setStatus('uploading');
        const response = await fetch('/api/sources', { method: 'POST', body: upload });
        const body = await response.json() as SourceIngestionResponse & { error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message || 'Material processing failed.');
        setResult(body);
        sourceId = body.source.id;

        setStatus('retrieving');
        const retrievalResponse = await fetch('/api/retrieval', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sourceId, query: String(data.get('goal')), limit: 3 }),
        });
        const retrievalBody = await retrievalResponse.json() as RetrievalResponse & { error?: { message?: string } };
        if (!retrievalResponse.ok) throw new Error(retrievalBody.error?.message || 'Source retrieval failed.');
        setRetrieval(retrievalBody);
      }

      setStatus('planning');
      const lessonResponse = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          learnerId: 'demo-learner',
          topic: String(data.get('goal')),
          sourceId,
          level: String(data.get('level')),
          language: String(data.get('language')),
          durationMinutes: Number(data.get('duration')),
          style: 'simple_examples',
          goal: String(data.get('goal')),
        }),
      });
      const lessonBody = await lessonResponse.json() as LessonPlanGenerationResponse & { error?: { message?: string } };
      if (!lessonResponse.ok) throw new Error(lessonBody.error?.message || 'Lesson planning failed.');
      setStatus('ready');
      window.location.assign(`/lessons/${lessonBody.plan.id}/plan`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong while processing the material.');
      setStatus('error');
    }
  }

  const busy = status === 'uploading' || status === 'retrieving' || status === 'planning';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={submit} className="space-y-6 rounded-[28px] border bg-card p-6 shadow-[0_18px_50px_rgb(40_50_75/7%)] sm:p-8">
        <fieldset>
          <legend className="mb-3 text-sm font-bold">How should we begin?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('topic')} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${mode === 'topic' ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}><BookOpen className="size-5 text-primary" /><span><span className="block font-semibold">Enter a topic</span><span className="text-xs text-muted-foreground">Learn anything from the beginning</span></span></button>
            <button type="button" onClick={() => setMode('upload')} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${mode === 'upload' ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}><Upload className="size-5 text-primary" /><span><span className="block font-semibold">Upload material</span><span className="text-xs text-muted-foreground">PDF or plain-text notes</span></span></button>
          </div>
        </fieldset>

        {mode === 'upload' && (
          <label className="block rounded-2xl border border-dashed border-primary/30 bg-primary/[0.025] p-5 text-center">
            <Upload className="mx-auto size-6 text-primary" />
            <span className="mt-2 block text-sm font-bold">Choose learning material</span>
            <span className="mt-1 block text-xs text-muted-foreground">PDF or TXT · maximum 8 MB · up to 80 PDF pages</span>
            <input ref={fileRef} name="file" type="file" accept="application/pdf,text/plain,.pdf,.txt" className="mx-auto mt-4 block max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-primary-foreground" />
          </label>
        )}

        <label className="block"><span className="mb-2 block text-sm font-bold">Topic or learning goal</span><textarea name="goal" required rows={3} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" placeholder="Example: Teach me electricity using simple everyday examples" /></label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><BookOpen className="size-4 text-primary" /> Level</span><select name="level" defaultValue={initialLevel} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><Languages className="size-4 text-primary" /> Language</span><select name="language" defaultValue={initialLanguage} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="english">English</option><option value="hindi">Hindi</option><option value="hinglish">Hinglish</option></select></label>
          <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-primary" /> Time</span><select name="duration" defaultValue={initialDuration} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="5">5 minutes</option><option value="20">20 minutes</option><option value="60">60 minutes</option></select></label>
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="flex justify-end border-t pt-5">
          <Button disabled={busy} type="submit" size="lg" className="h-11 rounded-xl px-5">
            {busy ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
            {status === 'uploading' ? 'Extracting material…' : status === 'retrieving' ? 'Grounding lesson…' : status === 'planning' ? 'Building your lesson…' : 'Generate lesson plan'}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <section className="rounded-[22px] border bg-[#15223f] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/55">Grounding pipeline</p>
          <ol className="mt-4 space-y-4 text-sm">
            {['Validate untrusted file', 'Extract page-aware text', 'Create safe overlapping chunks', 'Retrieve supporting passages'].map((step, index) => (
              <li key={step} className="flex gap-3"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${status === 'ready' ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-white/70'}`}>{status === 'ready' ? <Check className="size-3.5" /> : index + 1}</span><span className="pt-0.5 text-white/80">{step}</span></li>
            ))}
          </ol>
        </section>

        {result && (
          <section className="rounded-[22px] border bg-card p-5">
            <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><FileSearch className="size-4" /></div><div><p className="text-xs text-muted-foreground">Material ready</p><p className="truncate text-sm font-bold">{result.source.filename}</p></div></div>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted p-3"><p className="text-lg font-bold">{result.source.pageCount}</p><p className="text-[11px] text-muted-foreground">Pages</p></div><div className="rounded-xl bg-muted p-3"><p className="text-lg font-bold">{result.source.chunkCount}</p><p className="text-[11px] text-muted-foreground">Knowledge chunks</p></div></div>
          </section>
        )}

        {retrieval && (
          <section className="rounded-[22px] border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Retrieved evidence</p>
            <div className="mt-3 space-y-3">{retrieval.citations.map((citation) => <div key={citation.chunkId} className="rounded-xl bg-muted p-3"><p className="line-clamp-3 text-xs leading-5">{citation.excerpt}</p><p className="mt-2 text-[10px] font-bold text-primary">PAGE {citation.pageStart}</p></div>)}</div>
            {!retrieval.grounded && <p className="mt-3 text-xs text-muted-foreground">No supporting passage matched this goal. Edukriti will not invent a source.</p>}
          </section>
        )}
      </aside>
    </div>
  );
}

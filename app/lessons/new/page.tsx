import { ArrowLeft, BookOpen, Clock3, Languages, Sparkles, Upload } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

export default async function NewLesson({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = valueOf(params.mode, 'topic');
  const level = valueOf(params.level, 'beginner');
  const language = valueOf(params.language, 'hinglish');
  const duration = valueOf(params.duration, '20');

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to dashboard</Link>
        <div className="mb-8 flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>
          <div><Badge variant="secondary" className="mb-2 text-primary">Create lesson</Badge><h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">Design your learning session</h1><p className="mt-2 text-muted-foreground">Tell Edukriti what you need. Your AI teacher will build the lesson around you.</p></div>
        </div>

        <form className="space-y-6 rounded-[28px] border bg-card p-6 shadow-[0_18px_50px_rgb(40_50_75/7%)] sm:p-8">
          <fieldset>
            <legend className="mb-3 text-sm font-bold">How should we begin?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${mode === 'topic' ? 'border-primary bg-primary/5' : ''}`}><input type="radio" name="mode" value="topic" defaultChecked={mode !== 'upload'} /><BookOpen className="size-5 text-primary" /><span><span className="block font-semibold">Enter a topic</span><span className="text-xs text-muted-foreground">Learn anything from the beginning</span></span></label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${mode === 'upload' ? 'border-primary bg-primary/5' : ''}`}><input type="radio" name="mode" value="upload" defaultChecked={mode === 'upload'} /><Upload className="size-5 text-primary" /><span><span className="block font-semibold">Upload material</span><span className="text-xs text-muted-foreground">PDF, notes, slides, or research</span></span></label>
            </div>
          </fieldset>

          <label className="block"><span className="mb-2 block text-sm font-bold">Topic or learning goal</span><textarea name="goal" rows={3} className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15" placeholder="Example: Teach me electricity using simple everyday examples" /></label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><BookOpen className="size-4 text-primary" /> Level</span><select name="level" defaultValue={level} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><Languages className="size-4 text-primary" /> Language</span><select name="language" defaultValue={language} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="english">English</option><option value="hindi">Hindi</option><option value="hinglish">Hinglish</option></select></label>
            <label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-primary" /> Time</span><select name="duration" defaultValue={duration} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="5">5 minutes</option><option value="20">20 minutes</option><option value="60">60 minutes</option></select></label>
          </div>

          <div className="flex justify-end border-t pt-5"><Button type="button" size="lg" className="h-11 rounded-xl px-5">Generate lesson plan <Sparkles data-icon="inline-end" /></Button></div>
        </form>
      </div>
    </main>
  );
}

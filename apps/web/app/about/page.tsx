import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  Eye,
  FileText,
  GraduationCap,
  Languages,
  Mic2,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';

const teachingLoop = [
  ['Understand', 'Read the learner goal, level, language, time, topic, or uploaded material.'],
  ['Plan', 'Choose concept order, depth, examples, checkpoints, and subject-aware visuals.'],
  ['Teach', 'Deliver an avatar-led explanation with natural voice and synchronized captions.'],
  ['Interact', 'Accept typed or spoken questions and ask the learner to explain ideas back.'],
  ['Adapt', 'Detect misconceptions, change the analogy or difficulty, and check again.'],
  ['Measure', 'Create an assessment, learning report, practice set, and next-step recommendation.'],
] as const;

const currentCapabilities = [
  'Topic-based lessons and PDF/TXT learning-material ingestion',
  'Page-aware retrieval with citations for grounded teaching',
  '5-, 20-, and 60-minute plans for beginner to advanced learners',
  'English, Hindi, and Hinglish teaching with adjustable browser voice',
  'Avatar classroom, captions, equations, diagrams, graphs, maps, timelines, and code views',
  'Voice or typed questions with short-term conversational context',
  'Checkpoint evaluation, misconception diagnosis, and alternative explanations',
  'Final assessment, saved reports, adaptive practice, revision tools, and progress analytics',
] as const;

const roadmap = [
  {
    phase: 'Near term',
    title: 'Broader content and richer lessons',
    items: ['DOCX and PPTX ingestion', 'More Indian languages', 'Interactive simulations and concept maps', 'Higher-quality neural speech and lip synchronization'],
  },
  {
    phase: 'Growth',
    title: 'A teacher that remembers',
    items: ['Long-term learner memory', 'Personalized homework and exam mode', 'Multiple teacher personalities', 'Emotion-aware pacing with explicit consent'],
  },
  {
    phase: 'Scale',
    title: 'Learning infrastructure for everyone',
    items: ['Teacher and parent dashboards', 'Classroom and LMS integrations', 'Low-bandwidth and offline modes', 'Institutional safety, evaluation, and governance controls'],
  },
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">
        <nav className="flex flex-wrap items-center justify-between gap-4" aria-label="About page navigation">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to Edukriti
          </a>
          <div className="flex flex-wrap gap-2">
            <a href="/progress" className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"><Target className="size-4" /> Progress</a>
            <a href="/lessons/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"><Sparkles className="size-4" /> Try the AI teacher</a>
          </div>
        </nav>

        <header className="relative mt-7 overflow-hidden rounded-[34px] bg-[#15223f] p-7 text-white shadow-[0_24px_70px_rgb(21_34_63/22%)] sm:p-11">
          <div className="absolute -right-20 -top-24 size-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="relative max-w-4xl">
            <Badge className="bg-amber-300 text-slate-950">AI Innovation Hackathon 2026</Badge>
            <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-sky-300">About Edukriti</p>
            <h1 className="mt-3 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] sm:text-6xl">
              An AI teacher that understands, explains, interacts, and adapts.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
              Edukriti transforms a topic or learning document into a personalized, multilingual teaching session. It is designed to behave like an educator—not a chatbot that waits for isolated questions and not a video that teaches every learner the same way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/lessons/new?mode=topic&level=beginner&language=hinglish&duration=20&goal=Teach%20me%20Ohm%27s%20Law%20with%20simple%20visual%20examples" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#15223f] transition hover:bg-sky-50">Start demo lesson <PlayCircle className="size-4" /></a>
              <a href="https://github.com/FuzailAhmad-Sphericaljudge/Edukriti" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10">View source code <ArrowRight className="size-4" /></a>
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-5 md:grid-cols-2" aria-labelledby="problem-heading">
          <article className="rounded-[26px] border bg-white p-6 shadow-sm sm:p-8">
            <div className="grid size-11 place-items-center rounded-2xl bg-orange-100 text-orange-700"><Eye className="size-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">The problem</p>
            <h2 id="problem-heading" className="mt-2 font-heading text-2xl font-bold tracking-[-0.03em]">Digital learning rarely notices when a learner is lost.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Pre-recorded lectures cannot change pace, examples, language, or difficulty. Basic chatbots can answer questions, but they do not plan a lesson, observe understanding, diagnose misconceptions, and guide a learner through a complete learning journey.</p>
          </article>
          <article className="rounded-[26px] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-6 shadow-sm sm:p-8">
            <div className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white"><GraduationCap className="size-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Our solution</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-[-0.03em]">One adaptive teaching loop from material to mastery.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Edukriti prepares a lesson for the learner&apos;s goal and available time, teaches through voice and visuals, asks questions at meaningful points, changes approach when understanding is weak, and turns the results into revision and next-step guidance.</p>
          </article>
        </section>

        <section className="mt-7 rounded-[30px] border bg-white p-6 shadow-sm sm:p-9" aria-labelledby="loop-heading">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Human-like teaching model</p>
          <h2 id="loop-heading" className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">The Edukriti teaching loop</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teachingLoop.map(([title, description], index) => (
              <article key={title} className="relative rounded-[20px] border bg-slate-50 p-5">
                <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-xs font-bold text-white">{index + 1}</span>
                <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]" aria-labelledby="capabilities-heading">
          <article className="rounded-[28px] border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Working today</p>
            <h2 id="capabilities-heading" className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">Current prototype capabilities</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {currentCapabilities.map((capability) => (
                <li key={capability} className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {capability}
                </li>
              ))}
            </ul>
          </article>
          <aside className="rounded-[28px] bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
            <Rocket className="size-7 text-amber-300" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-white/55">North-star vision</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">A great personal teacher within reach of every learner.</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">Our long-term goal is an affordable teaching companion that works across languages, abilities, devices, and bandwidth conditions—while keeping educators involved and learners in control.</p>
            <a href="#future" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">See the roadmap <ArrowRight className="size-4" /></a>
          </aside>
        </section>

        <section className="mt-7 rounded-[30px] bg-[#0f172a] p-6 text-white sm:p-9" aria-labelledby="architecture-heading">
          <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-400/15 text-sky-300"><Database className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300">System architecture</p><h2 id="architecture-heading" className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">Grounded content in, adaptive teaching out</h2></div></div>
          <div className="mt-8 grid gap-3 lg:grid-cols-5">
            {[['1', 'Topic or document', 'PDF/TXT extraction'], ['2', 'RAG knowledge layer', 'Chunking, ranking, citations'], ['3', 'Teaching engine', 'Plan, examples, visuals'], ['4', 'Interactive classroom', 'Avatar, voice, questions'], ['5', 'Learning memory', 'Reports, practice, analytics']].map(([number, title, detail]) => <div key={number} className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs font-black text-amber-300">{number}</span><h3 className="mt-3 font-heading font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/55">{detail}</p></div>)}
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-3 rounded-2xl bg-white/5 p-4"><FileText className="size-5 shrink-0 text-amber-300" /><div><p className="font-semibold">Knowledge</p><p className="mt-1 text-xs leading-5 text-white/55">Uploaded text is treated as evidence, never as executable instruction.</p></div></div>
            <div className="flex gap-3 rounded-2xl bg-white/5 p-4"><BrainCircuit className="size-5 shrink-0 text-sky-300" /><div><p className="font-semibold">Intelligence</p><p className="mt-1 text-xs leading-5 text-white/55">Validated structured generation plus a deterministic no-key demo provider.</p></div></div>
            <div className="flex gap-3 rounded-2xl bg-white/5 p-4"><Mic2 className="size-5 shrink-0 text-emerald-300" /><div><p className="font-semibold">Experience</p><p className="mt-1 text-xs leading-5 text-white/55">Browser speech synthesis and recognition keep the core voice experience free.</p></div></div>
            <div className="flex gap-3 rounded-2xl bg-white/5 p-4"><Database className="size-5 shrink-0 text-violet-300" /><div><p className="font-semibold">Persistence</p><p className="mt-1 text-xs leading-5 text-white/55">D1 stores structured learning history; R2 stores uploaded source files.</p></div></div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-3" aria-label="Project principles">
          <article className="rounded-[24px] border bg-white p-6"><ShieldCheck className="size-6 text-emerald-600" /><h2 className="mt-4 font-heading text-xl font-bold">Responsible by design</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Citations expose source evidence, server-only credentials protect secrets, and schema validation limits malformed AI output. High-stakes learning still requires qualified human review.</p></article>
          <article className="rounded-[24px] border bg-white p-6"><Languages className="size-6 text-indigo-600" /><h2 className="mt-4 font-heading text-xl font-bold">Inclusive learning</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Language, pace, level, voice speed, captions, typed input, and voice input give learners multiple ways to participate.</p></article>
          <article className="rounded-[24px] border bg-white p-6"><Users className="size-6 text-orange-600" /><h2 className="mt-4 font-heading text-xl font-bold">Teacher augmentation</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The vision is to extend educator reach and give learners more practice—not replace teachers, institutions, or expert judgment.</p></article>
        </section>

        <section id="future" className="mt-7 rounded-[30px] border bg-white p-6 shadow-sm sm:p-9" aria-labelledby="future-heading">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Future vision</p>
          <h2 id="future-heading" className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em]">From hackathon prototype to learning platform</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {roadmap.map((stage, index) => (
              <article key={stage.phase} className="rounded-[22px] border p-5">
                <div className="flex items-center justify-between"><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{stage.phase}</span><span className="font-heading text-2xl font-black text-indigo-200">0{index + 1}</span></div>
                <h3 className="mt-5 font-heading text-xl font-bold">{stage.title}</h3>
                <ul className="mt-4 space-y-3">{stage.items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-muted-foreground"><ArrowRight className="mt-0.5 size-4 shrink-0 text-indigo-500" />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[26px] border bg-amber-50 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Important prototype notes</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Current limitations</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-amber-950/80"><li>• The avatar uses a polished portrait with speaking-state motion, not photorealistic real-time lip synchronization.</li><li>• Voice availability and recognition quality depend on browser and operating-system support.</li><li>• The current upload experience supports PDF and TXT; broader document formats are on the roadmap.</li><li>• Semantic evaluation is optimized for the prototype and needs wider subject testing before high-stakes use.</li></ul>
          </article>
          <article className="rounded-[26px] border bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Technology disclosure</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Services and libraries</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">React and Vinext power the interface. Cloudflare Workers, D1, and R2 provide deployment and persistence. Zod validates public boundaries. The browser Web Speech API provides voice playback and input. OpenAI structured generation is optional; the complete demonstration also works through a deterministic teaching provider without a paid model key.</p>
          </article>
        </section>

        <footer className="mt-7 rounded-[28px] bg-gradient-to-r from-indigo-600 to-violet-700 p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Build the AI teacher of the future</p><h2 className="mt-2 font-heading text-2xl font-bold">Experience the full teaching journey.</h2><p className="mt-2 text-sm text-white/65">Topic or material → lesson plan → AI classroom → adaptation → assessment → progress.</p></div>
          <a href="/lessons/new" className="mt-6 inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 sm:mt-0">Create a lesson <ArrowRight className="size-4" /></a>
        </footer>
      </div>
    </main>
  );
}

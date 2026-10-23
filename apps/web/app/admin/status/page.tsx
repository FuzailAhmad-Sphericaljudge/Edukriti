'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  Key,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type HealthData = {
  status: 'healthy' | 'fallback' | 'degraded';
  provider: string;
  configuredProvider: string;
  model: string;
  latencyMs: number;
  timestamp: string;
  features: {
    lessonGeneration: boolean;
    tutor: boolean;
    checkpointEvaluation: boolean;
    adaptiveAssessment: boolean;
    offlineFallbackReady: boolean;
  };
  credentials: {
    geminiConfigured: boolean;
    openaiConfigured: boolean;
  };
  error?: string | null;
};

type Lang = 'english' | 'hindi' | 'hinglish';

const i18n = {
  english: {
    title: 'Edukriti AI Core & System Status',
    subtitle: 'Internal diagnostic console for AI provider adapters, latency, and features.',
    refresh: 'Check Health Now',
    refreshing: 'Pinging AI Engine...',
    providerHeader: 'Active AI Provider',
    configuredProvider: 'Configured Provider',
    model: 'Active Model',
    latency: 'Roundtrip Latency',
    status: 'System Health',
    healthy: 'Healthy & Operational',
    fallback: 'Operating on Offline Fallback',
    degraded: 'Degraded / Error',
    featuresTitle: 'Live AI Capabilities',
    featureLesson: 'Structured Lesson Generation',
    featureTutor: 'Aarohi Conversational Voice AI',
    featureCheckpoint: 'Semantic Checkpoint Evaluator',
    featureAssessment: 'Dynamic Multi-Topic Assessment',
    featureFallback: 'Zero-Cost Deterministic Fallback',
    credentialsTitle: 'API Credentials & Keys',
    geminiStatus: 'Google Gemini API Key',
    openaiStatus: 'OpenAI API Key',
    configured: 'Detected (Server-side)',
    missing: 'Not Configured (Using Offline Fallback)',
    architectureTitle: 'Resilient Dual-Tier Architecture',
    archDesc:
      'All AI access flows through packages/ai with strict Zod schema validation. Every call retries once on schema error and automatically routes to the cached deterministic fallback when offline.',
  },
  hindi: {
    title: 'एदुकृति AI कोर और सिस्टम स्थिति',
    subtitle: 'AI प्रोवाइडर, लेटेंसी और सुविधाओं का आंतरिक डायग्नोस्टिक कंसोल।',
    refresh: 'अभी स्थिति जांचें',
    refreshing: 'AI इंजन जांच जारी...',
    providerHeader: 'सक्रिय AI प्रदाता',
    configuredProvider: 'कॉन्फ़िगर किया गया प्रदाता',
    model: 'सक्रिय मॉडल',
    latency: 'प्रतिक्रिया समय (लेटेंसी)',
    status: 'सिस्टम स्थिति',
    healthy: 'पूर्णतः सक्रिय और स्वस्थ',
    fallback: 'ऑफ़लाइन फॉलबैक पर कार्यरत',
    degraded: 'त्रुटि / बाधित',
    featuresTitle: 'सक्रिय AI क्षमताएं',
    featureLesson: 'संरचित पाठ निर्माण',
    featureTutor: 'आरोही संवादात्मक वॉइस AI शिक्षक',
    featureCheckpoint: 'अर्थ-आधारित चेकपॉइंट मूल्यांकन',
    featureAssessment: 'गतिशील बहु-विषय मूल्यांकन',
    featureFallback: 'शून्य-लागत ऑफ़लाइन फॉलबैक',
    credentialsTitle: 'API क्रेडेंशियल्स',
    geminiStatus: 'Google Gemini API कुंजी',
    openaiStatus: 'OpenAI API कुंजी',
    configured: 'उपलब्ध (सुरक्षित सर्वर-साइड)',
    missing: 'अनुपलब्ध (ऑफ़लाइन फॉलबैक चालू)',
    architectureTitle: 'विश्वसनीय AI आर्किटेक्चर',
    archDesc:
      'सभी AI अनुरोध packages/ai के माध्यम से Zod सत्यापन के साथ प्रोसेस होते हैं। विफलता पर स्वतः पुनः प्रयास और ऑफ़लाइन फॉलबैक उपलब्ध है।',
  },
  hinglish: {
    title: 'Edukriti AI Core & System Status',
    subtitle: 'Live diagnostic console for AI provider adapters, roundtrip latency, and active features.',
    refresh: 'Check Health Now',
    refreshing: 'AI Engine ping ho raha hai...',
    providerHeader: 'Active AI Provider',
    configuredProvider: 'Configured Provider',
    model: 'Active Model',
    latency: 'Roundtrip Latency',
    status: 'System Status',
    healthy: 'Bilkul Healthy & Active',
    fallback: 'Offline Fallback par running',
    degraded: 'Degraded / Error encountered',
    featuresTitle: 'Live AI Features',
    featureLesson: 'Personalized Lesson Generation',
    featureTutor: 'Aarohi Conversational Voice AI',
    featureCheckpoint: 'Semantic Checkpoint Evaluator',
    featureAssessment: 'Dynamic Multi-Topic Assessment',
    featureFallback: 'Zero-Cost Deterministic Fallback',
    credentialsTitle: 'API Credentials & Configuration',
    geminiStatus: 'Google Gemini API Key',
    openaiStatus: 'OpenAI API Key',
    configured: 'Detected (Secure Server-side)',
    missing: 'Not Configured (Fallback enabled)',
    architectureTitle: 'Resilient Dual-Tier Architecture',
    archDesc:
      'Saara AI traffic packages/ai provider adapter se route hota hai with strict Zod validation. Network ya schema fail hone par automatic single-retry aur instant fallback activate hota hai.',
  },
};

export default function AdminStatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('english');
  const [isPending, startTransition] = useTransition();

  const t = i18n[lang];

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    void fetch('/api/health/ai')
      .then((res) => {
        if (!res.ok) throw new Error(`Status HTTP ${res.status}`);
        return res.json() as Promise<HealthData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    void fetch('/api/health/ai')
      .then((res) => {
        if (!res.ok) throw new Error(`Status HTTP ${res.status}`);
        return res.json() as Promise<HealthData>;
      })
      .then((json) => {
        if (active) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">Edukriti Core Diagnostic</h1>
                <Badge variant="outline" className="text-xs bg-slate-100 font-mono">
                  /admin/status
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Cloudflare Workers • Packages/AI • Resilient Dual-Tier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border bg-slate-100 p-1 text-xs font-medium">
              {(['english', 'hindi', 'hinglish'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                    lang === l ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Button
              onClick={() => startTransition(handleRefresh)}
              disabled={loading || isPending}
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              <RefreshCw className={`size-4 ${loading || isPending ? 'animate-spin' : ''}`} />
              {loading || isPending ? t.refreshing : t.refresh}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Banner */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{t.title}</h2>
          <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span>Diagnostic check failed: {error}</span>
          </div>
        )}

        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
                {t.status}
              </CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                {data?.status === 'healthy' ? (
                  <>
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span className="text-emerald-700">{t.healthy}</span>
                  </>
                ) : data?.status === 'fallback' ? (
                  <>
                    <ShieldCheck className="size-5 text-amber-600" />
                    <span className="text-amber-700">{t.fallback}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-5 text-rose-600" />
                    <span className="text-rose-700">{t.degraded}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              {data?.status === 'healthy'
                ? 'Primary AI provider is answering with validated Zod structures.'
                : 'Offline deterministic provider guarantees 100% demo availability.'}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
                {t.providerHeader}
              </CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl font-mono text-slate-900">
                <Cpu className="size-5 text-indigo-600" />
                <span className="capitalize">{data?.provider ?? 'Detecting...'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 flex justify-between items-center">
              <span>{t.model}:</span>
              <span className="font-mono font-semibold text-slate-700">{data?.model ?? '-'}</span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold tracking-wider text-slate-500">
                {t.latency}
              </CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl font-mono text-slate-900">
                <Clock className="size-5 text-sky-600" />
                <span>{data ? `${data.latencyMs} ms` : '-'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              Measured real roundtrip latency of tiny structured health ping.
            </CardContent>
          </Card>
        </div>

        {/* Feature Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="size-4 text-indigo-600" />
                {t.featuresTitle}
              </CardTitle>
              <CardDescription className="text-xs">
                Active pedagogical capabilities powered by @edukriti/teaching-engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t.featureLesson, live: data?.features.lessonGeneration ?? true },
                { label: t.featureTutor, live: data?.features.tutor ?? true },
                { label: t.featureCheckpoint, live: data?.features.checkpointEvaluation ?? true },
                { label: t.featureAssessment, live: data?.features.adaptiveAssessment ?? true },
                { label: t.featureFallback, live: data?.features.offlineFallbackReady ?? true },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm"
                >
                  <span className="font-medium text-slate-700">{feat.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      feat.live
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500'
                    }
                  >
                    {feat.live ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="size-4 text-indigo-600" />
                {t.credentialsTitle}
              </CardTitle>
              <CardDescription className="text-xs">
                Zero secrets leaked • Verified through server-side environment bindings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.geminiStatus}</p>
                    <p className="text-xs text-slate-500 font-mono">GEMINI_API_KEY (Recommended)</p>
                  </div>
                  <Badge
                    className={
                      data?.credentials.geminiConfigured
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }
                  >
                    {data?.credentials.geminiConfigured ? t.configured : t.missing}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.openaiStatus}</p>
                    <p className="text-xs text-slate-500 font-mono">OPENAI_API_KEY (Optional fallback)</p>
                  </div>
                  <Badge
                    className={
                      data?.credentials.openaiConfigured
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }
                  >
                    {data?.credentials.openaiConfigured ? t.configured : t.missing}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs text-indigo-900 leading-relaxed">
                <p className="font-semibold text-indigo-950 mb-1">{t.architectureTitle}</p>
                <p>{t.archDesc}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

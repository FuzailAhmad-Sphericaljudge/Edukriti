'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  Hash,
  Database,
} from 'lucide-react';

interface StatsResponse {
  totalQuestions: number;
  totalVerified: number;
  parametricTemplatesCount: number;
  estimatedCombinations: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  parametricRegistry: {
    totalFamilies: number;
    estimatedCombinations: number;
    bySubject: Record<string, number>;
    familyIds: string[];
  };
  importedDatasets: {
    totalQuestions: number;
    byDataset: Record<string, number>;
    bySubject: Record<string, number>;
    byLicense: Record<string, number>;
    verifiedCount: number;
  };
}

export default function AdminStatsPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/practice-stats');
      const json = await res.json();
      setData(json as StatsResponse);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/admin/practice-stats')
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setData(json as StatsResponse);
          setLastRefreshed(new Date().toLocaleTimeString());
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load stats', err);
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/80 bg-gradient-to-b from-primary/5 via-background to-background py-8">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-9">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <ShieldCheck className="size-3.5" /> Rule 4 Honest Numbers Registry
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Computed from Real Registries
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Question Bank & Generator Diagnostics
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                All numbers shown in Edukriti UI and README are strictly derived from real code, parametric ranges, and verified dataset imports.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={fetchStats}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Recomputing...' : 'Recompute Stats'}</span>
              </button>
              {lastRefreshed && (
                <span className="text-[11px] text-muted-foreground">
                  Updated: {lastRefreshed}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-9">
        {data ? (
          <div className="space-y-8">
            {/* 4 Big KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Parametric Families</span>
                  <Cpu className="size-4 text-primary" />
                </div>
                <p className="mt-3 font-heading text-3xl font-bold text-foreground">
                  {data.parametricRegistry.totalFamilies}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vetted mathematical templates across 5 STEM disciplines
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Combinatorial Space</span>
                  <Hash className="size-4 text-emerald-600" />
                </div>
                <p className="mt-3 font-heading text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.parametricRegistry.estimatedCombinations.toLocaleString()}+
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Unique question instances computed from parameter ranges
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Benchmark Bank</span>
                  <Database className="size-4 text-sky-600" />
                </div>
                <p className="mt-3 font-heading text-3xl font-bold text-foreground">
                  {data.importedDatasets.totalQuestions}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Curated questions from GSM8K, MATH, ARC & OpenBookQA
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Verified Questions</span>
                  <CheckCircle2 className="size-4 text-primary" />
                </div>
                <p className="mt-3 font-heading text-3xl font-bold text-foreground">
                  {data.totalVerified} / {data.totalQuestions}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dual independent solve agreement confirmed
                </p>
              </div>
            </div>

            {/* Subject Distribution & Imported Datasets */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Parametric Families by Subject */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Parametric Generator Distribution by Subject
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Count of template families implemented in @edukriti/questions
                </p>

                <div className="mt-5 space-y-3">
                  {Object.entries(data.parametricRegistry.bySubject).map(([subj, count]) => {
                    const pct = Math.round((count / data.parametricRegistry.totalFamilies) * 100);
                    return (
                      <div key={subj} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold capitalize">
                          <span>{subj.replace('_', ' ')}</span>
                          <span className="font-mono text-muted-foreground">{count} families ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Imported Benchmark Datasets */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Open Benchmark Question Sources
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recorded and licensed under OpenStax, MIT, CC BY-SA & Apache-2.0
                </p>

                <div className="mt-5 space-y-3">
                  {Object.entries(data.importedDatasets.byDataset).map(([ds, count]) => (
                    <div
                      key={ds}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" />
                        <span className="font-semibold capitalize text-foreground">{ds.replace('_', ' ')}</span>
                      </div>
                      <span className="font-mono font-bold text-primary">{count} questions</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
                  <p>Attributions verified in <code className="text-foreground">docs/DATA_SOURCES.md</code>.</p>
                </div>
              </div>
            </div>

            {/* Complete Registry of 60 Families */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <h3 className="font-heading text-base font-bold text-foreground">
                Catalog of 60 Parametric Template Families
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every template family is unit tested for correctness, distractor realism, and reproducibility
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {data.parametricRegistry.familyIds.map((fam) => (
                  <span
                    key={fam}
                    className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground"
                  >
                    {fam}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-64 place-items-center rounded-3xl border border-border bg-card">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </main>
  );
}


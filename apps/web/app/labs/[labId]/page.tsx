import React from 'react';
import { findExperimentById } from '@edukriti/lab';
import { GuidedLabStage } from '../../../components/lab/guided-lab-stage.tsx';
import Link from 'next/link';
import { FlaskConical, ArrowLeft } from 'lucide-react';

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const { labId } = await params;
  const experiment = findExperimentById(labId);

  if (!experiment) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <FlaskConical className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Experiment Not Found</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            The requested laboratory experiment <code className="text-sky-400 font-mono">&quot;{labId}&quot;</code> does not exist in the calibrated experiment registry.
          </p>
          <Link
            href="/labs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Labs Catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto mb-4">
        <Link
          href="/labs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Labs Catalog
        </Link>
      </div>
      <GuidedLabStage experiment={experiment} />
    </main>
  );
}


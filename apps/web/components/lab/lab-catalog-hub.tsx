'use client';

import React, { useState } from 'react';
import { getAllExperiments, getLabMetrics } from '@edukriti/lab';
import Link from 'next/link';
import { Search, FlaskConical, Atom, Sparkles, BookOpen, ChevronRight, Award } from 'lucide-react';

export function LabCatalogHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'physics' | 'chemistry'>('all');

  const allExperiments = getAllExperiments();
  const metrics = getLabMetrics();

  const filteredExperiments = allExperiments.filter((exp) => {
    const matchesSubject = selectedSubject === 'all' || exp.subject === selectedSubject;
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.aim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.conceptIds.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 text-slate-100 font-sans">
      {/* Hero Header */}
      <div className="mb-8 text-center sm:text-left flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <FlaskConical className="w-4 h-4" /> Phase 6: Interactive STEM Virtual Laboratories
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">
            Experiments You Can Run & Teachers Can Demonstrate
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Authentic physics and chemistry experiments with least-count instrument quantization,
            realistic wiring checks, teacher demonstration timelines, live regression plotting, and auto-graded reports.
          </p>
        </div>

        {/* Verified Metrics Badge */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <div className="text-center px-3 border-r border-slate-800">
            <div className="text-xl font-extrabold text-sky-400">{metrics.totalExperiments}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Experiments</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xl font-extrabold text-emerald-400">{metrics.totalInstruments}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Instruments</div>
          </div>
        </div>
      </div>

      {/* Search & Subject Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search experiments, apparatus, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedSubject === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({allExperiments.length})
          </button>
          <button
            onClick={() => setSelectedSubject('physics')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              selectedSubject === 'physics' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" /> Physics ({metrics.physicsCount})
          </button>
          <button
            onClick={() => setSelectedSubject('chemistry')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              selectedSubject === 'chemistry' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Chemistry ({metrics.chemistryCount})
          </button>
        </div>
      </div>

      {/* Grid of Experiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExperiments.map((exp, idx) => (
          <div
            key={exp.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1 group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-mono text-slate-500">#{idx + 1}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    exp.subject === 'physics'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {exp.subject} • Grade {exp.grade}
                </span>
              </div>

              <h3 className="font-bold text-slate-100 text-base group-hover:text-sky-300 transition-colors line-clamp-2 mb-2">
                {exp.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {exp.aim}
              </p>

              {/* Apparatus Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {exp.apparatus.slice(0, 3).map((app) => (
                  <span
                    key={app.id}
                    className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-mono"
                  >
                    {app.name.split('(')[0].trim()}
                  </span>
                ))}
                {exp.apparatus.length > 3 && (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono">
                    +{exp.apparatus.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <BookOpen className="w-3 h-3 text-sky-400" /> {exp.conceptIds[0].replace(/_/g, ' ')}
              </span>
              <Link
                href={`/labs/${exp.id}`}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-sky-600/20 transition-all"
              >
                Launch Lab <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


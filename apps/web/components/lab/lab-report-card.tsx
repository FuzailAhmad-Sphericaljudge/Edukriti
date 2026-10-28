'use client';

import React from 'react';
import { LabReportGrade } from '@edukriti/lab';
import { Award, CheckCircle2, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface LabReportCardProps {
  grade: LabReportGrade;
  experimentTitle: string;
}

export function LabReportCard({ grade, experimentTitle }: LabReportCardProps) {
  const getBadgeColor = (lGrade: string) => {
    switch (lGrade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'C':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
            <Sparkles className="w-4 h-4" /> Official Certified Laboratory Report
          </div>
          <h2 className="text-xl font-bold text-slate-100">{experimentTitle}</h2>
        </div>
        <div className={`px-4 py-2 rounded-2xl border text-xl font-extrabold ${getBadgeColor(grade.letterGrade)}`}>
          Grade {grade.letterGrade}
        </div>
      </div>

      {/* Overall Score & Subscores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
          <div className="text-xs text-slate-400 font-medium">Overall Score</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{grade.overallScore} / 100</div>
        </div>
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
          <div className="text-xs text-slate-400 font-medium">Reading Accuracy</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{grade.readingAccuracyScore}%</div>
        </div>
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
          <div className="text-xs text-slate-400 font-medium">Graph Linearity (R²)</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{grade.graphQualityScore}%</div>
        </div>
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
          <div className="text-xs text-slate-400 font-medium">Percentage Error</div>
          <div className={`text-2xl font-bold mt-1 ${grade.percentageError <= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {grade.percentageError}%
          </div>
        </div>
      </div>

      {/* Experimental vs Theoretical readout */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono mb-5">
        <div>
          <span className="text-slate-400">Experimental Value: </span>
          <span className="text-slate-100 font-bold">{grade.experimentalValue}</span>
        </div>
        <div>
          <span className="text-slate-400">Standard Theoretical Value: </span>
          <span className="text-emerald-400 font-bold">{grade.theoreticalValue}</span>
        </div>
      </div>

      {/* Teacher Aarohi's Personalized Commentary */}
      <div className="p-4 bg-sky-950/30 border border-sky-800/40 rounded-xl mb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-1">
          <Award className="w-4 h-4" /> Evaluator Feedback
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">{grade.teacherFeedback}</p>
      </div>

      {/* Strengths & Diagnosed Misconceptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" /> Observed Strengths
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            {grade.strengths.map((str, idx) => (
              <li key={idx}>{str}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" /> Diagnostic Feedback & Misconceptions
          </div>
          {grade.diagnosedMisconceptions.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              {grade.diagnosedMisconceptions.map((disc, idx) => (
                <li key={idx}>{disc}</li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-slate-400 italic">No significant procedural misconceptions detected!</div>
          )}
        </div>
      </div>

      {/* Spaced Revision Concept Links */}
      {grade.conceptRevisionLinks.length > 0 && (
        <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-400 flex items-center gap-1 mr-2">
            <BookOpen className="w-3.5 h-3.5" /> Concept Graph Links:
          </div>
          {grade.conceptRevisionLinks.map((conceptId) => (
            <Link
              key={conceptId}
              href={`/lessons/new?topic=${encodeURIComponent(conceptId.replace(/_/g, ' '))}`}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors font-mono"
            >
              {conceptId.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


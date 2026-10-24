'use client';

import React, { useState } from 'react';
import {
  ALL_SCENES,
  type Scene3DDefinition,
} from '@edukriti/visuals';
import { Model3DStage } from './model-3d-stage';
import {
  Atom,
  Binary,
  Compass,
  Cpu,
  Eye,
  Globe2,
  Orbit,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

export function SceneExplorerHub() {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(ALL_SCENES[0]?.id ?? 'atom_bohr_model');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const selectedScene: Scene3DDefinition =
    ALL_SCENES.find((s) => s.id === selectedSceneId) ?? ALL_SCENES[0]!;

  const filteredScenes = ALL_SCENES.filter((s) => {
    const matchesSubject = subjectFilter === 'all' || s.subject === subjectFilter;
    const matchesSearch =
      !searchFilter ||
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.conceptIds.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-9">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Phase 5 3D Teaching Models
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              9 Procedural Scenes
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Interactive 3D Science & Math Models
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Procedural WebGL & 2D fallback models with teacher audio sync, measurement tools, exploded views, and quizzes.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-9 w-44 rounded-xl border border-input bg-card pl-8 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Disciplines</option>
            <option value="physics">Physics (3)</option>
            <option value="chemistry">Chemistry (2)</option>
            <option value="biology">Biology (2)</option>
            <option value="mathematics">Mathematics (1)</option>
            <option value="astronomy">Astronomy (1)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Active 3D Stage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar Scene Navigator */}
        <div className="space-y-2 lg:col-span-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Procedural Models ({filteredScenes.length})
          </div>
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {filteredScenes.map((scene) => {
              const isSelected = selectedScene.id === scene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={`flex w-full flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-heading text-xs font-bold text-foreground">
                      {scene.title}
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                      {scene.subject}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {scene.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {scene.conceptIds.slice(0, 2).map((cid) => (
                      <span
                        key={cid}
                        className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
                      >
                        #{cid}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Model Stage */}
        <div className="h-[620px] lg:col-span-8">
          <Model3DStage scene={selectedScene} className="h-full" />
        </div>
      </div>
    </div>
  );
}


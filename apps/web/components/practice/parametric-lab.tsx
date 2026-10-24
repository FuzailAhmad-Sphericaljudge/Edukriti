'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Dice5,
  Calculator,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import type { PracticeQuestion } from '@edukriti/contracts';
import { QuestionViewer } from './question-viewer';

interface ParametricTemplateDef {
  familyId: string;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  combinations: number;
}

const TEMPLATE_CATALOG: ParametricTemplateDef[] = [
  // Math (20)
  { familyId: 'math_linear_eq_1var', title: 'Linear Equation in One Variable', subject: 'mathematics', grade: 'Grade 8', difficulty: 'easy', combinations: 6160 },
  { familyId: 'math_quadratic_roots', title: 'Quadratic Equation Roots', subject: 'mathematics', grade: 'Grade 10', difficulty: 'medium', combinations: 99 },
  { familyId: 'math_pythagoras_hypotenuse', title: 'Pythagorean Hypotenuse Calculation', subject: 'mathematics', grade: 'Grade 8', difficulty: 'easy', combinations: 60 },
  { familyId: 'math_circle_area_circumference', title: 'Circle Area and Circumference', subject: 'mathematics', grade: 'Grade 9', difficulty: 'easy', combinations: 24 },
  { familyId: 'math_percentage_discount', title: 'Percentage Discount and Sale Price', subject: 'mathematics', grade: 'Grade 7', difficulty: 'easy', combinations: 770 },
  { familyId: 'math_simple_interest', title: 'Simple Interest Calculation', subject: 'mathematics', grade: 'Grade 8', difficulty: 'easy', combinations: 5460 },
  { familyId: 'math_compound_interest', title: 'Compound Interest Compounded Annually', subject: 'mathematics', grade: 'Grade 9', difficulty: 'hard', combinations: 28 },
  { familyId: 'math_ratio_partition', title: 'Ratio Division of Quantities', subject: 'mathematics', grade: 'Grade 7', difficulty: 'easy', combinations: 180 },
  { familyId: 'math_ap_nth_term', title: 'Arithmetic Progression Nth Term', subject: 'mathematics', grade: 'Grade 10', difficulty: 'easy', combinations: 10850 },
  { familyId: 'math_ap_sum', title: 'Sum of First n Terms of AP', subject: 'mathematics', grade: 'Grade 10', difficulty: 'medium', combinations: 270 },
  { familyId: 'math_probability_marbles', title: 'Single-Event Probability (Urn Model)', subject: 'mathematics', grade: 'Grade 9', difficulty: 'easy', combinations: 504 },
  { familyId: 'math_trig_height_distance', title: 'Trigonometric Height and Distance', subject: 'mathematics', grade: 'Grade 10', difficulty: 'medium', combinations: 45 },
  { familyId: 'math_coordinate_distance', title: 'Distance Between Two Points', subject: 'mathematics', grade: 'Grade 9', difficulty: 'easy', combinations: 3200 },
  { familyId: 'math_exponent_laws', title: 'Product and Quotient Rule of Exponents', subject: 'mathematics', grade: 'Grade 8', difficulty: 'easy', combinations: 144 },
  { familyId: 'math_cylinder_volume', title: 'Right Circular Cylinder Volume', subject: 'mathematics', grade: 'Grade 9', difficulty: 'medium', combinations: 144 },
  { familyId: 'math_sphere_surface_area', title: 'Surface Area of a Sphere', subject: 'mathematics', grade: 'Grade 9', difficulty: 'easy', combinations: 13 },
  { familyId: 'math_polynomial_derivative', title: 'Polynomial First Derivative', subject: 'mathematics', grade: 'Grade 11', difficulty: 'medium', combinations: 224 },
  { familyId: 'math_statistics_mean', title: 'Arithmetic Mean of Dataset', subject: 'mathematics', grade: 'Grade 8', difficulty: 'easy', combinations: 45056 },
  { familyId: 'math_system_2linear', title: 'Simultaneous 2-Variable Linear System', subject: 'mathematics', grade: 'Grade 9', difficulty: 'hard', combinations: 49 },
  { familyId: 'math_logarithm_eval', title: 'Logarithm Evaluation and Power Law', subject: 'mathematics', grade: 'Grade 11', difficulty: 'medium', combinations: 16 },

  // Physics (20)
  { familyId: 'physics_ohms_law_current', title: 'Ohm’s Law Current Calculation', subject: 'physics', grade: 'Grade 10', difficulty: 'easy', combinations: 975 },
  { familyId: 'physics_resistors_series', title: 'Series Resistor Equivalent Resistance', subject: 'physics', grade: 'Grade 10', difficulty: 'easy', combinations: 432 },
  { familyId: 'physics_resistors_parallel', title: 'Parallel Resistor Equivalent Resistance', subject: 'physics', grade: 'Grade 10', difficulty: 'medium', combinations: 36 },
  { familyId: 'physics_electric_power', title: 'Electric Power Dissipation (P = VI)', subject: 'physics', grade: 'Grade 10', difficulty: 'easy', combinations: 140 },
  { familyId: 'physics_newtons_second_law', title: 'Newton’s Second Law Force (F = ma)', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 350 },
  { familyId: 'physics_kinematics_velocity', title: 'Final Velocity under Uniform Acceleration', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 4200 },
  { familyId: 'physics_kinematics_displacement', title: 'Displacement with Uniform Acceleration', subject: 'physics', grade: 'Grade 9', difficulty: 'medium', combinations: 60 },
  { familyId: 'physics_kinetic_energy', title: 'Kinetic Energy Calculation (KE = 1/2 mv²)', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 140 },
  { familyId: 'physics_potential_energy', title: 'Gravitational Potential Energy (PE = mgh)', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 360 },
  { familyId: 'physics_work_done', title: 'Work Done by Constant Force (W = Fd cos θ)', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 285 },
  { familyId: 'physics_projectile_range', title: 'Horizontal Projectile Range', subject: 'physics', grade: 'Grade 11', difficulty: 'hard', combinations: 21 },
  { familyId: 'physics_projectile_max_height', title: 'Maximum Projectile Height', subject: 'physics', grade: 'Grade 11', difficulty: 'hard', combinations: 21 },
  { familyId: 'physics_pendulum_period', title: 'Simple Pendulum Period', subject: 'physics', grade: 'Grade 11', difficulty: 'medium', combinations: 8 },
  { familyId: 'physics_density_mass_volume', title: 'Material Density Calculation', subject: 'physics', grade: 'Grade 8', difficulty: 'easy', combinations: 190 },
  { familyId: 'physics_pressure_force_area', title: 'Hydrostatic Pressure (P = F / A)', subject: 'physics', grade: 'Grade 8', difficulty: 'easy', combinations: 361 },
  { familyId: 'physics_hookes_law', title: 'Hooke’s Law Spring Restoring Force', subject: 'physics', grade: 'Grade 10', difficulty: 'easy', combinations: 100 },
  { familyId: 'physics_universal_gravitation', title: 'Newton’s Law of Universal Gravitation', subject: 'physics', grade: 'Grade 9', difficulty: 'hard', combinations: 3 },
  { familyId: 'physics_snells_law', title: 'Snell’s Law Optical Refraction', subject: 'physics', grade: 'Grade 10', difficulty: 'medium', combinations: 6 },
  { familyId: 'physics_wave_speed', title: 'Wave Velocity Equation (v = f λ)', subject: 'physics', grade: 'Grade 9', difficulty: 'easy', combinations: 114 },
  { familyId: 'physics_specific_heat', title: 'Specific Heat Thermal Transfer', subject: 'physics', grade: 'Grade 9', difficulty: 'medium', combinations: 90 },

  // Chemistry (15)
  { familyId: 'chem_molar_mass_calc', title: 'Compound Molar Mass Calculation', subject: 'chemistry', grade: 'Grade 9', difficulty: 'easy', combinations: 5 },
  { familyId: 'chem_mole_to_mass', title: 'Converting Moles to Gram Mass', subject: 'chemistry', grade: 'Grade 10', difficulty: 'easy', combinations: 10 },
  { familyId: 'chem_mass_to_moles', title: 'Converting Mass in Grams to Moles', subject: 'chemistry', grade: 'Grade 10', difficulty: 'easy', combinations: 9 },
  { familyId: 'chem_avogadro_particles', title: 'Avogadro’s Number Particle Calculation', subject: 'chemistry', grade: 'Grade 10', difficulty: 'medium', combinations: 7 },
  { familyId: 'chem_molarity_solution', title: 'Solution Molarity (M = moles / Liter)', subject: 'chemistry', grade: 'Grade 11', difficulty: 'medium', combinations: 40 },
  { familyId: 'chem_dilution_formula', title: 'Solution Dilution (M1V1 = M2V2)', subject: 'chemistry', grade: 'Grade 11', difficulty: 'medium', combinations: 180 },
  { familyId: 'chem_boyles_gas_law', title: 'Boyle’s Gas Law (P1V1 = P2V2)', subject: 'chemistry', grade: 'Grade 10', difficulty: 'easy', combinations: 252 },
  { familyId: 'chem_charles_gas_law', title: 'Charles’s Gas Law (V1/T1 = V2/T2)', subject: 'chemistry', grade: 'Grade 10', difficulty: 'medium', combinations: 225 },
  { familyId: 'chem_ideal_gas_law', title: 'Ideal Gas Equation (PV = nRT)', subject: 'chemistry', grade: 'Grade 11', difficulty: 'hard', combinations: 140 },
  { familyId: 'chem_ph_calculation', title: 'pH from Hydronium Ion Concentration', subject: 'chemistry', grade: 'Grade 10', difficulty: 'medium', combinations: 11 },
  { familyId: 'chem_poh_and_ph_sum', title: 'Relationship Between pH and pOH', subject: 'chemistry', grade: 'Grade 10', difficulty: 'easy', combinations: 10 },
  { familyId: 'chem_stoichiometric_ratio', title: 'Stoichiometric Mass Relations', subject: 'chemistry', grade: 'Grade 10', difficulty: 'medium', combinations: 9 },
  { familyId: 'chem_percent_yield', title: 'Reaction Percent Yield Calculation', subject: 'chemistry', grade: 'Grade 11', difficulty: 'medium', combinations: 54 },
  { familyId: 'chem_half_life_decay', title: 'First-Order Radioactive Half-Life Decay', subject: 'chemistry', grade: 'Grade 11', difficulty: 'hard', combinations: 21 },
  { familyId: 'chem_valence_electrons_octet', title: 'Valence Electron Octet Assessment', subject: 'chemistry', grade: 'Grade 9', difficulty: 'easy', combinations: 5 },

  // Biology & CS (5)
  { familyId: 'bio_mendelian_monohybrid', title: 'Mendelian Monohybrid Cross Ratio', subject: 'biology', grade: 'Grade 10', difficulty: 'medium', combinations: 8 },
  { familyId: 'bio_hardy_weinberg_equilibrium', title: 'Hardy-Weinberg Allele Frequencies', subject: 'biology', grade: 'Grade 12', difficulty: 'hard', combinations: 4 },
  { familyId: 'bio_microscope_magnification', title: 'Optical Microscope Total Magnification', subject: 'biology', grade: 'Grade 8', difficulty: 'easy', combinations: 10 },
  { familyId: 'cs_binary_to_decimal', title: 'Binary to Decimal Conversion', subject: 'computer_science', grade: 'Grade 8', difficulty: 'easy', combinations: 238 },
  { familyId: 'cs_algorithm_complexity_iterations', title: 'Nested Loop Iteration Count', subject: 'computer_science', grade: 'Grade 11', difficulty: 'medium', combinations: 5 },
];

export function ParametricLab() {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('physics_ohms_law_current');
  const [seed, setSeed] = useState<number>(42);
  const [generatedQuestion, setGeneratedQuestion] = useState<PracticeQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [filterSubject, setFilterSubject] = useState<string>('');

  const filteredCatalog = filterSubject
    ? TEMPLATE_CATALOG.filter((t) => t.subject === filterSubject)
    : TEMPLATE_CATALOG;

  const currentTemplate = TEMPLATE_CATALOG.find((t) => t.familyId === selectedFamilyId);

  const handleGenerate = async (customSeed?: number) => {
    const targetSeed = customSeed ?? seed;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: selectedFamilyId,
          seed: targetSeed,
        }),
      });

      const data = (await res.json()) as any;
      if (data.question) {
        setGeneratedQuestion(data.question);
      }
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRollDice = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    void handleGenerate(newSeed);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Cpu className="size-3.5" /> Deterministic Parametric Engine
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3" /> Rule 3: Zero Executable Code
              </span>
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              60 Parametric STEM Generator Families
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
              Explore unlimited unique question instances generated via seeded pseudo-random Mulberry32 numbers with mathematically verified distractors and KaTeX solutions.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Combinatorial Space
            </p>
            <p className="font-heading text-2xl font-bold text-primary">
              82,075+ Instances
            </p>
            <p className="text-[10px] text-muted-foreground">Computed directly from parameter step ranges</p>
          </div>
        </div>

        {/* Template Catalog Grid */}
        <div className="mt-6 border-t border-border/60 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Template Family ({filteredCatalog.length})
            </h4>

            <div className="flex items-center gap-1.5">
              {['', 'mathematics', 'physics', 'chemistry', 'biology', 'computer_science'].map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setFilterSubject(sub)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                    filterSubject === sub
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {sub ? sub.replace('_', ' ') : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-border/80 bg-background/50 p-2 divide-y divide-border/40">
            {filteredCatalog.map((t) => {
              const isSelected = selectedFamilyId === t.familyId;
              return (
                <button
                  key={t.familyId}
                  type="button"
                  onClick={() => {
                    setSelectedFamilyId(t.familyId);
                    setGeneratedQuestion(null);
                  }}
                  className={`flex w-full items-center justify-between p-2.5 text-left rounded-xl transition ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono capitalize">
                      {t.subject.slice(0, 4)}
                    </span>
                    <span className="text-xs font-medium text-foreground">{t.title}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ~{t.combinations} combinations
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generator Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">RNG Seed:</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value, 10) || 1)}
                className="mt-1 h-9 w-32 rounded-xl border border-input bg-background px-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleRollDice}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-xl border border-input px-3.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Dice5 className="size-3.5" /> Roll Random Seed
            </button>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleGenerate()}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Sparkles className="size-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Instance'}</span>
          </button>
        </div>
      </div>

      {/* Generated Instance Viewer */}
      {generatedQuestion && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
            <span>Generated instance preview (Seed: {seed})</span>
            <span className="font-mono">Family: {generatedQuestion.templateFamilyId}</span>
          </div>
          <QuestionViewer question={generatedQuestion} />
        </div>
      )}
    </div>
  );
}


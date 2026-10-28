# Phase 6: Interactive STEM Virtual Laboratories (`@edukriti/lab`)

## Architecture Overview

Phase 6 introduces a full virtual laboratory simulation framework (`@edukriti/lab`) that allows teachers to demonstrate experiments step-by-step and students to conduct hands-on laboratory investigations with authentic instrument mechanics.

Every experiment incorporates:
1. **Deterministic Physics & Chemistry Engines**: Mathematical calculation models producing grounded outputs with realistic Gaussian reading noise and instrument least-count quantization.
2. **21 Calibrated Virtual Instruments**: Voltmeters, ammeters, multimeters, rheostats, stopwatches, metre scales, vernier calipers, micrometer screw gauges, spring balances, measuring cylinders, burettes, pipettes, pH meters, thermometers, calorimeters, and beam balances.
3. **Reading Practice Mode**: Dedicated gamified challenge mode displaying authentic instrument dials and millimeter tick lines; students calculate Main Scale Readings (MSR), Vernier/Circular Scale Readings (VSR/CSR), and Zero Error (ZE), scored with step-by-step arithmetic breakdowns.
4. **Interactive Circuit & Rig Checking**: Enforces correct connection topology; detects reverse polarity deflections, open keys, and short-circuit conditions with immediate pedagogical remediation.
5. **Teacher Demonstration Mode**: An automated cue-by-cue script where Teacher Aarohi narrates each action, adjusts controls, records observation rows, and plots points before handing over control to the learner.
6. **Live Regression & Graph Analysis**: Ordinary least squares linear regression calculating slope, intercept, and correlation coefficient $R^2$ in real time.
7. **Auto-Graded Certified Lab Reports**: Synthesizes reading accuracy, graph linearity, percentage error, and viva voce performance into official grades (A+/A/B/C/D) with strengths and concept revision links.

---

## The 11 Experiments (In Implementation Order)

| # | ID | Subject | Grade | Aim & Science Principle | Instruments & Least Count | Theoretical Formula & Regression |
|---|:---|:---|:---|:---|:---|:---|
| 1 | `ohms_law` | Physics | 10 | Verify Ohm's law and determine resistance $R$ | Ammeter (0.02 A), Voltmeter (0.05 V), Rheostat, Battery & Key | $V = I \cdot R$; Slope of $V-I$ graph $= R$ |
| 2 | `series_parallel_resistors` | Physics | 10 | Determine equivalent resistance in series and parallel | Dual Resistors (4 Ω, 6 Ω), Ammeter, Voltmeter, Rheostat | Series: $R_s = R_1 + R_2$ (10 Ω); Parallel: $R_p = \frac{R_1 R_2}{R_1 + R_2}$ (2.4 Ω) |
| 3 | `simple_pendulum` | Physics | 11 | Determine acceleration due to gravity ($g$) via $L-T^2$ graph | Bob, Vernier Caliper, Metre Scale (0.1 cm), Digital Stopwatch (0.01 s) | $T = 2\pi\sqrt{L/g} \implies g = 4\pi^2 \frac{L}{T^2} = 9.80\,\text{m/s}^2$ |
| 4 | `projectile_motion` | Physics | 11 | Range, maximum height, and 45° optimal launch angle | Ballistic Spring Launcher, Metre Tape (0.1 cm), Photogate Timer (0.001 s) | $R = \frac{v_0^2 \sin 2\theta}{g}$; $H = \frac{v_0^2 \sin^2\theta}{2g}$; Complementary symmetry at $\theta$ and $90^\circ - \theta$ |
| 5 | `convex_lens_uv` | Physics | 10 | Focal length of convex lens via $u-v$ method | Optical Bench (0.1 cm), Convex Lens ($f=15\,\text{cm}$), Object & Search Needles | $\frac{1}{f} = \frac{1}{v} + \frac{1}{u} \implies f = \frac{uv}{u+v} = 15.0\,\text{cm}$; $2f$ symmetrical position |
| 6 | `acid_base_titration` | Chemistry | 11 | Molarity of unknown $\text{HCl}$ titrated against $0.1\,\text{M}\ \text{NaOH}$ | Burette (0.1 mL), Pipette (20 mL), Conical Flask, pH Electrode, Phenolphthalein | $M_1 V_1 = M_2 V_2 \implies M_1 = \frac{M_2 V_2}{V_1}$; Colorless $\to$ Faint Pink endpoint ($\text{pH} \approx 8.2$) |
| 7 | `density_archimedes` | Physics | 9 | Density of solids & Archimedes' principle verification | Spring Balance (0.05 N), Measuring Cylinder (1 mL), Brass Cylinder ($8.4\,\text{g/cm}^3$) | Loss in weight $= W_{\text{air}} - W_{\text{water}} = \text{Weight of displaced water} = V_{\text{disp}} \rho_w g$ |
| 8 | `vernier_screw_gauge` | Physics | 11 | Metrology with zero error corrections | Vernier Caliper ($\text{LC}=0.01\,\text{cm}$), Micrometer Screw Gauge ($\text{LC}=0.001\,\text{cm}$) | $\text{Corrected} = \text{MSR} + (\text{Division} \times \text{LC}) - (\pm \text{Zero Error})$ |
| 9 | `ph_common_solutions` | Chemistry | 10 | pH analysis of household solutions using universal indicator & pH meter | Digital pH Meter (0.01 pH), Universal Indicator Paper, Test Tubes, Wash Bottle | $\text{pH} = -\log_{10}[\text{H}^+]$; Lemon (2.2, Red) $\to$ Water (7.0, Green) $\to$ NaOH (13.0, Violet) |
| 10 | `refraction_glass_slab` | Physics | 10 | Snell's law & lateral displacement through glass slab | Glass Slab ($t=5.0\,\text{cm}$), Circular Protractor (1°), Millimetre Ruler | $\frac{\sin i}{\sin r} = \mu \approx 1.50$; $e = i$; Lateral shift $d = \frac{t \sin(i-r)}{\cos r}$ |
| 11 | `specific_heat` | Physics | 11 | Specific heat capacity of brass by method of mixtures | Copper Calorimeter with Stirrer, Thermometer (0.5°C), Chemical Balance (0.01 g) | $m_1 c_1 (T_1 - T_f) = (m_2 c_w + m_{\text{cal}} c_{\text{cal}})(T_f - T_2) \implies c_{\text{brass}} \approx 0.380\,\text{J/g}\cdot\text{K}$ |

---

## 9-Step Guided Mode Workflow

1. **Aim & Theory**: Clear statement of educational objective, variables breakdown, and governing physical laws.
2. **Apparatus & Least Counts**: Calibrated instrument specifications with ranges, units, and least count precision.
3. **Setup & Wiring**: Interactive terminal-to-terminal wiring verification. Warns immediately on reverse polarity needle deflections or short circuits.
4. **Perform & Measure**: Real-time manipulation of knobs, sliders, and taps driving the mathematical model; live SVG gauges (moving analog needles, meniscus curvatures, vernier jaw slides).
5. **Observation Table**: Tabular recording of trials with computed columns and pre-loaded standard datasets.
6. **Dynamic Graph**: Automatic SVG scatter plot with linear regression line of best fit and slope derivation.
7. **Calculations & Results**: Step-by-step formula substitutions, comparison with standard theoretical values, and percentage error calculation.
8. **Viva Voce Examination**: Conceptual questions diagnosing common laboratory misconceptions (e.g. why household circuits are parallel, why simple pendulums require small angles, why phenolphthalein turns pink).
9. **Auto-Graded Report**: Official certificate with letter grade (A+/A/B/C/D), strengths, and direct links to relevant concept graph nodes.

---

## Web Routes & AI Companion Integration

- **Labs Catalog Hub**: [`/labs`](file:///c:/Users/Fuzail%20Jarvis/OneDrive/Desktop/Edukriti/apps/web/app/labs/page.tsx)
- **Dedicated Lab Station**: [`/labs/:labId`](file:///c:/Users/Fuzail%20Jarvis/OneDrive/Desktop/Edukriti/apps/web/app/labs/[labId]/page.tsx)
- **Ask Aarohi Companion**: Natural inquiries (e.g. *"Can you demonstrate Ohm's law experiment?"* or *"Let's do acid base titration"*) return a direct 1-click launcher badge.

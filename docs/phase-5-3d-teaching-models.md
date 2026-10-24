# Phase 5: Procedural 3D Teaching Models & Interactive Visual Stage

## Overview

Edukriti's Phase 5 introduces a comprehensive, high-performance procedural 3D teaching engine (`@edukriti/visuals`) integrated directly with the AI teacher narration timeline, Ask Aarohi companion, and classroom visual stages.

Every 3D scene is procedurally generated using pure mathematical primitives and verified public-domain molecular coordinates. This design guarantees:
1. **Zero Asset Overhead**: No bulky megabyte-sized glTF/GLB models to download, preventing slow network stalls on mobile devices.
2. **Zero Licensing Risk**: PubChem coordinates and astronomical constants are in the public domain.
3. **Infinite Customization**: Parameters (such as atomic number, orbital velocities, wavelength, vector magnitude, or lattice type) dynamically regenerate mesh geometries in real time.
4. **Resilient Dual-Path Architecture**: When running on low-end devices without hardware WebGL or when WebGL context initialization fails, an automatic interactive 2D SVG/Canvas orthographic projection fallback activates with identical part-tapping and quiz capabilities.

---

## The 9 Procedural 3D Teaching Scenes

| Scene ID | Subject | Procedural Geometry Engine | Pedagogical Interactions & Features |
| :--- | :--- | :--- | :--- |
| `atom_bohr_model` | Physics / Chemistry | $Z=1..20$ Bohr shells (K, L, M, N), orbiting electrons ($v \propto 1/n$), packed central protons/neutrons | Electron orbital speed slider, element selector ($Z=1$ to $20$), energy-level emission transitions |
| `molecule_3d_viewer` | Chemistry | Authentic PubChem public domain 3D coordinates for $\text{H}_2\text{O}$ ($104.5^\circ$), $\text{CO}_2$ ($180^\circ$), $\text{CH}_4$ ($109.5^\circ$), $\text{NH}_3$ ($107^\circ$), ethanol, benzene, glucose | Ball-and-stick vs space-fill toggle, bond distance and valence angle measurements |
| `solar_system_seasons_eclipses` | Astronomy / Physics | Sun, Earth with $23.5^\circ$ axial tilt, elliptical orbital path, Moon orbit inclined at $5.14^\circ$ | Solstice and equinox highlights, Moon phase viewer, total solar and lunar eclipse alignment modes |
| `wave_interference_3d` | Physics | 3D dynamic heightfield grid ($z = A_1 \sin(k r_1 - \omega t) + A_2 \sin(k r_2 - \omega t)$) | Real-time phase, wavelength, and slit-separation controls; constructive antinode and nodal plane markers |
| `geometry_solids_3d` | Mathematics | Cube, rectangular prism, cylinder, sphere, cone, pyramid | Dynamic cutting-plane cross-sections (circle, ellipse, rectangle), live surface area and volume computation |
| `vectors_projectile_3d` | Physics | 3D coordinate decomposition ($\vec{v}_x, \vec{v}_y, \vec{v}_z$), ballistic trajectory with gravity and quadratic air drag | Launch angle, velocity, and elevation sliders; apex marker, flight time, and range readouts |
| `dna_double_helix_3d` | Biology | Watson-Crick B-DNA right-handed double helix ($3.4\,\text{nm}$ pitch, $10\,\text{bp}/\text{turn}$, major/minor grooves) | Complementary base pairs with 2 H-bonds ($\text{A}=\text{T}$) and 3 H-bonds ($\text{G}\equiv\text{C}$), unwinding replication mode |
| `crystal_lattice_3d` | Chemistry / Physics | Simple Cubic (SC), Body-Centered Cubic (BCC), Face-Centered Cubic (FCC), and Diamond cubic unit cells | Atomic Packing Factor (APF) live derivation ($\frac{\pi}{6}$, $\frac{\sqrt{3}\pi}{8}$, $\frac{\sqrt{2}\pi}{6}$), coordination numbers, $2\times2\times2$ supercell |
| `cell_biology_stylized` | Biology | Eukaryotic plant and animal cells with nucleus, nuclear pores, mitochondria (cristae), chloroplasts (thylakoids), Golgi, rough ER, and rigid cellulose wall | Plant vs animal toggle, organelle tap-to-inspect, photosynthesis vs cellular respiration focus |

---

## Pedagogical Interactions & Measurement Tools

1. **Orbit & Zoom**: High-precision 3D orbital navigation with touch gestures and keyboard accessibility.
2. **Exploded View**: Dynamic slider separating composite mesh elements outward along normal displacement vectors for interior inspection.
3. **Step-Through Mode**: Auto-rotates and sequences through key educational viewpoints and annotations.
4. **Euclidean Distance Measurement**: Tap any two 3D vertices or atoms to compute exact real-time distance ($d = \sqrt{\Delta x^2 + \Delta y^2 + \Delta z^2}$).
5. **3-Point Angle Measurement**: Tap three points ($A, B, C$) to compute the interior angle $\theta = \arccos\left(\frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}\right)$ (e.g. confirming water's $104.5^\circ$ bond angle).
6. **Quiz-On-The-Model**: Integrated gamified verification mode where students are prompted to locate specific anatomical/atomic structures (e.g. *"Tap the nucleus"*, *"Identify the Major Groove"*, *"Tap the Projectile Apex"*).
7. **Teacher Timeline Sync & "Pause and Explore"**:
   - `narrationCues` smoothly interpolate the 3D camera to focus on relevant components as the AI teacher speaks.
   - Students can click **"Pause and Explore"** at any moment to detach the camera, orbit freely, and measure structures without losing lesson context.

---

## WebGL Fallback Architecture

To adhere to Edukriti's universal accessibility standard:
- On startup, `webgl-detector.ts` checks hardware WebGL context support.
- If WebGL is unavailable or fails to initialize, `Diagram2DFallback` seamlessly renders a 2D orthographic vector projection with interactive SVG elements, measurement overlays, and quiz prompt handling.
- Mobile touch controls and `prefers-reduced-motion` are respected out of the box, with maximum `devicePixelRatio` capped at $2.0$ to prevent GPU thermal throttling.


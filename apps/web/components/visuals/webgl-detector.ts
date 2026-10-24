/**
 * Robust client-side WebGL capability detection.
 * Checks for WebGL 1.0/2.0 context support and device performance constraints.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    return Boolean(gl && gl instanceof WebGLRenderingContext);
  } catch {
    return false;
  }
}

/**
 * Checks if the learner's operating system requests reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns safe device pixel ratio capped at 2.0 to conserve mobile GPU battery.
 */
export function getSafePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}


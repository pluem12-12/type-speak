/**
 * Standard Monkeytype-compatible statistics calculations.
 *
 * Formulas:
 * - WPM = (correctChars / 5) / elapsedMinutes
 * - Raw WPM = (totalTyped / 5) / elapsedMinutes
 * - Accuracy = correct / (correct + incorrect + extra) * 100
 * - Consistency = (1 - std / mean) * 100 clamped 0-100 from 1-second WPM samples
 */

export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  const elapsedMinutes = elapsedMs / 60000;
  return Math.round(correctChars / 5 / elapsedMinutes);
}

export function calculateRawWpm(totalTyped: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || totalTyped <= 0) return 0;
  const elapsedMinutes = elapsedMs / 60000;
  return Math.round(totalTyped / 5 / elapsedMinutes);
}

export function calculateAccuracy(
  correct: number,
  incorrect: number,
  extra: number
): number {
  const total = correct + incorrect + extra;
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}

export function calculateConsistency(wpmSamples: number[]): number {
  if (wpmSamples.length < 2) return 100;
  const mean =
    wpmSamples.reduce((sum, val) => sum + val, 0) / wpmSamples.length;
  if (mean <= 0) return 0;

  const variance =
    wpmSamples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    wpmSamples.length;
  const std = Math.sqrt(variance);
  const rawConsistency = (1 - std / mean) * 100;

  return Math.round(Math.max(0, Math.min(100, rawConsistency)));
}


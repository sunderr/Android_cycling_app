import { BodyArea, Profile } from '../types';

/**
 * Converts a profile into a 0–100 "capacity" score. Higher means the person
 * can safely handle more difficult exercises and more volume.
 *
 * The weights are deliberately conservative: when in doubt, start easier —
 * feedback ("too easy") will move the person up quickly.
 */
export function capacityScore(p: Profile): number {
  // Self-rated fitness: 1 → 20, 5 → 80
  let score = 20 + (p.fitness - 1) * 15;

  // Age
  if (p.age < 40) score += 10;
  else if (p.age < 55) score += 0;
  else if (p.age < 65) score -= 10;
  else if (p.age < 75) score -= 18;
  else score -= 25;

  // Recency of last exercise (deconditioning)
  switch (p.lastExercise) {
    case 'this_week':
      score += 10;
      break;
    case 'this_month':
      break;
    case 'few_months':
      score -= 10;
      break;
    case 'over_a_year':
      score -= 20;
      break;
  }

  // Injuries
  const recent = p.injuries.filter((i) => i.status === 'recent').length;
  const ongoing = p.injuries.filter((i) => i.status === 'ongoing').length;
  score -= Math.min(20, recent * 10);
  score -= Math.min(10, ongoing * 5);

  return clamp(Math.round(score), 5, 100);
}

/** Maps capacity to the highest exercise difficulty (1–5) to start with. */
export function maxDifficulty(capacity: number): number {
  if (capacity < 25) return 1;
  if (capacity < 45) return 2;
  if (capacity < 65) return 3;
  if (capacity < 85) return 4;
  return 5;
}

/**
 * Areas that must be fully protected (recent injuries) vs areas that may only
 * be loaded with gentle (difficulty ≤ 2) exercises (ongoing issues or pain
 * reported in previous sessions).
 */
export function protectedAreas(
  p: Profile,
  painAreas: BodyArea[] = [],
): { blocked: Set<BodyArea>; gentleOnly: Set<BodyArea> } {
  const blocked = new Set<BodyArea>();
  const gentleOnly = new Set<BodyArea>();
  for (const inj of p.injuries) {
    if (inj.status === 'recent') blocked.add(inj.area);
    else gentleOnly.add(inj.area);
  }
  for (const a of painAreas) if (!blocked.has(a)) gentleOnly.add(a);
  return { blocked, gentleOnly };
}

/** Safety messages to show before starting, based on the profile. */
export function safetyNotes(p: Profile): string[] {
  const notes: string[] = [];
  if (p.age >= 65) {
    notes.push(
      'Because you are 65 or older, consider checking with your doctor before starting a new exercise routine. Keep a sturdy chair or counter nearby for balance.',
    );
  }
  if (p.injuries.some((i) => i.status === 'recent')) {
    notes.push(
      'You have a recent injury. Exercises that load that area have been removed. If you are under the care of a physiotherapist, follow their guidance first.',
    );
  }
  if (p.lastExercise === 'over_a_year' || p.lastExercise === 'few_months') {
    notes.push(
      'It has been a while since you last exercised, so the first sessions are intentionally gentle. They will get harder as you give feedback.',
    );
  }
  return notes;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

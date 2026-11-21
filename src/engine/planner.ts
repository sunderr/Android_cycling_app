import { EXERCISES, getExercise } from '../data/exercises';
import {
  Adaptations,
  BodyArea,
  EMPTY_ADAPTATIONS,
  Exercise,
  PlannedExercise,
  Profile,
  SessionPlan,
  SlotId,
} from '../types';
import { capacityScore, clamp, maxDifficulty, protectedAreas, safetyNotes } from './assessment';

/** Progression chains, easiest first. */
export const SLOTS: Record<SlotId, string[]> = {
  lower: ['sit_to_stand', 'box_squat', 'bodyweight_squat', 'reverse_lunge', 'jump_squat'],
  hip: ['seated_leg_extension', 'glute_bridge', 'single_leg_bridge'],
  push: ['wall_pushup', 'incline_pushup', 'knee_pushup', 'pushup'],
  upper_back: ['shoulder_blade_squeeze', 'wall_angels', 'superman'],
  core: ['dead_bug_seated', 'dead_bug', 'forearm_plank', 'plank_shoulder_tap'],
  balance: ['supported_balance', 'heel_raise'],
};

export const SLOT_LABELS: Record<SlotId, string> = {
  lower: 'squats & lunges',
  hip: 'hip strength',
  push: 'push-ups',
  upper_back: 'upper back',
  core: 'core',
  balance: 'balance',
};

export interface SafetyFilter {
  blocked: Set<BodyArea>;
  gentleOnly: Set<BodyArea>;
  avoid: Set<string>;
}

export function isSafe(ex: Exercise, f: SafetyFilter): boolean {
  if (f.avoid.has(ex.id)) return false;
  for (const area of ex.loads) {
    if (f.blocked.has(area)) return false;
    if (f.gentleOnly.has(area) && ex.difficulty > 2) return false;
  }
  return true;
}

export function buildFilter(profile: Profile, adapt: Adaptations): SafetyFilter {
  const { blocked, gentleOnly } = protectedAreas(profile, adapt.painAreas);
  return { blocked, gentleOnly, avoid: new Set(adapt.avoid) };
}

/**
 * Picks the hardest safe exercise in a slot whose difficulty does not exceed
 * `targetDifficulty`. Falls back to the easiest safe option if none fit.
 */
export function pickFromSlot(
  slot: SlotId,
  targetDifficulty: number,
  filter: SafetyFilter,
): Exercise | undefined {
  const safe = SLOTS[slot].map(getExercise).filter((e) => isSafe(e, filter));
  if (safe.length === 0) return undefined;
  const fitting = safe.filter((e) => e.difficulty <= targetDifficulty);
  return fitting.length ? fitting[fitting.length - 1] : safe[0];
}

export function slotOf(exerciseId: string): SlotId | undefined {
  return (Object.keys(SLOTS) as SlotId[]).find((s) => SLOTS[s].includes(exerciseId));
}

/** Scales reps/seconds for capacity, how hard the exercise is vs. target, and learned feedback. */
export function dose(
  ex: Exercise,
  capacity: number,
  targetDifficulty: number,
  volumeMultiplier = 1,
): Pick<PlannedExercise, 'reps' | 'seconds'> {
  let scale = 0.7 + (capacity / 100) * 0.6; // 0.7 – 1.3
  // If we had to fall back to an exercise harder than target, keep volume low.
  if (ex.difficulty > targetDifficulty) scale *= 0.7;
  scale *= volumeMultiplier;
  const out: Pick<PlannedExercise, 'reps' | 'seconds'> = {};
  if (ex.baseReps) out.reps = Math.max(3, Math.round(ex.baseReps * scale));
  if (ex.baseSeconds) out.seconds = Math.max(10, Math.round((ex.baseSeconds * scale) / 5) * 5);
  return out;
}

export function setsFor(capacity: number): number {
  if (capacity < 30) return 1;
  if (capacity < 60) return 2;
  return 3;
}

export function restFor(profile: Profile, capacity: number): number {
  let rest = capacity < 30 ? 60 : capacity < 60 ? 45 : 30;
  if (profile.age >= 65) rest += 15;
  return rest;
}

export function generatePlan(
  profile: Profile,
  adapt: Adaptations = EMPTY_ADAPTATIONS,
  now: Date = new Date(),
): SessionPlan {
  const capacity = capacityScore(profile);
  const baseLevel = maxDifficulty(capacity);
  const filter = buildFilter(profile, adapt);
  const sets = setsFor(capacity);
  const rest = restFor(profile, capacity);
  const items: PlannedExercise[] = [];
  const notes = safetyNotes(profile);

  // --- Warm-up: always gentle; seated options for low capacity ---
  const warmups = EXERCISES.filter((e) => e.category === 'warmup' && isSafe(e, filter));
  const preferSeated = capacity < 25 || profile.age >= 75;
  const warmPick = warmups
    .filter((e) => (preferSeated ? e.id !== 'march_in_place' : e.id !== 'seated_march'))
    .slice(0, capacity < 30 ? 2 : 3);
  for (const ex of warmPick) {
    items.push({ exerciseId: ex.id, sets: 1, ...dose(ex, capacity, 1), restSeconds: 10 });
  }

  // --- Main block ---
  const slots: SlotId[] = ['lower', 'push', 'hip', 'upper_back', 'core'];
  if (profile.age >= 55 || capacity < 40) slots.push('balance');
  const skipped: SlotId[] = [];
  for (const slot of slots) {
    const target = clamp(baseLevel + (adapt.slotLevel[slot] ?? 0), 1, 5);
    const ex = pickFromSlot(slot, target, filter);
    if (!ex) {
      skipped.push(slot);
      continue;
    }
    items.push({
      exerciseId: ex.id,
      slot,
      sets,
      ...dose(ex, capacity, target, adapt.volume[ex.id] ?? 1),
      restSeconds: rest,
    });
  }
  if (skipped.length) {
    notes.push(
      `Some movement types were skipped to protect your injured or painful areas (${skipped
        .map((s) => SLOT_LABELS[s])
        .join(', ')}).`,
    );
  }

  // --- Cool-down ---
  const cool = EXERCISES.filter((e) => e.category === 'cooldown' && isSafe(e, filter)).slice(0, 3);
  for (const ex of cool) {
    items.push({ exerciseId: ex.id, sets: 1, ...dose(ex, capacity, 1), restSeconds: 5 });
  }

  return { createdAt: now.toISOString(), capacity, items, notes };
}

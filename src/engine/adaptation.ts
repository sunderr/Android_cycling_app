import { getExercise } from '../data/exercises';
import { Adaptations, FeedbackEvent, PlannedExercise, Profile } from '../types';
import { capacityScore, clamp } from './assessment';
import { SLOTS, buildFilter, dose, isSafe, pickFromSlot, slotOf } from './planner';

export interface FeedbackResult {
  items: PlannedExercise[];
  adapt: Adaptations;
  /** True when the session should end immediately. */
  stop: boolean;
  /** Message shown to the user explaining what changed. */
  message: string;
}

/** Pain at or above this (1–10) ends the session. */
export const SEVERE_PAIN = 7;

function cloneAdapt(a: Adaptations): Adaptations {
  return {
    volume: { ...a.volume },
    slotLevel: { ...a.slotLevel },
    avoid: [...a.avoid],
    painAreas: [...a.painAreas],
  };
}

function scaleItem(item: PlannedExercise, factor: number): PlannedExercise {
  return {
    ...item,
    reps: item.reps ? Math.max(3, Math.round(item.reps * factor)) : undefined,
    seconds: item.seconds ? Math.max(10, Math.round((item.seconds * factor) / 5) * 5) : undefined,
  };
}

/**
 * Applies a feedback event to the in-progress session (the item at `index`
 * and the ones after it) and updates the persistent adaptations so future
 * plans reflect it.
 */
export function applyFeedback(
  profile: Profile,
  adaptIn: Adaptations,
  itemsIn: PlannedExercise[],
  index: number,
  event: FeedbackEvent,
): FeedbackResult {
  const adapt = cloneAdapt(adaptIn);
  const items = [...itemsIn];
  const item = items[index];
  const ex = getExercise(item.exerciseId);
  const slot = item.slot ?? slotOf(ex.id);
  const capacity = capacityScore(profile);
  const vol = adapt.volume[ex.id] ?? 1;

  switch (event.kind) {
    case 'just_right':
      return { items, adapt, stop: false, message: 'Great — we’ll keep this level.' };

    case 'too_easy': {
      const filter = buildFilter(profile, adapt);
      const harder = ex.harder ? getExercise(ex.harder) : undefined;
      if (slot && harder && vol >= 1.3 && isSafe(harder, filter)) {
        adapt.slotLevel[slot] = clamp((adapt.slotLevel[slot] ?? 0) + 1, -3, 3);
        items[index] = {
          ...item,
          exerciseId: harder.id,
          ...dose(harder, capacity, harder.difficulty, adapt.volume[harder.id] ?? 1),
        };
        return {
          items,
          adapt,
          stop: false,
          message: `Nice! Moving you up to “${harder.name}”.`,
        };
      }
      adapt.volume[ex.id] = clamp(vol * 1.15, 0.5, 1.6);
      items[index] = scaleItem(item, 1.15);
      return { items, adapt, stop: false, message: 'Adding a little more to this one.' };
    }

    case 'too_hard': {
      const filter = buildFilter(profile, adapt);
      const easier = ex.easier ? getExercise(ex.easier) : undefined;
      if (slot && easier && isSafe(easier, filter)) {
        adapt.slotLevel[slot] = clamp((adapt.slotLevel[slot] ?? 0) - 1, -3, 3);
        items[index] = {
          ...item,
          exerciseId: easier.id,
          ...dose(easier, capacity, easier.difficulty, adapt.volume[easier.id] ?? 1),
          restSeconds: item.restSeconds + 15,
        };
        return {
          items,
          adapt,
          stop: false,
          message: `Let’s switch to an easier version: “${easier.name}”.`,
        };
      }
      adapt.volume[ex.id] = clamp(vol * 0.75, 0.5, 1.6);
      items[index] = { ...scaleItem(item, 0.75), restSeconds: item.restSeconds + 15 };
      return {
        items,
        adapt,
        stop: false,
        message: 'Reducing the reps and giving you more rest.',
      };
    }

    case 'pain': {
      if (!adapt.avoid.includes(ex.id)) adapt.avoid.push(ex.id);
      if (event.painArea && !adapt.painAreas.includes(event.painArea)) {
        adapt.painAreas.push(event.painArea);
      }
      const level = event.painLevel ?? 5;
      if (level >= SEVERE_PAIN) {
        return {
          items,
          adapt,
          stop: true,
          message:
            'Stop exercising now. Rest, and if the pain is sharp, doesn’t settle, or you feel chest pain, dizziness or shortness of breath, seek medical help.',
        };
      }

      // Rebuild the rest of the session around the painful area.
      const filter = buildFilter(profile, adapt);
      if (event.painArea) filter.blocked.add(event.painArea); // protect fully for today
      const rest = items.slice(index + 1).flatMap((it): PlannedExercise[] => {
        const e = getExercise(it.exerciseId);
        if (isSafe(e, filter)) return [it];
        const s = it.slot ?? slotOf(e.id);
        if (!s) return [];
        const alt = pickFromSlot(s, e.difficulty, filter);
        return alt ? [{ ...it, exerciseId: alt.id, ...dose(alt, capacity, e.difficulty) }] : [];
      });

      // Replace the current exercise with a safe alternative, if any.
      let current: PlannedExercise[] = [];
      if (slot) {
        const alt = pickFromSlot(slot, Math.max(1, ex.difficulty - 1), filter);
        if (alt && alt.id !== ex.id && SLOTS[slot].includes(alt.id)) {
          current = [{ ...item, exerciseId: alt.id, ...dose(alt, capacity, alt.difficulty, 0.8) }];
        }
      }
      const next = [...items.slice(0, index), ...current, ...rest];
      return {
        items: next,
        adapt,
        stop: false,
        message: current.length
          ? `Stopped “${ex.name}”. Try the gentler “${getExercise(current[0].exerciseId).name}” instead — stop if it hurts.`
          : `Stopped “${ex.name}”. We’ve removed exercises that load that area for today.`,
      };
    }
  }
}

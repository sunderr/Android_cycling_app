export type BodyArea =
  | 'neck'
  | 'shoulder'
  | 'wrist'
  | 'upper_back'
  | 'lower_back'
  | 'hip'
  | 'knee'
  | 'ankle';

export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  neck: 'Neck',
  shoulder: 'Shoulder',
  wrist: 'Wrist / Elbow',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  hip: 'Hip',
  knee: 'Knee',
  ankle: 'Ankle / Foot',
};

/** Self-reported fitness: 1 = very low, 5 = very fit. */
export type FitnessLevel = 1 | 2 | 3 | 4 | 5;

export type LastExercise = 'this_week' | 'this_month' | 'few_months' | 'over_a_year';

export const LAST_EXERCISE_LABELS: Record<LastExercise, string> = {
  this_week: 'Within the last week',
  this_month: 'Within the last month',
  few_months: '1–6 months ago',
  over_a_year: 'More than 6 months ago',
};

export type InjuryStatus = 'recent' | 'ongoing';

export interface Injury {
  area: BodyArea;
  /** recent = healing (< ~3 months), ongoing = chronic / long-term */
  status: InjuryStatus;
}

export interface Profile {
  name: string;
  age: number;
  fitness: FitnessLevel;
  lastExercise: LastExercise;
  injuries: Injury[];
}

export type Category = 'warmup' | 'main' | 'cooldown';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  /** 1 = very gentle … 5 = demanding */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Body areas this exercise loads; used to avoid injured areas. */
  loads: BodyArea[];
  /** Reps (per set) at difficulty-appropriate baseline, or undefined if timed. */
  baseReps?: number;
  /** Seconds at baseline, for timed exercises. */
  baseSeconds?: number;
  steps: string[];
  /** Short safety cue shown during the exercise. */
  cue: string;
  /** Easier variation id */
  easier?: string;
  /** Harder variation id */
  harder?: string;
}

export interface PlannedExercise {
  exerciseId: string;
  slot?: SlotId;
  sets: number;
  reps?: number;
  seconds?: number;
  restSeconds: number;
}

export interface SessionPlan {
  createdAt: string;
  /** 0–100 capacity score used to generate the plan. */
  capacity: number;
  items: PlannedExercise[];
  notes: string[];
}

export type FeedbackKind = 'too_easy' | 'just_right' | 'too_hard' | 'pain';

export interface FeedbackEvent {
  at: string;
  exerciseId: string;
  kind: FeedbackKind;
  painArea?: BodyArea;
  /** 1–10 when kind === 'pain' */
  painLevel?: number;
}

export type SlotId = 'lower' | 'hip' | 'push' | 'upper_back' | 'core' | 'balance';

/**
 * Persistent learning from feedback, carried into future plans.
 */
export interface Adaptations {
  /** exerciseId -> multiplier applied to reps/seconds (0.5 – 1.6) */
  volume: Record<string, number>;
  /** slot -> level offset relative to the computed level (-3 … +3) */
  slotLevel: Partial<Record<SlotId, number>>;
  /** Exercises that caused pain; excluded from future plans. */
  avoid: string[];
  /** Areas where pain was reported during sessions. */
  painAreas: BodyArea[];
}

export const EMPTY_ADAPTATIONS: Adaptations = {
  volume: {},
  slotLevel: {},
  avoid: [],
  painAreas: [],
};

export interface SessionRecord {
  date: string;
  completed: number;
  total: number;
  feedback: FeedbackEvent[];
  stoppedForPain: boolean;
}

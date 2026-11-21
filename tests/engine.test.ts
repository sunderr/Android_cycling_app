import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getExercise } from '../src/data/exercises';
import { applyFeedback } from '../src/engine/adaptation';
import { capacityScore } from '../src/engine/assessment';
import { SLOTS, generatePlan } from '../src/engine/planner';
import { EMPTY_ADAPTATIONS, Profile } from '../src/types';

const young: Profile = { name: 'A', age: 28, fitness: 5, lastExercise: 'this_week', injuries: [] };
const senior: Profile = { name: 'B', age: 78, fitness: 2, lastExercise: 'over_a_year', injuries: [] };

const mainIds = (p: Profile) =>
  generatePlan(p).items.filter((i) => getExercise(i.exerciseId).category === 'main');

test('all exercise references resolve', () => {
  for (const ids of Object.values(SLOTS)) for (const id of ids) {
    const e = getExercise(id);
    if (e.easier) getExercise(e.easier);
    if (e.harder) getExercise(e.harder);
  }
});

test('fit young person gets a harder plan than a deconditioned senior', () => {
  assert.ok(capacityScore(young) > capacityScore(senior));
  const maxDiff = (p: Profile) => Math.max(...mainIds(p).map((i) => getExercise(i.exerciseId).difficulty));
  assert.ok(maxDiff(young) >= 4);
  assert.equal(maxDiff(senior), 1);
});

test('seniors get balance work and longer rest', () => {
  const items = mainIds(senior);
  assert.ok(items.some((i) => i.slot === 'balance'));
  assert.ok(items.every((i) => i.restSeconds >= 60));
});

test('recent knee injury removes all knee-loading exercises', () => {
  const p: Profile = { ...young, injuries: [{ area: 'knee', status: 'recent' }] };
  for (const it of generatePlan(p).items) {
    assert.ok(!getExercise(it.exerciseId).loads.includes('knee'), it.exerciseId);
  }
});

test('ongoing shoulder issue only allows gentle shoulder exercises', () => {
  const p: Profile = { ...young, injuries: [{ area: 'shoulder', status: 'ongoing' }] };
  for (const it of generatePlan(p).items) {
    const e = getExercise(it.exerciseId);
    if (e.loads.includes('shoulder')) assert.ok(e.difficulty <= 2, e.id);
  }
});

test('"too hard" switches to an easier variation and is remembered', () => {
  const p: Profile = { ...young, fitness: 3, lastExercise: 'this_month' };
  const plan = generatePlan(p);
  const idx = plan.items.findIndex((i) => i.slot === 'lower');
  const before = getExercise(plan.items[idx].exerciseId);
  const r = applyFeedback(p, EMPTY_ADAPTATIONS, plan.items, idx, {
    at: '', exerciseId: before.id, kind: 'too_hard',
  });
  assert.equal(r.items[idx].exerciseId, before.easier);
  assert.equal(r.adapt.slotLevel.lower, -1);
  const next = generatePlan(p, r.adapt).items.find((i) => i.slot === 'lower')!;
  assert.ok(getExercise(next.exerciseId).difficulty < before.difficulty);
});

test('"too easy" adds volume, then progresses to a harder variation', () => {
  const p: Profile = { ...senior };
  let adapt = EMPTY_ADAPTATIONS;
  let items = generatePlan(p).items;
  const idx = items.findIndex((i) => i.slot === 'lower');
  const start = items[idx].exerciseId;
  for (let k = 0; k < 4; k++) {
    const r = applyFeedback(p, adapt, items, idx, { at: '', exerciseId: items[idx].exerciseId, kind: 'too_easy' });
    adapt = r.adapt; items = r.items;
  }
  assert.notEqual(items[idx].exerciseId, start);
});

test('mild pain swaps exercise and protects the area for the rest of the session', () => {
  const plan = generatePlan(young);
  const idx = plan.items.findIndex((i) => i.slot === 'lower');
  const r = applyFeedback(young, EMPTY_ADAPTATIONS, plan.items, idx, {
    at: '', exerciseId: plan.items[idx].exerciseId, kind: 'pain', painArea: 'knee', painLevel: 3,
  });
  assert.equal(r.stop, false);
  assert.ok(r.adapt.avoid.includes(plan.items[idx].exerciseId));
  for (const it of r.items.slice(idx)) assert.ok(!getExercise(it.exerciseId).loads.includes('knee'), it.exerciseId);
  // Future plans keep the painful area gentle and avoid the exercise.
  for (const it of generatePlan(young, r.adapt).items) {
    const e = getExercise(it.exerciseId);
    assert.notEqual(e.id, plan.items[idx].exerciseId);
    if (e.loads.includes('knee')) assert.ok(e.difficulty <= 2);
  }
});

test('severe pain stops the session', () => {
  const plan = generatePlan(young);
  const r = applyFeedback(young, EMPTY_ADAPTATIONS, plan.items, 3, {
    at: '', exerciseId: plan.items[3].exerciseId, kind: 'pain', painArea: 'lower_back', painLevel: 8,
  });
  assert.equal(r.stop, true);
});

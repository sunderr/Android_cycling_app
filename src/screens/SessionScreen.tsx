import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, Chip, H1, H2, Muted, colors } from '../components/ui';
import { getExercise } from '../data/exercises';
import { applyFeedback } from '../engine/adaptation';
import {
  Adaptations,
  BODY_AREA_LABELS,
  BodyArea,
  FeedbackEvent,
  FeedbackKind,
  PlannedExercise,
  Profile,
  SessionPlan,
  SessionRecord,
} from '../types';

type Phase = 'work' | 'rest';

const PAIN_LEVELS = [
  { label: 'Mild — a little discomfort', value: 3 },
  { label: 'Moderate — it hurts', value: 5 },
  { label: 'Severe / sharp', value: 8 },
];

export function SessionScreen({
  profile,
  plan,
  adaptations,
  onAdaptationsChange,
  onFinish,
}: {
  profile: Profile;
  plan: SessionPlan;
  adaptations: Adaptations;
  onAdaptationsChange: (a: Adaptations) => void;
  onFinish: (rec: SessionRecord) => void;
}) {
  useKeepAwake();
  const [items, setItems] = useState<PlannedExercise[]>(plan.items);
  const [index, setIndex] = useState(0);
  const [setNo, setSetNo] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [completed, setCompleted] = useState(0);
  const [painOpen, setPainOpen] = useState(false);
  const [painArea, setPainArea] = useState<BodyArea | null>(null);
  const [stopMessage, setStopMessage] = useState<string | null>(null);
  const adaptRef = useRef(adaptations);
  const restTarget = useRef<{ index: number; setNo: number } | null>(null);

  const item = items[index];
  const ex = item ? getExercise(item.exerciseId) : undefined;

  // Reset the timer whenever the exercise/set/phase changes.
  useEffect(() => {
    if (!item) return;
    if (phase === 'rest') {
      setSecondsLeft(restTarget.current ? restSecondsFor(items[index]) : 0);
      setRunning(true);
    } else {
      setSecondsLeft(item.seconds ?? null);
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, setNo, phase, item?.exerciseId]);

  // Countdown tick
  useEffect(() => {
    if (!running || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (phase === 'work') finishSet();
      else endRest();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft, phase]);

  function restSecondsFor(it: PlannedExercise) {
    return it.restSeconds;
  }

  function finish(stoppedForPain = false, completedCount = completed) {
    onFinish({
      date: new Date().toISOString(),
      completed: completedCount,
      total: items.length,
      feedback,
      stoppedForPain,
    });
  }

  function finishSet() {
    if (!item) return;
    const lastSet = setNo >= item.sets - 1;
    if (lastSet) {
      const done = completed + 1;
      setCompleted(done);
      if (index >= items.length - 1) {
        finish(false, done);
        return;
      }
      restTarget.current = { index: index + 1, setNo: 0 };
    } else {
      restTarget.current = { index, setNo: setNo + 1 };
    }
    if (item.restSeconds > 0) setPhase('rest');
    else endRest();
  }

  function endRest() {
    const target = restTarget.current;
    restTarget.current = null;
    setMessage(null);
    if (target) {
      setIndex(target.index);
      setSetNo(target.setNo);
    }
    setPhase('work');
  }

  function persist(a: Adaptations) {
    adaptRef.current = a;
    onAdaptationsChange(a);
  }

  function give(kind: FeedbackKind, extra: Partial<FeedbackEvent> = {}) {
    if (!item) return;
    const event: FeedbackEvent = {
      at: new Date().toISOString(),
      exerciseId: item.exerciseId,
      kind,
      ...extra,
    };
    setFeedback((f) => [...f, event]);
    const res = applyFeedback(profile, adaptRef.current, items, index, event);
    persist(res.adapt);
    Haptics.selectionAsync().catch(() => {});
    if (res.stop) {
      setRunning(false);
      setStopMessage(res.message);
      return;
    }
    setItems(res.items);
    setMessage(res.message);
    if (kind === 'pain') {
      // Current exercise was replaced or removed; restart at this position.
      setRunning(false);
      if (index >= res.items.length) {
        onFinish({
          date: new Date().toISOString(),
          completed,
          total: res.items.length,
          feedback: [...feedback, event],
          stoppedForPain: true,
        });
        return;
      }
      setSetNo(0);
      setPhase('work');
    }
  }

  function submitPain(level: number) {
    setPainOpen(false);
    give('pain', { painArea: painArea ?? undefined, painLevel: level });
    setPainArea(null);
  }

  function emergencyStop() {
    setPainOpen(false);
    setRunning(false);
    setStopMessage(
      'Stop now and sit or lie down. If you have chest pain, pressure, dizziness, fainting or severe shortness of breath, call your local emergency number immediately.',
    );
  }

  function confirmQuit() {
    Alert.alert('End session?', 'Your progress and feedback so far will be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End session', style: 'destructive', onPress: () => finish(false) },
    ]);
  }

  // ---------- Stopped (pain / safety) ----------
  if (stopMessage) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <H1 style={{ color: colors.danger }}>Session stopped</H1>
        <Card style={{ borderColor: colors.danger, backgroundColor: '#FDECEC' }}>
          <Body>{stopMessage}</Body>
        </Card>
        <Muted style={{ marginBottom: 16 }}>
          We’ve noted this and future sessions will avoid this exercise and be gentler on that area.
          If pain persists for more than a few days, please see a doctor or physiotherapist.
        </Muted>
        <Button label="OK" onPress={() => finish(true)} />
      </ScrollView>
    );
  }

  if (!item || !ex) return null;

  const isRest = phase === 'rest';
  const nextUp = restTarget.current ? items[restTarget.current.index] : undefined;
  const progress = (index + (isRest ? 1 : 0)) / items.length;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Muted>
            Exercise {index + 1} of {items.length}
            {item.sets > 1 ? ` · Set ${setNo + 1} of ${item.sets}` : ''}
          </Muted>
          <Text onPress={confirmQuit} style={styles.quit} accessibilityRole="button">
            End
          </Text>
        </View>

        {message && (
          <Card style={{ backgroundColor: '#EAF3FF', borderColor: colors.primary }}>
            <Body>{message}</Body>
          </Card>
        )}

        {isRest ? (
          <Card style={{ alignItems: 'center' }}>
            <H2>Rest</H2>
            <Text style={styles.timer}>{secondsLeft ?? 0}s</Text>
            {nextUp && (
              <Muted>
                Up next: {getExercise(nextUp.exerciseId).name}
                {restTarget.current && restTarget.current.index === index
                  ? ` (set ${restTarget.current.setNo + 1})`
                  : ''}
              </Muted>
            )}
            <View style={{ height: 12 }} />
            <Button label="Skip rest" variant="secondary" onPress={endRest} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : (
          <>
            <H1>{ex.name}</H1>
            <Card style={{ alignItems: 'center' }}>
              {item.seconds ? (
                <>
                  <Text style={styles.timer}>{secondsLeft ?? item.seconds}s</Text>
                  <Button
                    label={running ? 'Pause' : secondsLeft === item.seconds ? 'Start' : 'Resume'}
                    onPress={() => setRunning(!running)}
                    style={{ alignSelf: 'stretch' }}
                  />
                  <View style={{ height: 8 }} />
                  <Button label="Done" variant="secondary" onPress={finishSet} style={{ alignSelf: 'stretch' }} />
                </>
              ) : (
                <>
                  <Text style={styles.timer}>{item.reps} reps</Text>
                  <Button label="Done with this set" onPress={finishSet} style={{ alignSelf: 'stretch' }} />
                </>
              )}
            </Card>

            <Card>
              <H2>How to</H2>
              {ex.steps.map((s, i) => (
                <Body key={i} style={{ marginBottom: 6 }}>
                  {i + 1}. {s}
                </Body>
              ))}
              <Muted style={{ marginTop: 6 }}>💡 {ex.cue}</Muted>
            </Card>
          </>
        )}
      </ScrollView>

      {!isRest && (
        <View style={styles.feedbackBar}>
          <Muted style={{ textAlign: 'center', marginBottom: 8 }}>How does this feel?</Muted>
          <View style={styles.feedbackRow}>
            <Button label="Too easy" variant="good" onPress={() => give('too_easy')} style={styles.fb} />
            <Button label="Just right" variant="secondary" onPress={() => give('just_right')} style={styles.fb} />
            <Button label="Too hard" variant="warn" onPress={() => give('too_hard')} style={styles.fb} />
          </View>
          <Button
            label="⚠ I feel pain"
            variant="danger"
            onPress={() => {
              setRunning(false);
              setPainArea(ex.loads[0] ?? null);
              setPainOpen(true);
            }}
            accessibilityHint="Stops this exercise and adjusts your session"
          />
        </View>
      )}

      <Modal visible={painOpen} animationType="slide" transparent onRequestClose={() => setPainOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <ScrollView>
              <H2>Where do you feel pain?</H2>
              <View style={styles.wrap}>
                {(Object.keys(BODY_AREA_LABELS) as BodyArea[]).map((a) => (
                  <Chip
                    key={a}
                    label={BODY_AREA_LABELS[a]}
                    selected={painArea === a}
                    onPress={() => setPainArea(a)}
                  />
                ))}
              </View>
              <H2 style={{ marginTop: 12 }}>How bad is it?</H2>
              {PAIN_LEVELS.map((p) => (
                <Button
                  key={p.value}
                  label={p.label}
                  variant={p.value >= 7 ? 'danger' : 'secondary'}
                  onPress={() => submitPain(p.value)}
                  style={{ marginBottom: 8 }}
                />
              ))}
              <Button
                label="Chest pain, dizziness or can’t breathe"
                variant="danger"
                onPress={emergencyStop}
                style={{ marginTop: 8, marginBottom: 8 }}
              />
              <Button label="Cancel" variant="secondary" onPress={() => setPainOpen(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quit: { color: colors.danger, fontSize: 16, fontWeight: '700', padding: 4 },
  timer: { fontSize: 56, fontWeight: '800', color: colors.text, marginVertical: 12, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, backgroundColor: colors.border },
  progressFill: { height: 6, backgroundColor: colors.primary },
  feedbackBar: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  feedbackRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  fb: { flex: 1, paddingHorizontal: 6, minHeight: 52 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});

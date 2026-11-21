import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, H1, H2, Muted, colors } from '../components/ui';
import { getExercise } from '../data/exercises';
import { BODY_AREA_LABELS, Profile, SessionPlan, SessionRecord } from '../types';

function describe(reps?: number, seconds?: number) {
  return reps ? `${reps} reps` : `${seconds}s`;
}

export function HomeScreen({
  profile,
  plan,
  history,
  painAreas,
  onStart,
  onEditProfile,
}: {
  profile: Profile;
  plan: SessionPlan;
  history: SessionRecord[];
  painAreas: string[];
  onStart: () => void;
  onEditProfile: () => void;
}) {
  const mins = Math.round(
    plan.items.reduce(
      (t, it) => t + it.sets * ((it.seconds ?? (it.reps ?? 0) * 4) + it.restSeconds),
      0,
    ) / 60,
  );
  const last = history[history.length - 1];
  const level =
    plan.capacity < 25
      ? 'Gentle'
      : plan.capacity < 45
        ? 'Easy'
        : plan.capacity < 65
          ? 'Moderate'
          : plan.capacity < 85
            ? 'Challenging'
            : 'Advanced';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1>{profile.name ? `Hi ${profile.name}` : 'Today’s session'}</H1>
      <Muted>
        {level} level · about {mins} min · {plan.items.length} exercises
      </Muted>
      {last && (
        <Muted style={{ marginTop: 4 }}>
          Last session: {new Date(last.date).toLocaleDateString()} — {last.completed}/{last.total}{' '}
          done{last.stoppedForPain ? ' (stopped for pain)' : ''}
        </Muted>
      )}

      <View style={{ height: 16 }} />

      {plan.notes.map((n, i) => (
        <Card key={i} style={{ borderColor: colors.warn, backgroundColor: '#FFF8EC' }}>
          <Body>{n}</Body>
        </Card>
      ))}
      {painAreas.length > 0 && (
        <Card style={{ borderColor: colors.warn, backgroundColor: '#FFF8EC' }}>
          <Body>
            You reported pain in:{' '}
            {painAreas.map((a) => BODY_AREA_LABELS[a as keyof typeof BODY_AREA_LABELS]).join(', ')}
            . Only gentle exercises load these areas now.
          </Body>
        </Card>
      )}

      <Card>
        <H2>Plan</H2>
        {plan.items.map((it, i) => {
          const ex = getExercise(it.exerciseId);
          return (
            <View key={i} style={styles.row}>
              <Text style={styles.tag}>
                {ex.category === 'warmup' ? 'Warm-up' : ex.category === 'cooldown' ? 'Cool-down' : 'Main'}
              </Text>
              <Text style={styles.name}>{ex.name}</Text>
              <Text style={styles.dose}>
                {it.sets > 1 ? `${it.sets} × ` : ''}
                {describe(it.reps, it.seconds)}
              </Text>
            </View>
          );
        })}
      </Card>

      <Button label="Start session" onPress={onStart} />
      <View style={{ height: 12 }} />
      <Button label="Update my profile" variant="secondary" onPress={onEditProfile} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tag: { width: 86, fontSize: 13, color: colors.muted },
  name: { flex: 1, fontSize: 16, color: colors.text },
  dose: { fontSize: 15, color: colors.muted, fontVariant: ['tabular-nums'] },
});

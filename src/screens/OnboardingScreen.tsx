import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Card, Chip, H1, H2, Muted, colors } from '../components/ui';
import {
  BODY_AREA_LABELS,
  BodyArea,
  FitnessLevel,
  Injury,
  InjuryStatus,
  LAST_EXERCISE_LABELS,
  LastExercise,
  Profile,
} from '../types';

const FITNESS_LABELS: Record<FitnessLevel, string> = {
  1: 'Very low — daily tasks tire me',
  2: 'Low — I walk a little',
  3: 'Moderate — I’m fairly active',
  4: 'Good — I exercise regularly',
  5: 'Very fit — I train hard',
};

export function OnboardingScreen({
  initial,
  onDone,
}: {
  initial?: Profile | null;
  onDone: (p: Profile) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [fitness, setFitness] = useState<FitnessLevel | null>(initial?.fitness ?? null);
  const [last, setLast] = useState<LastExercise | null>(initial?.lastExercise ?? null);
  const [injuries, setInjuries] = useState<Injury[]>(initial?.injuries ?? []);
  const [ack, setAck] = useState(!!initial);

  const ageNum = parseInt(age, 10);
  const ageValid = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 110;
  const canSave = ageValid && fitness !== null && last !== null && ack;

  const injuryFor = (a: BodyArea) => injuries.find((i) => i.area === a);
  const cycleInjury = (area: BodyArea) => {
    // none -> recent -> ongoing -> none
    const cur = injuryFor(area);
    const next: InjuryStatus | null = !cur ? 'recent' : cur.status === 'recent' ? 'ongoing' : null;
    setInjuries((prev) => {
      const rest = prev.filter((i) => i.area !== area);
      return next ? [...rest, { area, status: next }] : rest;
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <H1>{initial ? 'Update your profile' : 'Let’s get to know you'}</H1>
      <Muted style={{ marginBottom: 16 }}>
        We use this to choose exercises that match your ability. You can change it any time.
      </Muted>

      <Card>
        <H2>Your name (optional)</H2>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sam"
          accessibilityLabel="Your name"
        />
        <H2 style={{ marginTop: 12 }}>Age</H2>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="e.g. 52"
          maxLength={3}
          accessibilityLabel="Your age"
        />
        {age.length > 0 && !ageValid && (
          <Text style={styles.error}>Please enter an age between 13 and 110.</Text>
        )}
      </Card>

      <Card>
        <H2>How fit do you feel right now?</H2>
        {([1, 2, 3, 4, 5] as FitnessLevel[]).map((lvl) => (
          <Chip
            key={lvl}
            label={FITNESS_LABELS[lvl]}
            selected={fitness === lvl}
            onPress={() => setFitness(lvl)}
          />
        ))}
      </Card>

      <Card>
        <H2>When did you last exercise?</H2>
        <View style={styles.wrap}>
          {(Object.keys(LAST_EXERCISE_LABELS) as LastExercise[]).map((k) => (
            <Chip
              key={k}
              label={LAST_EXERCISE_LABELS[k]}
              selected={last === k}
              onPress={() => setLast(k)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <H2>Any injuries or pain?</H2>
        <Muted style={{ marginBottom: 10 }}>
          Tap an area once for a <Text style={{ fontWeight: '700' }}>recent</Text> injury (still
          healing), twice for an <Text style={{ fontWeight: '700' }}>ongoing</Text> issue, three
          times to clear.
        </Muted>
        <View style={styles.wrap}>
          {(Object.keys(BODY_AREA_LABELS) as BodyArea[]).map((a) => {
            const inj = injuryFor(a);
            const suffix = inj ? (inj.status === 'recent' ? ' · recent' : ' · ongoing') : '';
            return (
              <Chip
                key={a}
                label={BODY_AREA_LABELS[a] + suffix}
                selected={!!inj}
                onPress={() => cycleInjury(a)}
              />
            );
          })}
        </View>
      </Card>

      <Card style={{ borderColor: colors.warn }}>
        <H2>Safety first</H2>
        <Body>
          This app gives general guidance, not medical advice. Stop immediately and seek help if
          you feel chest pain, dizziness, faintness, severe shortness of breath, or sharp pain.
          If you have a heart condition, are pregnant, or are recovering from surgery, check with
          your doctor before starting.
        </Body>
        <View style={{ marginTop: 12 }}>
          <Chip
            label={ack ? '✓ I understand' : 'Tap to confirm you understand'}
            selected={ack}
            onPress={() => setAck(!ack)}
          />
        </View>
      </Card>

      <Button
        label={initial ? 'Save changes' : 'Build my plan'}
        disabled={!canSave}
        onPress={() =>
          canSave &&
          onDone({
            name: name.trim(),
            age: ageNum,
            fitness: fitness!,
            lastExercise: last!,
            injuries,
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.danger, marginTop: 6, fontSize: 15 },
});

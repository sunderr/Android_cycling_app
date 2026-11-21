import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Body, Button, Card, H1, H2, Muted } from '../components/ui';
import { getExercise } from '../data/exercises';
import { SessionRecord } from '../types';

const LABEL = {
  too_easy: 'Too easy',
  just_right: 'Just right',
  too_hard: 'Too hard',
  pain: 'Pain',
} as const;

export function SummaryScreen({ record, onDone }: { record: SessionRecord; onDone: () => void }) {
  const allDone = record.completed >= record.total && !record.stoppedForPain;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1>{allDone ? 'Session complete 🎉' : 'Session saved'}</H1>
      <Muted style={{ marginBottom: 16 }}>
        You completed {record.completed} of {record.total} exercises.
      </Muted>

      {record.feedback.length > 0 && (
        <Card>
          <H2>Your feedback</H2>
          {record.feedback.map((f, i) => (
            <Body key={i}>
              • {getExercise(f.exerciseId).name}: {LABEL[f.kind]}
            </Body>
          ))}
          <Muted style={{ marginTop: 8 }}>Your next session has been adjusted using this feedback.</Muted>
        </Card>
      )}

      <Card>
        <H2>Recovery tips</H2>
        <Body>• Drink some water and keep moving gently for a few minutes.</Body>
        <Body>• Mild muscle soreness for 1–2 days is normal; sharp or joint pain is not.</Body>
        <Body>• Aim for a rest day between sessions when you’re starting out.</Body>
      </Card>

      <Button label="Back to home" onPress={onDone} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { padding: 16, paddingBottom: 48 } });

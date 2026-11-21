import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export const colors = {
  bg: '#F6F8FB',
  card: '#FFFFFF',
  text: '#16202C',
  muted: '#5B6675',
  primary: '#1E6FD9',
  primaryText: '#FFFFFF',
  border: '#D8DEE6',
  good: '#1F9D55',
  warn: '#C77700',
  danger: '#C62828',
  chip: '#E8EEF6',
};

type Variant = 'primary' | 'secondary' | 'danger' | 'good' | 'warn';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}) {
  const bg =
    variant === 'secondary'
      ? colors.card
      : variant === 'danger'
        ? colors.danger
        : variant === 'good'
          ? colors.good
          : variant === 'warn'
            ? colors.warn
            : colors.primary;
  const fg = variant === 'secondary' ? colors.text : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        variant === 'secondary' && styles.buttonOutline,
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}
export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.border },
  buttonText: { fontSize: 18, fontWeight: '700' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.chip,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#DCEAFE', borderColor: colors.primary },
  chipText: { fontSize: 16, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  body: { fontSize: 17, color: colors.text, lineHeight: 24 },
  muted: { fontSize: 15, color: colors.muted, lineHeight: 21 },
});

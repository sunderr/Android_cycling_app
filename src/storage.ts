import AsyncStorage from '@react-native-async-storage/async-storage';
import { Adaptations, EMPTY_ADAPTATIONS, Profile, SessionRecord } from './types';

const KEYS = {
  profile: 'fit.profile.v1',
  adapt: 'fit.adaptations.v1',
  history: 'fit.history.v1',
};

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadProfile: () => read<Profile | null>(KEYS.profile, null),
  saveProfile: (p: Profile) => write(KEYS.profile, p),
  loadAdaptations: () => read<Adaptations>(KEYS.adapt, EMPTY_ADAPTATIONS),
  saveAdaptations: (a: Adaptations) => write(KEYS.adapt, a),
  loadHistory: () => read<SessionRecord[]>(KEYS.history, []),
  saveHistory: (h: SessionRecord[]) => write(KEYS.history, h),
  resetAll: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};

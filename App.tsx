import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/components/ui';
import { generatePlan } from './src/engine/planner';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { storage } from './src/storage';
import { Adaptations, EMPTY_ADAPTATIONS, Profile, SessionRecord } from './src/types';

type Route =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'session' }
  | { name: 'summary'; record: SessionRecord };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'loading' });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adapt, setAdapt] = useState<Adaptations>(EMPTY_ADAPTATIONS);
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    (async () => {
      const [p, a, h] = await Promise.all([
        storage.loadProfile(),
        storage.loadAdaptations(),
        storage.loadHistory(),
      ]);
      setProfile(p);
      setAdapt(a);
      setHistory(h);
      setRoute(p ? { name: 'home' } : { name: 'onboarding' });
    })();
  }, []);

  // Re-plan whenever the profile or learned adaptations change. A running
  // session keeps its own copy of the items, so this doesn't disrupt it.
  const plan = useMemo(() => (profile ? generatePlan(profile, adapt) : null), [profile, adapt]);

  const saveProfile = async (p: Profile) => {
    setProfile(p);
    await storage.saveProfile(p);
    setRoute({ name: 'home' });
  };

  const updateAdapt = (a: Adaptations) => {
    setAdapt(a);
    storage.saveAdaptations(a);
  };

  const finishSession = async (rec: SessionRecord) => {
    const h = [...history, rec].slice(-100);
    setHistory(h);
    await storage.saveHistory(h);
    // Completing a session means they exercised "this week".
    if (profile && profile.lastExercise !== 'this_week') {
      const p = { ...profile, lastExercise: 'this_week' as const };
      setProfile(p);
      storage.saveProfile(p);
    }
    setRoute({ name: 'summary', record: rec });
  };

  let screen: React.ReactNode = null;
  if (route.name === 'loading') {
    screen = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (route.name === 'onboarding' || !profile || !plan) {
    screen = (
      <OnboardingScreen initial={profile} onDone={saveProfile} />
    );
  } else if (route.name === 'home') {
    screen = (
      <HomeScreen
        profile={profile}
        plan={plan}
        history={history}
        painAreas={adapt.painAreas}
        onStart={() => setRoute({ name: 'session' })}
        onEditProfile={() => setRoute({ name: 'onboarding' })}
      />
    );
  } else if (route.name === 'session') {
    screen = (
      <SessionScreen
        profile={profile}
        plan={plan}
        adaptations={adapt}
        onAdaptationsChange={updateAdapt}
        onFinish={finishSession}
      />
    );
  } else if (route.name === 'summary') {
    screen = <SummaryScreen record={route.record} onDone={() => setRoute({ name: 'home' })} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {screen}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

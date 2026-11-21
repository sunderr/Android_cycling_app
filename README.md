# FitGuide

A cross-platform (iPhone + Android) app that guides a person through an exercise
session tailored to their **age**, **fitness**, **injuries** and **how recently they
last exercised** — and adapts live to **"Too easy" / "Too hard" / "Pain"** feedback.

Built with [Expo](https://expo.dev) (React Native + TypeScript), so one codebase runs on both platforms.

## Run it

```bash
npm install
npx expo start        # scan the QR code with the Expo Go app on your phone
```

Run tests and type checks:

```bash
npm test              # personalization engine unit tests
npm run typecheck
```

Store builds (no Mac/Android Studio needed): `npx eas-cli@latest build --platform all`.

## How personalization works

1. **Capacity score (0–100)** — `src/engine/assessment.ts`
   | Factor | Effect |
   |---|---|
   | Self-rated fitness 1–5 | 20 → 80 base |
   | Age | +10 (<40) … −25 (75+) |
   | Last exercise | +10 (this week) … −20 (>6 months) |
   | Recent / ongoing injuries | −10 / −5 each (capped) |

2. **Plan generation** — `src/engine/planner.ts`
   - Capacity picks the starting difficulty (1–5) in each movement **progression chain**
     (e.g. sit-to-stand → chair squat → squat → lunge → jump squat).
   - **Recent injury** → every exercise loading that area is removed.
     **Ongoing injury** (or pain reported before) → only gentle (level ≤ 2) exercises may load it.
   - Sets, reps/time and rest scale with capacity; 65+ get extra rest; 55+ or low capacity get balance work.
   - Every session has a warm-up and cool-down.

3. **Live feedback** — `src/engine/adaptation.ts`
   | Button | What happens now | What's remembered |
   |---|---|---|
   | Too easy | +15% reps/time; after repeated "too easy" moves to the harder variation | volume ↑, level ↑ |
   | Just right | nothing | — |
   | Too hard | switches to the easier variation (or −25% reps, +15s rest) | level ↓ |
   | Pain (mild/moderate) | stops the exercise, swaps to a gentler one, removes anything loading that area for the rest of the session | exercise avoided; area kept gentle |
   | Pain (severe) or chest pain / dizziness | **ends the session** with safety advice | same |

All data stays on the device (AsyncStorage).

## Safety

The app shows a medical disclaimer during onboarding, recommends a doctor check for
65+ and recent injuries, and stops the session on severe pain. It is general guidance,
**not** medical advice — have a physiotherapist or clinician review the exercise
library and thresholds before releasing it publicly.

## Project layout

```
App.tsx                     route state machine + persistence
src/types.ts                domain types
src/data/exercises.ts       exercise library + progression links
src/engine/                 pure, tested personalization logic
src/screens/                Onboarding, Home, Session, Summary
src/components/ui.tsx       large, accessible buttons/cards
tests/engine.test.ts        engine tests
```

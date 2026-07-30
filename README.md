# DuoWindo6601 🦉📚

**DuoWindo6601** is a gamified language-learning app for Android, built as a
**100% native, 100% offline** Kotlin + Jetpack Compose application.

Pick a course (Spanish, French, German or Italian), tap through a Duolingo-style
learning path, answer exercises, keep your hearts, build a streak, earn gems,
and climb the leaderboard — all without an account, a server, or an internet
connection.

## ✨ Features

- 🗺️ **Learning path** with units, zig-zag lesson nodes, lock/unlock progression
- ✍️ **Three exercise types**: pick the translation, pick the meaning, and
  build-the-sentence word banks (generated locally from bundled course content)
- ❤️ **Hearts** that cost mistakes and refill over time (offline timer)
- ⚡ **XP, levels and 🔥 streaks** with an optional streak freeze
- 💎 **Gems and a shop**: heart refills, streak freezes, double-XP boosts
- 🏆 **Offline leaderboard** with built-in rivals to compete against
- 🥇 **Achievements and a word collection** on your profile
- 🔊 **On-device pronunciation** via Android text-to-speech
- 💾 **Local persistence** (SharedPreferences + JSON): progress survives restarts
- 🚫 **No `INTERNET` permission** in the manifest at all

## 🧱 Tech stack

| Area             | Choice                                   |
| ---------------- | ---------------------------------------- |
| Language         | Kotlin 2.0                                |
| UI               | Jetpack Compose + Material 3 (light)      |
| Architecture     | Single activity, single module, ViewModel |
| Local storage    | SharedPreferences + `org.json`            |
| Min / Target SDK | 23 / 34                                   |
| Network          | **None — fully offline**                  |

## 🚀 Building

Open the repository folder directly in **Android Studio** (Hedgehog or newer),
let Gradle sync, then Run ▶ on a device or emulator.

From the command line:

```bash
./gradlew assembleDebug
```

The debug APK is produced at:

```
app/build/outputs/apk/debug/app-debug.apk
```

GitHub Actions (`.github/workflows/build.yml`) also builds the APK on every push
to `main` and publishes it as a downloadable artifact. If you want CI builds on
every branch and on demand, replace the workflow with:

```yaml
name: Build APK

on:
  push:
    branches: [ main, 'arena/**' ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: android-actions/setup-android@v3
      - run: sdkmanager "platforms;android-34" "build-tools;34.0.0"
      - uses: gradle/actions/setup-gradle@v4
      - run: chmod +x gradlew && ./gradlew assembleDebug --stacktrace
      - uses: actions/upload-artifact@v4
        with:
          name: duowindo6601-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
```

## 📁 Project structure

```
app/src/main/java/com/duowindo6601/app/
├── MainActivity.kt            # single activity
├── AppRoot.kt                 # navigation + bottom bar
├── data/
│   ├── Models.kt              # user progress + course models
│   ├── CourseContent.kt       # all bundled offline course content
│   ├── Exercises.kt           # exercise definitions + generator
│   └── ProgressStore.kt       # SharedPreferences persistence
├── vm/
│   └── GameViewModel.kt       # all game state and lesson logic
└── ui/
    ├── theme/                 # Material 3 light theme + brand colors
    ├── components/            # mascot, buttons, sound FX, TTS helper
    └── screens/               # splash, onboarding, path, lesson, shop…
```

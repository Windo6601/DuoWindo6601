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
and publishes it as a downloadable artifact.

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

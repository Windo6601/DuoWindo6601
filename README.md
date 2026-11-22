# DuoWindo6601 🦉📱

**DuoWindo6601** is an open-source gamified language learning application designed for both web and mobile platforms. It features an interactive learning path, gamification elements, customizable courses across different regions, and AI-enabled translation exercises.

- **Open Source Repository (GitHub):** [https://github.com/Windo6601/DuoWindo6601](https://github.com/Windo6601/DuoWindo6601)

---

## 🛠️ Project Architecture

This repository is structured as a **hybrid workspace** supporting:
1. **Web (Vite + React + TypeScript)**: The frontend user interface and core application logic.
2. **Mobile (Capacitor / Native Android)**: Built as a fully compliant Android Gradle project, ready for automated builds (e.g. via GitHub Actions) or local testing in Android Studio.

---

## 🚀 Getting Started

### 🌐 Running the Web Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```

### 📱 Building the Android APK
The Android build is configured directly at the root, allowing seamless compilation.
1. Compile the web bundle:
   ```bash
   npm run build
   ```
2. Sync compiled assets into the Android native module:
   ```bash
   npm run cap:sync
   ```
3. Build the Debug APK using Gradle:
   ```bash
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at:  
   `app/build/outputs/apk/debug/app-debug.apk`

---

## 🏛️ Continuous Integration
Automatic builds are configured via GitHub Actions in `.github/workflows/build.yml`. Every push to the `main` branch compiles the web code, bundles it with Capacitor, and publishes a downloadable `app-debug.apk` artifact.

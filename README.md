# DuoWindo6601 🦉📱

DuoWindo6601 is a gamified language learning application designed for both web and mobile platforms. It features an interactive learning path, gamification elements, customizable courses across different regions, and AI-enabled translation exercises.

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
The Android Gradle project lives in `android/`.
1. Compile the web bundle:
   ```bash
   npm run build
   ```
2. Sync compiled assets and native Capacitor plugins into `android/`:
   ```bash
   npm run cap:sync
   ```
3. Build the Debug APK using Gradle (requires JDK 21 and Android SDK):
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   The compiled APK will be located at:  
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🏛️ Continuous Integration
Automatic builds are configured via GitHub Actions in `.github/workflows/build.yml`. Every push to the `main` branch compiles the web code, bundles it with Capacitor, and publishes a downloadable `app-debug.apk` artifact.

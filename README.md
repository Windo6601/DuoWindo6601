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
The Android build is configured directly at the root, allowing seamless compilation.
1. Compile the web bundle:
   ```bash
   npm run build
   ```
2. Sync compiled assets into the Android native module:
   ```bash
   npm run cap:sync
   ```
   > The GitHub Actions workflow additionally copies the freshly built `dist/`
   > into the root `app/src/main/assets/public/` directory, which is the module
   > Gradle actually compiles. When building locally, run the web build + sync
   > first so the APK contains the latest assets.
3. Build the Debug APK using Gradle (requires **JDK 21**, as required by Capacitor 8):
   ```bash
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at:  
   `app/build/outputs/apk/debug/app-debug.apk`

---

## 🔐 Camera, Microphone & API key

- **Permissions:** `android/app/src/main/AndroidManifest.xml` (and the root
  `app/src/main/AndroidManifest.xml`) declare `INTERNET`, `RECORD_AUDIO`,
  `MODIFY_AUDIO_SETTINGS` and `CAMERA`. Capacitor's WebView automatically
  requests and grants the camera/microphone at runtime the first time an AI
  feature (video call, voice input, speech recognition, TTS) needs them.
- **Gemini API key:** the key is stored in the committed `.env` file. At build
  time Vite injects it into the bundle as `process.env.API_KEY` (see
  `vite.config.ts`), so the packaged APK can call the Gemini API out of the box
  without any runtime configuration or CI secrets.

  > ⚠️ Because the key is embedded client-side, anyone who downloads the APK can
  > extract it. Keep the key restricted in Google AI Studio and proxy requests
  > through a backend for production use.

---

## 🏛️ Continuous Integration
Automatic builds are configured via GitHub Actions in `.github/workflows/build.yml`. Every push to the `main` branch (and every pull request) compiles the web code with the embedded Gemini key, copies it into the native module, builds it with Gradle (JDK 21) and publishes a downloadable `duoWindo6601-debug-apk` artifact (the APK file `app-debug.apk`) under the workflow run's **Artifacts** section.

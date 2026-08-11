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
2. Optional: provide a Gemini key for AI features when compiling the web bundle:
   ```bash
   export GEMINI_API_KEY=your_key_here
   ```
3. Sync compiled assets into the Android native module:
   ```bash
   npm run cap:sync
   ```
4. Build the Debug APK using Gradle:
   ```bash
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at:  
   `app/build/outputs/apk/debug/app-debug.apk`

---

## 🏛️ Continuous Integration
Automatic builds are configured via GitHub Actions in `.github/workflows/build.yml`. Every push or pull request to `main`/`master` compiles the web code, bundles it with Capacitor, builds the debug APK, and publishes a downloadable `app-debug-apk` artifact. Add a repository secret named `GEMINI_API_KEY` so AI features are available in the built app without committing a key to source control.

# Руководство по запуску DuoWindo6601 на Android 📱

Приложение DuoWindo6601 настроено для работы на Android с использованием **Capacitor** — современного, высокопроизводительного решения от создателей Ionic для преобразования веб-приложений на React/Vite в полноценные нативные мобильные приложения.

---

## 🛠️ Системные требования
1. **Node.js** (версии 18 или новее)
2. **Android Studio** (с установленным Android SDK и виртуальным устройством/эмулятором)
3. Установленный **Java Development Kit (JDK)** 17 (требуется для сборки Android проектов)

---

## 🚀 Пошаговая инструкция по сборке для Android

### Шаг 1: Компиляция веб-версии
Для начала скомпилируйте веб-приложение в оптимизированный статический билд. Команда сгенерирует файлы в папку `dist/`:
```bash
npm run build
```

### Шаг 2: Инициализация Android-платформы (выполняется один раз)
Если вы запускаете сборку впервые, добавьте платформу Android в проект:
```bash
npm run cap:add-android
```
Эта команда создаст нативную папку `android/` в корне проекта.

### Шаг 3: Синхронизация файлов
Синхронизируйте скомпилированные веб-ресурсы и нативные плагины с Android-приложением:
```bash
npm run cap:sync
```

### Шаг 4: Открытие проекта в Android Studio
Запустите Android Studio и откройте нативный Android проект для сборки APK или запуска на эмуляторе:
```bash
npm run cap:open-android
```

Внутри Android Studio вы можете нажать **Run** (зелёная кнопка воспроизведения), чтобы запустить приложение DuoWindo6601 на подключённом Android-смартфоне или эмуляторе!

---

## 🔒 Разрешения для Android (Камера и Микрофон)

Так как DuoWindo6601 поддерживает **видеозвонки с искусственным интеллектом**, **распознавание речи** и **голосовой ввод**, вам понадобятся разрешения в Android Manifesto. 

Они автоматически настраиваются Capacitor, но убедитесь, что в файле `android/app/src/main/AndroidManifest.xml` (в секции `<manifest>`) присутствуют следующие строки перед тегом `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

---

## 💡 Полезные команды при разработке
- **Обновить только интерфейс:** Если вы изменили код в React, просто запустите:
  ```bash
  npm run build && npm run cap:sync
  ```
- **Live Reload (Живая перезагрузка на телефоне):**
  Вы можете запускать отладку в реальном времени. В `capacitor.config.ts` временно добавьте адрес вашего компьютера:
  ```typescript
  server: {
    url: 'http://192.168.1.XX:3000', // IP вашего ПК в локальной сети
    cleartext: true
  }
  ```

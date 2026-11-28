import { Exercise } from '../types';

export type ProgrammingModuleId = 'lua' | 'swift' | 'android' | 'lifecycle' | 'apk';

export interface ProgrammingStackItem {
  name: string;
  role: string;
  details: string;
}

export interface ProgrammingModule {
  id: ProgrammingModuleId;
  order: string;
  tabLabelRu: string;
  tabLabelEn: string;
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
  overviewRu: string;
  overviewEn: string;
  topicPrompt: string;
  codeTitle: string;
  codeSnippet: string;
  itemsRu: ProgrammingStackItem[];
  itemsEn: ProgrammingStackItem[];
}

export const PROGRAMMING_MODULES: ProgrammingModule[] = [
  {
    id: 'lua',
    order: '01',
    tabLabelRu: 'Lua',
    tabLabelEn: 'Lua',
    titleRu: 'Lua — скрипты для игр и легковесный код',
    titleEn: 'Lua — Game Scripting & Lightweight Code',
    subtitleRu: 'Встраиваемый скриптовый язык для игровых движков, модификаций и расширений приложений',
    subtitleEn: 'Embeddable scripting language for game engines, application extensions, and fast lightweight logic',
    overviewRu:
      'Lua — компактный и быстрый язык сценариев. Он широко используется для написания игровой логики, расширения возможностей готовых программ и создания легковесного кода без тяжёлых зависимостей.',
    overviewEn:
      'Lua is a compact, fast scripting language widely used for game logic, extending host applications, and writing lightweight code with minimal memory overhead.',
    topicPrompt:
      'Lua: написание скриптов для игр, расширение приложений, таблицы, функции и создание легковесного кода',
    codeTitle: 'game_logic.lua',
    codeSnippet: `-- Лёгкий игровой скрипт на Lua
local Player = { name = "Hero", health = 100, xp = 0 }

function Player:takeDamage(amount)
  self.health = math.max(0, self.health - amount)
  print(self.name .. " HP:", self.health)
end

function Player:gainXP(points)
  self.xp = self.xp + points
end

Player:takeDamage(25)
Player:gainXP(40)`,
    itemsRu: [
      {
        name: 'Скрипты для игр',
        role: 'Игровая логика и ИИ',
        details: 'Управление событиями, диалогами NPC, физическими триггерами и пользовательскими модами без перекомпиляции движка.'
      },
      {
        name: 'Расширение приложений',
        role: 'Плагины и аддоны',
        details: 'Лёгкое встраивание в программы на C/C++, настройка интерфейсов, макросов и автоматизация сценариев.'
      },
      {
        name: 'Легковесный код',
        role: 'Минимальный размер и скорость',
        details: 'Единая универсальная структура данных (таблицы), простая читаемость и крошечный размер интерпретатора.'
      }
    ],
    itemsEn: [
      {
        name: 'Game Scripting',
        role: 'Gameplay & AI Logic',
        details: 'Power game events, NPC behavior, triggers, and community mods without recompiling the core engine.'
      },
      {
        name: 'Application Extensions',
        role: 'Plugins & Add-ons',
        details: 'Clean C/C++ embedding API for adding scripting, UI customization, and macros to desktop or server apps.'
      },
      {
        name: 'Lightweight Code',
        role: 'Compact & Fast',
        details: 'Single unified table structure, readable syntax, and minimal runtime footprint.'
      }
    ]
  },
  {
    id: 'swift',
    order: '02',
    tabLabelRu: 'Swift · Apple',
    tabLabelEn: 'Swift · Apple',
    titleRu: 'Swift — разработка приложений для iOS и macOS',
    titleEn: 'Swift — iOS & macOS App Development',
    subtitleRu: 'Единый стек Apple: Swift, Xcode (только на Mac), SwiftUI, UIKit и AppKit',
    subtitleEn: 'Unified Apple ecosystem stack: Swift, Xcode (Mac only), SwiftUI, UIKit, and AppKit',
    overviewRu:
      'Разработка приложений для экосистемы Apple (iOS и macOS) строится на едином стеке технологий, инструментов и принципов. Основной язык — Swift, который почти полностью вытеснил исторический Objective-C.',
    overviewEn:
      'Apple app development (iOS and macOS) relies on a unified stack centered around Swift, which has largely replaced historical Objective-C.',
    topicPrompt:
      'Swift для iOS и macOS, Objective-C, среда Xcode (только на Mac), декларативный SwiftUI и классические UIKit / AppKit',
    codeTitle: 'ContentView.swift (SwiftUI)',
    codeSnippet: `import SwiftUI

struct ContentView: View {
    @State private var lessonCompleted = false

    var body: some View {
        VStack(spacing: 12) {
            Text("DuoWindo6601 · iOS & macOS")
                .font(.headline)
            Button(lessonCompleted ? "Готово" : "Начать урок") {
                lessonCompleted.toggle()
            }
        }
        .padding()
    }
}`,
    itemsRu: [
      {
        name: 'Swift (и Objective-C)',
        role: 'Язык программирования',
        details: 'Swift — современный, безопасный и основной язык для iOS и macOS. Objective-C использовался исторически и сегодня почти полностью вытеснен.'
      },
      {
        name: 'Xcode',
        role: 'Официальная бесплатная IDE',
        details: 'Среда от Apple для написания кода, проектирования интерфейсов и отладки. Важно: работает только на компьютерах Mac.'
      },
      {
        name: 'SwiftUI',
        role: 'Декларативный UI-фреймворк',
        details: 'Позволяет писать общий интерфейс один раз сразу для iOS, macOS, watchOS и tvOS.'
      },
      {
        name: 'UIKit и AppKit',
        role: 'Классические императивные UI',
        details: 'UIKit применяется для сложных и кастомных интерфейсов на iOS, а AppKit — для нативных оконных интерфейсов на macOS.'
      },
      {
        name: 'Формат пакета: .ipa (Apple / iOS не для APK)',
        role: 'Сборка и публикация в Apple',
        details: 'В экосистеме Apple приложения компилируются в пакет .ipa и распространяются через App Store или TestFlight. Файлы APK созданы исключительно для Android и на устройствах Apple не запускаются.'
      }
    ],
    itemsEn: [
      {
        name: 'Swift (vs Objective-C)',
        role: 'Primary Language',
        details: 'Modern, type-safe language for iOS and macOS. Objective-C is legacy and mostly replaced by Swift.'
      },
      {
        name: 'Xcode',
        role: 'Official Free IDE',
        details: 'Apple IDE for coding, UI design, simulators, and debugging. Runs exclusively on Mac computers.'
      },
      {
        name: 'SwiftUI',
        role: 'Declarative UI Framework',
        details: 'Write modern UI code once across iOS, macOS, watchOS, and tvOS.'
      },
      {
        name: 'UIKit & AppKit',
        role: 'Imperative UI Frameworks',
        details: 'UIKit handles intricate custom iOS interfaces; AppKit handles classic macOS desktop interfaces.'
      },
      {
        name: 'Package Format: .ipa (Apple / iOS is not for APK)',
        role: 'Apple Packaging & Distribution',
        details: 'Apple apps are packaged into .ipa archives for the App Store and TestFlight. The .apk format is strictly for Android and is not supported on Apple devices.'
      }
    ]
  },
  {
    id: 'android',
    order: '03',
    tabLabelRu: 'Android · Kotlin',
    tabLabelEn: 'Android · Kotlin',
    titleRu: 'Android: Kotlin, Java, C++ и фреймворки',
    titleEn: 'Android: Kotlin, Java, C++ & Frameworks',
    subtitleRu: 'Android Studio, Gradle, Jetpack Compose, XML, Android NDK, Flutter и React Native',
    subtitleEn: 'Android Studio, Gradle, Jetpack Compose, XML, Android NDK, Flutter, and React Native',
    overviewRu:
      'Современная разработка под Android опирается на Kotlin, Android Studio и Gradle. Java до сих пор поддерживается, C++ используется через Android NDK для игр и графики, а кроссплатформенные Flutter и React Native позволяют создавать приложения сразу для Android и iOS.',
    overviewEn:
      'Google recommends Kotlin with Android Studio and Gradle. Java remains supported, C++ powers heavy workloads via Android NDK, and Flutter or React Native target both Android and iOS.',
    topicPrompt:
      'Android разработка: Kotlin, Java, C++ Android NDK, Android Studio, Gradle, Jetpack Compose, XML, Flutter (Dart), React Native (JS)',
    codeTitle: 'MainActivity.kt (Jetpack Compose)',
    codeSnippet: `@Composable
fun LessonGreeting(languageName: String) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "Изучаем: $languageName")
        Button(onClick = { /* запуск практики */ }) {
            Text("Открыть урок")
        }
    }
}`,
    itemsRu: [
      {
        name: 'Kotlin',
        role: 'Рекомендуемый Google язык',
        details: 'Современный официальный язык для Android с лаконичным синтаксисом, null-безопасностью и полной поддержкой Jetpack Compose.'
      },
      {
        name: 'Java и C++ (Android NDK)',
        role: 'Классика и высокая производительность',
        details: 'Java — классический язык, постепенно уступающий Kotlin. C++ подключается через Android NDK для движков игр и обработки графики.'
      },
      {
        name: 'Android Studio + Gradle',
        role: 'Главная IDE от Google',
        details: 'Включает систему сборки Gradle, виртуальные эмуляторы, инспектор макетов и инструменты профилирования.'
      },
      {
        name: 'Jetpack Compose и XML',
        role: 'UI-фреймворки Android',
        details: 'Jetpack Compose — современный декларативный подход на Kotlin; XML — классическая разметка экранов.'
      },
      {
        name: 'Flutter (Dart) и React Native (JS)',
        role: 'Кроссплатформенная разработка',
        details: 'Позволяют писать единый код сразу для Android и iOS с высокой скоростью разработки.'
      }
    ],
    itemsEn: [
      {
        name: 'Kotlin',
        role: 'Google Recommended Language',
        details: 'Official modern language for Android with concise syntax and safety guarantees.'
      },
      {
        name: 'Java & C++ (Android NDK)',
        role: 'Legacy & Native Performance',
        details: 'Java remains supported while yielding to Kotlin; C++ via Android NDK handles game engines and graphics.'
      },
      {
        name: 'Android Studio + Gradle',
        role: 'Official Google IDE',
        details: 'Includes Gradle build automation, Android SDK, device emulators, and debugging tools.'
      },
      {
        name: 'Jetpack Compose vs XML',
        role: 'Android UI Frameworks',
        details: 'Declarative UI in Kotlin (Jetpack Compose) alongside classic XML view layouts.'
      },
      {
        name: 'Flutter (Dart) & React Native (JS)',
        role: 'Cross-Platform',
        details: 'Build shared mobile apps for both Android and iOS from one codebase.'
      }
    ]
  },
  {
    id: 'lifecycle',
    order: '04',
    tabLabelRu: 'Этапы создания',
    tabLabelEn: 'App Lifecycle',
    titleRu: 'Основные 5 этапов создания приложения',
    titleEn: '5 Core Stages of App Creation',
    subtitleRu: 'От постановки задачи и UX/UI-дизайна до тестирования и публикации .aab',
    subtitleEn: 'From UX/UI analysis & SDK setup to testing and .aab release publishing',
    overviewRu:
      'Создание надёжного мобильного приложения проходит пять последовательных этапов: проектирование архитектуры и дизайна, настройка среды и SDK, написание экранов и логики, проверка на эмуляторе или по USB и публикация релизного файла .aab.',
    overviewEn:
      'Building a production mobile app follows five structured stages: UX/UI design, IDE/SDK setup, screen coding and API integration, emulator/USB testing, and .aab release publishing.',
    topicPrompt:
      '5 этапов создания приложения: анализ и UX/UI, Android Studio и SDK, верстка Activity/Composable и API, эмулятор и USB отладка, сборка и публикация .aab',
    codeTitle: 'stages-checklist.txt',
    codeSnippet: `1. Анализ и UX/UI-дизайн  -> макеты и прототипы экранов
2. Настройка среды        -> Android Studio + Android SDK
3. Код и верстка          -> Activity / Composable + API / БД
4. Тестирование           -> Эмулятор Android Studio или USB-отладка
5. Сборка и публикация    -> Android App Bundle (.aab)`,
    itemsRu: [
      {
        name: '1. Анализ и проектирование',
        role: 'UX/UI и архитектура',
        details: 'Постановка задач, сценарии пользователя, создание макетов и интерактивных прототипов.'
      },
      {
        name: '2. Настройка среды',
        role: 'IDE и SDK',
        details: 'Установка Android Studio, скачивание нужных версий Android SDK и системных образов.'
      },
      {
        name: '3. Написание кода и верстка',
        role: 'Activity / Composable',
        details: 'Создание экранов (Activity или Composable-функции), бизнес-логики и привязка к базам данных или API.'
      },
      {
        name: '4. Тестирование',
        role: 'Эмулятор или USB',
        details: 'Проверка работы на виртуальном эмуляторе внутри Android Studio или на реальном смартфоне через режим отладки по USB.'
      },
      {
        name: '5. Сборка и публикация',
        role: 'Android App Bundle (.aab)',
        details: 'Генерация оптимизированного релизного пакета .aab и выгрузка приложения в магазины приложений.'
      }
    ],
    itemsEn: [
      {
        name: '1. Analysis & UX/UI Design',
        role: 'Planning & Prototypes',
        details: 'Define requirements, user flows, wireframes, and visual UX/UI prototypes.'
      },
      {
        name: '2. Environment Setup',
        role: 'Android Studio & SDK',
        details: 'Install Android Studio and configure required Android SDK platforms and build tools.'
      },
      {
        name: '3. Coding & Layout',
        role: 'Activity / Composable & API',
        details: 'Implement screens using Activity or Composable functions and connect databases or APIs.'
      },
      {
        name: '4. Testing',
        role: 'Emulator or USB Debugging',
        details: 'Verify behavior on Android Studio emulators or a physical smartphone via USB debugging.'
      },
      {
        name: '5. Build & Publish',
        role: 'Android App Bundle (.aab)',
        details: 'Generate the release Android App Bundle (.aab) and publish to app stores.'
      }
    ]
  },
  {
    id: 'apk',
    order: '05',
    tabLabelRu: 'Сборка APK',
    tabLabelEn: 'Build APK',
    titleRu: 'Создание и сборка Android APK',
    titleEn: 'Building Debug & Release Android APK',
    subtitleRu: 'build.gradle.kts, Debug (app-debug.apk), Signed Release (.jks), Gradle CLI и конструкторы',
    subtitleEn: 'build.gradle.kts, app-debug.apk, Signed Release (.jks), Gradle CLI, and no-code builders',
    overviewRu:
      'Для получения готового APK-файла используется Android Studio (меню Build для Debug и Signed Release с ключом .jks), командная строка Gradle (./gradlew assembleDebug / assembleRelease) либо визуальные конструкторы без кода вроде Andromo.',
    overviewEn:
      'Generate Android APKs in Android Studio (Build APK / Generate Signed Bundle with .jks KeyStore), via Gradle CLI (./gradlew assembleDebug / assembleRelease), or with visual builders like Andromo.',
    topicPrompt:
      'Сборка APK в Android Studio: build.gradle.kts (package name, версия), Debug app-debug.apk (locate), Release KeyStore .jks alias, ./gradlew assembleDebug / assembleRelease, Windows gradlew, конструктор Andromo',
    codeTitle: 'app/build.gradle.kts & CLI',
    codeSnippet: `android {
    namespace = "com.duowindo.app"
    defaultConfig {
        applicationId = "com.duowindo.app"
        versionCode = 104
        versionName = "1.0.4"
    }
}

# Командная строка Gradle (macOS / Linux):
./gradlew assembleDebug
./gradlew assembleRelease

# Командная строка Windows (без точки):
gradlew assembleDebug
gradlew assembleRelease`,
    itemsRu: [
      {
        name: '1. Настройка build.gradle.kts',
        role: 'Идентификатор и версия',
        details: 'Укажите уникальный package name (applicationId), versionCode и versionName перед сборкой пакета.'
      },
      {
        name: '2. Debug APK (для тестирования)',
        role: 'Build -> Build APK(s)',
        details: 'Выберите Build -> Build Bundle(s) / APK(s) -> Build APK(s). Нажмите на ссылку locate в уведомлении, чтобы открыть app-debug.apk.'
      },
      {
        name: '3. Release APK (.jks KeyStore)',
        role: 'Подписанный релиз',
        details: 'Build -> Generate Signed Bundle / APK... -> APK -> создайте или выберите KeyStore (.jks), введите пароли и alias -> вариант release -> Finish.'
      },
      {
        name: '4. Командная строка и конструкторы',
        role: 'Gradle CLI и Andromo',
        details: 'В терминале используйте ./gradlew assembleDebug или assembleRelease (в Windows: gradlew ...). Для сборки без кода подходят конструкторы вроде Andromo (Flutter / WebView).'
      }
    ],
    itemsEn: [
      {
        name: '1. Configure build.gradle.kts',
        role: 'Package Name & Version',
        details: 'Set applicationId (package name), versionCode, and versionName before assembling.'
      },
      {
        name: '2. Debug APK (Testing)',
        role: 'Build -> Build APK(s)',
        details: 'Use Build -> Build Bundle(s) / APK(s) -> Build APK(s), then click locate in the notification to open app-debug.apk.'
      },
      {
        name: '3. Signed Release APK (.jks)',
        role: 'Generate Signed Bundle / APK',
        details: 'Select APK, choose or create a .jks KeyStore file, enter passwords and alias, pick release, and click Finish.'
      },
      {
        name: '4. Gradle CLI & Builders',
        role: 'gradlew & Andromo',
        details: 'Run ./gradlew assembleDebug or ./gradlew assembleRelease (gradlew on Windows), or use no-code builders like Andromo (Flutter / WebView).'
      }
    ]
  }
];

export const LIFECYCLE_STEPS_DETAIL = [
  {
    step: '01',
    titleRu: 'Анализ и проектирование',
    titleEn: 'Analysis & Design',
    artifact: 'UX/UI макеты и прототипы',
    descRu: 'Постановка целей продукта, карта экранов, проработка UX-сценариев и интерактивных прототипов.',
    descEn: 'Goal definition, screen flows, UX scenarios, and interactive prototypes.'
  },
  {
    step: '02',
    titleRu: 'Настройка среды',
    titleEn: 'Environment Setup',
    artifact: 'Android Studio + Android SDK',
    descRu: 'Установка официальной IDE (Android Studio или Xcode на Mac), загрузка SDK, инструментов сборки и эмуляторов.',
    descEn: 'Installing Android Studio (or Xcode on Mac), SDK platforms, build tools, and virtual devices.'
  },
  {
    step: '03',
    titleRu: 'Написание кода и верстка',
    titleEn: 'Coding & Layout',
    artifact: 'Activity / Composable + API',
    descRu: 'Реализация экранов (Activity / Jetpack Compose / SwiftUI), логики работы и подключение локальных БД или REST API.',
    descEn: 'Implementing Activity / Composable / SwiftUI screens, business logic, databases, and APIs.'
  },
  {
    step: '04',
    titleRu: 'Тестирование',
    titleEn: 'Testing',
    artifact: 'Эмулятор и USB-отладка',
    descRu: 'Проверка интерфейса и логики на виртуальном эмуляторе внутри Android Studio или на реальном смартфоне по USB.',
    descEn: 'Testing on virtual Android Studio emulators or a real smartphone via USB debugging.'
  },
  {
    step: '05',
    titleRu: 'Сборка и публикация',
    titleEn: 'Build & Publishing',
    artifact: 'Android App Bundle (.aab)',
    descRu: 'Генерация подписанного релизного пакета .aab (или APK) и публикация в магазинах приложений.',
    descEn: 'Generating signed release Android App Bundle (.aab) or APK and publishing to stores.'
  }
];

export const APK_BUILD_PRESETS = [
  {
    id: 'debug',
    labelRu: 'Debug APK (Android Studio)',
    labelEn: 'Debug APK (Android Studio)',
    menuPath: 'Build -> Build Bundle(s) / APK(s) -> Build APK(s)',
    configNote: 'Проверка build.gradle.kts (package name и версия)',
    outputFile: 'app/build/outputs/apk/debug/app-debug.apk',
    actionResult: 'Уведомление в правом нижнем углу со ссылкой locate открывает папку с app-debug.apk для быстрого теста.',
    steps: [
      'Проверка package name и версии в build.gradle.kts',
      'Запуск Build -> Build Bundle(s) / APK(s) -> Build APK(s)',
      'Компиляция Kotlin/Java, ресурсов XML/Compose и манифеста',
      'Появление ссылки locate -> готов файл app-debug.apk'
    ]
  },
  {
    id: 'release',
    labelRu: 'Release APK (KeyStore .jks)',
    labelEn: 'Release APK (KeyStore .jks)',
    menuPath: 'Build -> Generate Signed Bundle / APK... -> APK -> release',
    configNote: 'Требуется ключ подписи KeyStore (.jks), пароли и alias',
    outputFile: 'app/release/app-release.apk (Signed)',
    actionResult: 'Android Studio сгенерировал подписанный релизный APK с помощью выбранного .jks KeyStore и псевдонима (alias).',
    steps: [
      'Выбор типа сборки APK в мастере Generate Signed Bundle / APK...',
      'Подключение или создание файла ключа подписи KeyStore (.jks)',
      'Ввод паролей хранилища, ключа и псевдонима (alias)',
      'Выбор build variant: release -> Finish -> подписанный APK готов'
    ]
  },
  {
    id: 'gradle_cli',
    labelRu: 'Командная строка (Gradle)',
    labelEn: 'Command Line (Gradle)',
    menuPath: './gradlew assembleDebug  |  ./gradlew assembleRelease',
    configNote: 'В Windows запускается без точки впереди: gradlew assembleRelease',
    outputFile: 'app/build/outputs/apk/release/app-release-unsigned.apk',
    actionResult: 'Gradle Wrapper выполнил сборку напрямую из терминала проекта без графического меню IDE.',
    steps: [
      'Открытие терминала в корневой папке проекта Android',
      'macOS/Linux: ./gradlew assembleDebug или ./gradlew assembleRelease',
      'Windows: gradlew assembleDebug или gradlew assembleRelease',
      'Завершение задач Gradle и сохранение APK в outputs/apk/'
    ]
  },
  {
    id: 'nocode',
    labelRu: 'Без кода (Andromo)',
    labelEn: 'No-Code Builder (Andromo)',
    menuPath: 'Визуальный конструктор (Flutter / WebView) -> Export APK',
    configNote: 'Создание Android-приложения без ручного написания кода',
    outputFile: 'exported-app-andromo.apk',
    actionResult: 'Визуальный конструктор собрал интерфейс на базе Flutter или WebView и экспортировал готовый APK-файл.',
    steps: [
      'Выбор шаблона и экранов в визуальном конструкторе (например, Andromo)',
      'Настройка контента, дизайна и модулей на базе Flutter или WebView',
      'Автоматическая облачная сборка Android-пакета',
      'Экспорт готового APK-файла для установки на устройство'
    ]
  }
];

interface CodingExerciseSeed {
  moduleId: ProgrammingModuleId;
  difficulty: 'easy' | 'hard';
  origRu: string;
  transRu: string;
  bankRu: string[];
}

const PROGRAMMING_EXERCISES: CodingExerciseSeed[] = [
  {
    moduleId: 'lua',
    difficulty: 'easy',
    origRu: 'Для каких задач чаще всего используют язык программирования Lua?',
    transRu: 'Скрипты для игр',
    bankRu: ['Скрипты', 'для', 'игр', 'Драйверы', 'БИОС', 'Таблицы', 'CSS']
  },
  {
    moduleId: 'lua',
    difficulty: 'hard',
    origRu: 'Какая основная особенность кода на Lua делает его популярным для расширения приложений?',
    transRu: 'Легковесный встраиваемый код',
    bankRu: ['Легковесный', 'встраиваемый', 'код', 'Жёсткая', 'типизация', 'Только', 'macOS']
  },
  {
    moduleId: 'swift',
    difficulty: 'easy',
    origRu: 'Какой язык является основным для разработки приложений под iOS и macOS?',
    transRu: 'Swift',
    bankRu: ['Swift', 'Kotlin', 'Lua', 'Dart']
  },
  {
    moduleId: 'swift',
    difficulty: 'easy',
    origRu: 'На каких компьютерах работает официальная среда разработки Apple Xcode?',
    transRu: 'Только на Mac',
    bankRu: ['Только', 'на', 'Mac', 'Windows', 'Linux', 'Android']
  },
  {
    moduleId: 'swift',
    difficulty: 'hard',
    origRu: 'Какой современный декларативный фреймворк Apple позволяет писать UI один раз для iOS, macOS, watchOS и tvOS?',
    transRu: 'SwiftUI',
    bankRu: ['SwiftUI', 'UIKit', 'AppKit', 'Objective-C']
  },
  {
    moduleId: 'swift',
    difficulty: 'hard',
    origRu: 'Какие два классических императивных фреймворка Apple используют для сложных интерфейсов на iOS и macOS?',
    transRu: 'UIKit и AppKit',
    bankRu: ['UIKit', 'и', 'AppKit', 'Jetpack', 'Compose', 'Gradle']
  },
  {
    moduleId: 'android',
    difficulty: 'easy',
    origRu: 'Какой язык программирования официально рекомендуется Google для разработки под Android?',
    transRu: 'Kotlin',
    bankRu: ['Kotlin', 'Swift', 'Lua', 'Objective-C']
  },
  {
    moduleId: 'android',
    difficulty: 'easy',
    origRu: 'Как называется главная официальная среда разработки (IDE) от Google для Android?',
    transRu: 'Android Studio',
    bankRu: ['Android', 'Studio', 'Xcode', 'Andromo', 'SwiftUI']
  },
  {
    moduleId: 'android',
    difficulty: 'hard',
    origRu: 'Через какой инструмент в Android используется C++ для движков игр и обработки графики?',
    transRu: 'Android NDK',
    bankRu: ['Android', 'NDK', 'SwiftUI', 'KeyStore', 'AppKit']
  },
  {
    moduleId: 'android',
    difficulty: 'hard',
    origRu: 'Какие два популярных кроссплатформенных фреймворка позволяют писать код сразу для Android и iOS?',
    transRu: 'Flutter и React Native',
    bankRu: ['Flutter', 'и', 'React', 'Native', 'AppKit', 'Gradle']
  },
  {
    moduleId: 'lifecycle',
    difficulty: 'easy',
    origRu: 'Какой файл генерируется на 5-м этапе для публикации приложения в магазине Android?',
    transRu: 'Android App Bundle .aab',
    bankRu: ['Android', 'App', 'Bundle', '.aab', '.jks', '.lua']
  },
  {
    moduleId: 'lifecycle',
    difficulty: 'hard',
    origRu: 'Какими двумя способами проверяют приложение на 4-м этапе тестирования?',
    transRu: 'Эмулятор и отладка USB',
    bankRu: ['Эмулятор', 'и', 'отладка', 'USB', 'KeyStore', 'Gradle']
  },
  {
    moduleId: 'apk',
    difficulty: 'easy',
    origRu: 'В каком файле задаются package name и версия Android-приложения перед сборкой?',
    transRu: 'build.gradle.kts',
    bankRu: ['build.gradle.kts', 'app-debug.apk', 'keystore.jks', 'SwiftUI']
  },
  {
    moduleId: 'apk',
    difficulty: 'easy',
    origRu: 'Какое имя имеет готовый тестовый файл после выбора Build -> Build APK(s)?',
    transRu: 'app-debug.apk',
    bankRu: ['app-debug.apk', 'app-release.aab', 'keystore.jks', 'gradlew']
  },
  {
    moduleId: 'apk',
    difficulty: 'hard',
    origRu: 'Какое расширение имеет файл ключа подписи KeyStore для сборки Release APK?',
    transRu: '.jks',
    bankRu: ['.jks', '.aab', '.lua', '.kts']
  },
  {
    moduleId: 'apk',
    difficulty: 'hard',
    origRu: 'Какая команда запускает сборку релизного APK через Gradle в терминале (macOS/Linux)?',
    transRu: './gradlew assembleRelease',
    bankRu: ['./gradlew', 'assembleRelease', 'assembleDebug', 'Xcode', 'Andromo']
  }
];

export const getRandomProgrammingFallbackExercise = (
  topic: string,
  difficultyLevel: 'easy' | 'hard' = 'easy'
): Exercise => {
  const filtered = PROGRAMMING_EXERCISES.filter(ex => ex.difficulty === difficultyLevel);
  const pool = filtered.length > 0 ? filtered : PROGRAMMING_EXERCISES;
  const seed = pool[Math.floor(Math.random() * pool.length)] || PROGRAMMING_EXERCISES[0];
  const bank = [...seed.bankRu].sort(() => Math.random() - 0.5);
  return {
    id: crypto.randomUUID(),
    type: 'translation',
    originalSentence: seed.origRu,
    targetTranslation: seed.transRu,
    wordBank: bank,
    isFallback: true,
    difficultyLevel
  };
};

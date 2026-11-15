/**
 * Sound Illusion & Psychoacoustic Service for DuoWindo6601
 * Provides Web Audio API synthesizers and phonetic ambiguity data for:
 * 1. "Звуковая Иллюзия: ЧТО РЕАЛЬНО, А ЧТО НЕТ?"
 * 2. "Аудио: Что ВЫ УСЛЫШАЛИ?"
 */

export interface SoundIllusionItem {
  id: string;
  titleRu: string;
  titleEn: string;
  badgeRu: string;
  badgeEn: string;
  icon: string;
  descriptionRu: string;
  descriptionEn: string;
  illusionType: 'shepard' | 'phantom' | 'mcgurk' | 'tritone' | 'binaural' | 'sinewave' | 'laurel_yanny' | 'phonemic';
  audioPromptRu: string;
  audioPromptEn: string;
  whatYouHearRu: string;
  whatYouHearEn: string;
  whatIsRealRu: string;
  whatIsRealEn: string;
  quizQuestionRu: string;
  quizQuestionEn: string;
  optionsRu: { id: string; text: string; isReal: boolean; explanation: string }[];
  optionsEn: { id: string; text: string; isReal: boolean; explanation: string }[];
  speechText?: string;
  speechLang?: string;
}

export interface WhatYouHeardExercise {
  id: string;
  titleRu: string;
  titleEn: string;
  category: 'minimal_pair' | 'speed_speech' | 'acoustic_trick' | 'formant_contrast';
  difficulty?: 'easy' | 'hard';
  soundText: string;
  courseId: string;
  optionA: { text: string; translationRu: string; translationEn: string };
  optionB: { text: string; translationRu: string; translationEn: string };
  optionC?: { text: string; translationRu: string; translationEn: string };
  correctOptionId: 'A' | 'B' | 'C';
  acousticDifferenceRu: string;
  acousticDifferenceEn: string;
  phoneticTipRu: string;
  phoneticTipEn: string;
}

export const SOUND_ILLUSIONS_CATALOG: SoundIllusionItem[] = [
  {
    id: 'shepard_tone',
    titleRu: 'Тон Шепарда (Вечный подъём звука)',
    titleEn: 'Shepard Tone (Ever-Ascending Glissando)',
    badgeRu: 'Акустический парадокс',
    badgeEn: 'Acoustic Paradox',
    icon: '🌀',
    descriptionRu: 'Звуковая иллюзия, при которой кажется, что тон непрерывно и бесконечно повышается вверх, никогда не заканчиваясь.',
    descriptionEn: 'An auditory illusion where a tone seems to continually rise in pitch forever, never reaching the top.',
    illusionType: 'shepard',
    audioPromptRu: 'Слушайте тон: кажется ли вам, что он бесконечно поднимается?',
    audioPromptEn: 'Listen to the tone: does it sound like it is constantly ascending?',
    whatYouHearRu: 'Кажется, что высота звука бесконечно летит ввысь и должна вот-вот уйти в ультразвук.',
    whatYouHearEn: 'Pitch feels like it is rising into ultrasonic heights forever.',
    whatIsRealRu: 'В реальности это закольцованная гармоническая шкала из октавно разнесённых синусоид. Пока центральные звуки поднимаются, верхние плавно затухают, а снизу неслышно зарождаются новые (принцип «парикмахерского столба»).',
    whatIsRealEn: 'It is actually a closed loop of octave-spaced sine waves with a bell-shaped volume envelope. As higher tones fade out, lower tones fade in.',
    quizQuestionRu: 'Что физически происходит в звуковой волне тона Шепарда?',
    quizQuestionEn: 'What is physically happening in the Shepard tone sound wave?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Тон циклически повторяется по кругу, плавно угасая на краях спектра',
        isReal: true,
        explanation: 'Верно! Это замкнутая акустическая петля с фиксированным диапазоном частот.'
      },
      {
        id: 'opt2',
        text: 'Частота генератора физически растёт до бесконечности без перерыва',
        isReal: false,
        explanation: 'Это иллюзия! Если бы частота росла бесконечно, звук мгновенно ушёл бы за пределы слуха человека (20 кГц).'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'The tone is a circular loop with fading spectrum edges',
        isReal: true,
        explanation: 'Correct! It is an acoustic loop with a fixed frequency range.'
      },
      {
        id: 'opt2',
        text: 'The frequency physically increases infinitely without stopping',
        isReal: false,
        explanation: 'This is an illusion! Infinite growth would immediately surpass human hearing limits.'
      }
    ]
  },
  {
    id: 'phantom_words',
    titleRu: 'Фантомные слова Дианы Дойч',
    titleEn: 'Diana Deutsch’s Phantom Words',
    badgeRu: 'Психоакустика речи',
    badgeEn: 'Speech Psychoacoustics',
    icon: '🗣️',
    descriptionRu: 'При быстром стерео-повторении одинаковых нечленораздельных слогов мозг начинает «слышать» осмысленные слова из своего родного языка.',
    descriptionEn: 'When repeating ambiguous syllable sequences rapidly in stereo, the brain constructs meaningful words from memory.',
    illusionType: 'phantom',
    speechText: 'no brain brain no no brain brain no',
    speechLang: 'en',
    audioPromptRu: 'Слушайте стерео-повторы: какие слова вы начинаете различать?',
    audioPromptEn: 'Listen to the stereo repetitions: what words do you start perceiving?',
    whatYouHearRu: 'Кажется, что диктор произносит секретные слова: «Love», «No way», «Hello», «Rainbow» или русские слова в зависимости от настроения.',
    whatYouHearEn: 'Listeners swear they hear varied words like "Love", "No way", "Hello", depending on mental state.',
    whatIsRealRu: 'В записи звучат ровно два одинаковых бессмысленных слога со сдвигом фазы между левым и правым наушником. Все слова — иллюзия мозга, пытающегося найти смысл в звуковом хаосе.',
    whatIsRealEn: 'The audio only contains two repetitive syllables out of phase. All perceived words are constructed by your brain’s language centers.',
    quizQuestionRu: 'Действительно ли диктор произносит разные слова в этой записи?',
    quizQuestionEn: 'Does the speaker actually say different words in this recording?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Нет: в звуке повторяются 2 одинаковых звука, слова достраивает мозг',
        isReal: true,
        explanation: 'Верно! Мозг — генератор шаблонов речи, и проецирует известные слова на шум.'
      },
      {
        id: 'opt2',
        text: 'Да: запись содержит замаскированные шепотом скрытые фразы',
        isReal: false,
        explanation: 'Это иллюзия! В спектрограмме нет никаких скрытых слов — только два слога.'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'No: only 2 identical syllables repeat; the brain fabricates the words',
        isReal: true,
        explanation: 'Correct! The brain is a pattern-matching engine projecting words onto noise.'
      },
      {
        id: 'opt2',
        text: 'Yes: the recording contains hidden whisper phrases',
        isReal: false,
        explanation: 'Illusion! Spectrogram analysis shows only two simple syllables.'
      }
    ]
  },
  {
    id: 'laurel_yanny',
    titleRu: 'Лорел или Янни (Акустический дуализм)',
    titleEn: 'Laurel or Yanny (Acoustic Ambiguity)',
    badgeRu: 'Формантный дуализм',
    badgeEn: 'Formant Dualism',
    icon: '👂',
    descriptionRu: 'Одна и та же аудиозапись слышится половиной людей как «Лорел» (низкие частоты), а второй половиной — как «Янни» (высокие частоты).',
    descriptionEn: 'The famous viral recording perceived as "Laurel" by some and "Yanny" by others due to frequency emphasis.',
    illusionType: 'laurel_yanny',
    speechText: 'Laurel Yanny',
    speechLang: 'en',
    audioPromptRu: 'Вслушайтесь в аудио: кто говорит — «Лорел» или «Янни»?',
    audioPromptEn: 'Listen closely: do you hear "Laurel" or "Yanny"?',
    whatYouHearRu: 'Слушатель абсолютно убеждён, что слышит ТОЛЬКО одно конкретное слово («Лорел» либо «Янни»).',
    whatYouHearEn: 'Each person is convinced they hear only one specific word.',
    whatIsRealRu: 'В аудиосигнале одновременно закодированы оба слова: форманты «Laurel» лежат в диапазоне 200–500 Гц, а гармоники «Yanny» — на частотах выше 1500 Гц. Ваш мозг выбирает один из спектров.',
    whatIsRealEn: 'Both patterns coexist in the waveform. "Laurel" resides in low frequencies (200-500Hz) while "Yanny" is carried by higher formants (>1500Hz).',
    quizQuestionRu: 'Что физически присутствует в спектре аудиозаписи?',
    quizQuestionEn: 'What is physically present in the audio spectrum?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Оба спектра одновременно: низкий (Laurel) и высокий (Yanny)',
        isReal: true,
        explanation: 'Именно! Физически присутствуют обе частотные дорожки, мозг фильтрует одну из них.'
      },
      {
        id: 'opt2',
        text: 'Там записано только одно слово, а второе — чистая галлюцинация',
        isReal: false,
        explanation: 'Неверно! В спектре четко видны форманты обоих слов на разных частотах.'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'Both spectra coexist: low frequencies (Laurel) and high (Yanny)',
        isReal: true,
        explanation: 'Exactly! Both formant profiles are present simultaneously.'
      },
      {
        id: 'opt2',
        text: 'Only one word is recorded; the other is a complete hallucination',
        isReal: false,
        explanation: 'Incorrect! Spectrogram analysis confirms acoustic cues for both.'
      }
    ]
  },
  {
    id: 'tritone_paradox',
    titleRu: 'Тритоновый парадокс (Вверх или вниз?)',
    titleEn: 'The Tritone Paradox (Up or Down?)',
    badgeRu: 'Лингвистический слух',
    badgeEn: 'Linguistic Hearing',
    icon: '🎼',
    descriptionRu: 'Два тона, разделенные интервалом ровно в пол-октавы (тритон). Одни слышат восходящий скачок, другие — нисходящий, в зависимости от родного языка и диалекта!',
    descriptionEn: 'Pairs of complex tones separated by a half-octave. Heard as ascending by some and descending by others depending on maternal language.',
    illusionType: 'tritone',
    audioPromptRu: 'Слушайте две ноты: звук идёт вверх или опускается вниз?',
    audioPromptEn: 'Listen to the two notes: does pitch go up or step down?',
    whatYouHearRu: 'Вам кажется очевидным, что вторая нота либо выше, либо ниже первой.',
    whatYouHearEn: 'You clearly hear the second note either ascending or descending.',
    whatIsRealRu: 'Интервал тритона делит октаву ровно пополам (6 полутонов). Физически он симметричен. Мозг определяет направление по языковой карте слуха, сформированной в детстве!',
    whatIsRealEn: 'The tritone interval bisects the octave symmetrically (6 semitones). The perceived pitch direction is determined by childhood linguistic exposure.',
    quizQuestionRu: 'Почему разные люди слышат разное направление одного и того же тритона?',
    quizQuestionEn: 'Why do different people hear different directions for the exact same tritone?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Интервал физически симметричен, мозг решает по своей языковой карте',
        isReal: true,
        explanation: 'Верно! Исследования Дианы Дойч доказали, что восприятие зависит от родного диалекта.'
      },
      {
        id: 'opt2',
        text: 'Один из слушателей просто ошибся, так как нота однозначно выше',
        isReal: false,
        explanation: 'Ошибка! В тритоне Шепарда нет объективного «верха» — спектр зеркален.'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'The interval is symmetrical; the brain resolves it via linguistic mapping',
        isReal: true,
        explanation: 'Correct! Research proved perception correlates with native language dialect.'
      },
      {
        id: 'opt2',
        text: 'One listener is mistaken because the note is objectively higher',
        isReal: false,
        explanation: 'Incorrect! Shepard tritone pairs are mathematically ambiguous.'
      }
    ]
  },
  {
    id: 'binaural_beats',
    titleRu: 'Бинауральные биения (Фантомный ритм)',
    titleEn: 'Binaural Beats (Brainstem Synthesis)',
    badgeRu: 'Нейрофизиология',
    badgeEn: 'Neurophysiology',
    icon: '🧠',
    descriptionRu: 'При подаче 200 Гц в левое ухо и 210 Гц в правое мозг слышит пульсирующий ритм 10 Гц, которого нет в воздухе!',
    descriptionEn: 'Sending 200 Hz to one ear and 210 Hz to the other produces a perceived 10 Hz beat synthesized solely inside the brain.',
    illusionType: 'binaural',
    audioPromptRu: 'Наденьте наушники: слышите ли вы плавную пульсацию звука?',
    audioPromptEn: 'Wear headphones: can you hear a smooth pulsing rhythm?',
    whatYouHearRu: 'Отчетливая вибрация и пульсация громкости с частотой 10 раз в секунду.',
    whatYouHearEn: 'A clear beating pulse at 10 cycles per second.',
    whatIsRealRu: 'В динамиках нет пульсирующего звука — оба динамика играют непрерывный ровный тон. Пульсацию синтезируют нейроны ствола головного мозга (верхняя олива) при сведении фаз!',
    whatIsRealEn: 'There is zero volume oscillation in the speakers. The beat is generated inside your brainstem neurons (superior olivary complex).',
    quizQuestionRu: 'Где физически рождается ритм бинаурального биения?',
    quizQuestionEn: 'Where is the binaural beat rhythm physically created?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Внутри ствола головного мозга при объединении сигналов от двух ушей',
        isReal: true,
        explanation: 'Правильно! Ни один прибор в воздухе не зафиксирует пульсацию — она рождается в нейронах мозга.'
      },
      {
        id: 'opt2',
        text: 'В динамиках колонок за счет акустической интерференции волн',
        isReal: false,
        explanation: 'Это иллюзия! Если вынуть один наушник, пульсация мгновенно исчезает, так как звук чистый.'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'Inside the brainstem when combining signals from both ears',
        isReal: true,
        explanation: 'Correct! A microphone in the room measures zero beating — it is neural.'
      },
      {
        id: 'opt2',
        text: 'In the speaker membrane via acoustic wave interference',
        isReal: false,
        explanation: 'Illusion! Removing one earbud proves each ear receives a constant tone.'
      }
    ]
  },
  {
    id: 'mcgurk_effect',
    titleRu: 'Эффект Мак-Герка (Зрительный обман слуха)',
    titleEn: 'The McGurk Effect (Visual Audio Illusion)',
    badgeRu: 'Мультимодальное восприятие',
    badgeEn: 'Multimodal Perception',
    icon: '👀',
    descriptionRu: 'Звуковая дорожка говорит «БА-БА», артикуляция губ показывает «ГА-ГА» — и мозг заставляет вас слышать «ДА-ДА»!',
    descriptionEn: 'Hearing "BA" while watching lips articulate "GA" causes the brain to fuse them into "DA".',
    illusionType: 'mcgurk',
    speechText: 'ба ба ба',
    speechLang: 'ru',
    audioPromptRu: 'Послушайте звук с закрытыми глазами и затем посмотрите на артикуляцию.',
    audioPromptEn: 'Listen with closed eyes, then look at the articulation animation.',
    whatYouHearRu: 'При взгляде на лицо диктора звук кажется явным «ДА» или «ТА».',
    whatYouHearEn: 'When looking at the speaker face, the sound transforms into "DA" or "THA".',
    whatIsRealRu: 'В аудиофайле звучит чистый губной звук «БА». Но зрительная кора мозга подавляет слуховую и синтезирует гибридный звук «ДА». Если закрыть глаза, звук мгновенно возвращается к «БА»!',
    whatIsRealEn: 'The audio only contains "BA". The visual cortex overrides the auditory signal. Closing eyes immediately restores "BA".',
    quizQuestionRu: 'Что реально записано на аудиодорожке в эффекте Мак-Герка?',
    quizQuestionEn: 'What is actually recorded on the audio track in the McGurk effect?',
    optionsRu: [
      {
        id: 'opt1',
        text: 'Чистый звук «БА», а звук «ДА» создаётся зрительным обманом губ',
        isReal: true,
        explanation: 'Истина! Закройте глаза во время звука — и вы безошибочно услышите «БА»!'
      },
      {
        id: 'opt2',
        text: 'Звук физически меняется динамически в зависимости от кадра видео',
        isReal: false,
        explanation: 'Иллюзия! Звуковой файл абсолютно неизменен.'
      }
    ],
    optionsEn: [
      {
        id: 'opt1',
        text: 'Pure sound "BA", while "DA" is created by visual lip cues',
        isReal: true,
        explanation: 'Truth! Closing your eyes instantly proves the acoustic track is "BA".'
      },
      {
        id: 'opt2',
        text: 'The sound physically changes depending on the video frame',
        isReal: false,
        explanation: 'Illusion! The audio file remains 100% constant.'
      }
    ]
  }
];

export const WHAT_YOU_HEARD_COLLECTION: WhatYouHeardExercise[] = [
  // Russian (ru)
  {
    id: 'wyh_ru_1',
    titleRu: 'Парные согласные (Оглушение в конце слова)',
    titleEn: 'Terminal Devoicing in Russian',
    category: 'minimal_pair',
    difficulty: 'hard',
    soundText: 'луг',
    courseId: 'ru',
    optionA: { text: 'Луг', translationRu: 'Поляна с травой и цветами', translationEn: 'Meadow / pasture' },
    optionB: { text: 'Лук', translationRu: 'Овощ или оружие со стрелами', translationEn: 'Onion or archery bow' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'В русском языке согласный «г» на конце слова оглушается в [к]. На слух «луг» и «лук» звучат как омофоны [лук], но контекст определяет значение!',
    acousticDifferenceEn: 'Terminal devoicing causes final "г" to sound as [k]. "Луг" and "лук" sound almost identical.',
    phoneticTipRu: 'Обратите внимание на озвончение при склонении: луга́ (поля) против лу́ка (овоща).',
    phoneticTipEn: 'Notice how voicing returns in inflected forms: луга́ vs лу́ка.'
  },
  {
    id: 'wyh_ru_2',
    titleRu: 'Твёрдый [т] против мягкого [т’] на конце',
    titleEn: 'Hard [t] vs Palatalized [tʲ]',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'брать',
    courseId: 'ru',
    optionA: { text: 'Брат', translationRu: 'Родственник (твёрдый звук [т])', translationEn: 'Brother (hard [t])' },
    optionB: { text: 'Брать', translationRu: 'Глагол «взять» (мягкий [т’])', translationEn: 'To take (soft [tʲ])' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Мягкий знак поднимает среднюю часть языка к нёбу, создавая характерный высокий призвук [и] при размыкании согласного.',
    acousticDifferenceEn: 'The soft sign raises the middle tongue toward the palate, creating a high-frequency palatal release.',
    phoneticTipRu: 'Слышите лёгкое «и» или свистящий призвук в конце? Это мягкий [т’].',
    phoneticTipEn: 'Listen for a brief palatalized sheen at the consonant release.'
  },
  {
    id: 'wyh_ru_3',
    titleRu: 'Ударение и редукция гласных',
    titleEn: 'Stress Shift & Vowel Reduction',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'замо́к',
    courseId: 'ru',
    optionA: { text: 'За́мок', translationRu: 'Средневековая крепость (ударный А)', translationEn: 'Castle (stress on first syllable)' },
    optionB: { text: 'Замо́к', translationRu: 'Дверной запор (ударный О)', translationEn: 'Lock (stress on second syllable)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'В безударном слоге русское «о» редуцируется в [а], поэтому в «замо́к» первый слог звучит как [за], а второй тянется под ударением [мо́к].',
    acousticDifferenceEn: 'Unstressed "o" reduces toward [a], while the stressed syllable carries higher pitch, intensity, and duration.',
    phoneticTipRu: 'Сравнивайте длину и громкость слогов: длиннее первый — крепость, второй — дверной замок.',
    phoneticTipEn: 'Compare syllable duration: longer first syllable = castle, longer second = lock.'
  },
  {
    id: 'wyh_ru_4',
    titleRu: 'Гласные [ы] и [и] и смягчение перед ними',
    titleEn: 'Vowel [ɨ] vs [i] & Consonant Softening',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'мыло',
    courseId: 'ru',
    optionA: { text: 'Мыло', translationRu: 'Средство для мытья рук (твёрдое М)', translationEn: 'Soap (hard M + [ɨ])' },
    optionB: { text: 'Мило', translationRu: 'Приятно / очаровательно (мягкое М’)', translationEn: 'Cute / nice (soft Mʲ + [i])' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Звук [ы] имеет низкую вторую форманту и отодвигает корень языка назад, а [и] резко поднимает резонанс вверх и смягчает предшествующее «м».',
    acousticDifferenceEn: '[ɨ] shifts the tongue back with a low second formant, whereas [i] pulls the tongue forward and softens preceding consonants.',
    phoneticTipRu: 'Слушайте начало слова: низкий густой звук «мы» или звонкий высокий «ми».',
    phoneticTipEn: 'Focus on the onset: low dark "мы" vs bright high "ми".'
  },
  {
    id: 'wyh_ru_5',
    titleRu: 'Твёрдый [л] против мягкого [л’]',
    titleEn: 'Velarized [ɫ] vs Palatalized [lʲ]',
    category: 'minimal_pair',
    difficulty: 'hard',
    soundText: 'уголь',
    courseId: 'ru',
    optionA: { text: 'Угол', translationRu: 'Геометрическая вершина (твёрдое Л)', translationEn: 'Corner / angle (dark L)' },
    optionB: { text: 'Уголь', translationRu: 'Чёрное топливо / древесный уголь (мягкое Л’)', translationEn: 'Coal / charcoal (light Lʲ)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Твёрдое [л] звучит глубоко за счёт поднятия корня языка назад, а мягкое [л’] формируется кончиком языка у верхних альвеол со светлым обертоном.',
    acousticDifferenceEn: 'Dark [ɫ] retracts the tongue root, while palatalized [lʲ] fronts the tongue body for a lighter overtone.',
    phoneticTipRu: 'В слове «уголь» последний согласный звучит светло и плавно растворяется.',
    phoneticTipEn: 'Notice the bright, lifted timbre of final soft «ль» in «уголь».'
  },

  // English (en)
  {
    id: 'wyh_en_1',
    titleRu: 'Долгота гласных звуков [ɪ] против [iː]',
    titleEn: 'Vowel Length [ɪ] vs [iː]',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'sheep',
    courseId: 'en',
    optionA: { text: 'Ship', translationRu: 'Корабль / морское судно', translationEn: 'Ship / naval vessel' },
    optionB: { text: 'Sheep', translationRu: 'Овца / пушистое животное', translationEn: 'Sheep / wool animal' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Слово «sheep» содержит долгий напряжённый гласный [iː] (около 250 мс), тогда как «ship» имеет краткий расслабленный [ɪ] (около 120 мс).',
    acousticDifferenceEn: '"Sheep" features a tense long /iː/ while "ship" features a lax short /ɪ/.',
    phoneticTipRu: 'Растяните губы в лёгкой улыбке для длинного [iː] в слове «sheep».',
    phoneticTipEn: 'Spread your lips slightly to produce the tense /iː/ in "sheep".'
  },
  {
    id: 'wyh_en_2',
    titleRu: 'Краткий [e] против открытого [æ]',
    titleEn: 'Front Vowel Contrast [e] vs [æ]',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'bad',
    courseId: 'en',
    optionA: { text: 'Bed', translationRu: 'Кровать (краткий средний [e])', translationEn: 'Bed (mid-front /e/)' },
    optionB: { text: 'Bad', translationRu: 'Плохой (широкий открытый [æ])', translationEn: 'Bad (open-front /æ/)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'В «bad» нижняя челюсть опускается заметно ниже, поднимая первую форманту (F1), тогда как «bed» звучит компактно и короче.',
    acousticDifferenceEn: '"Bad" drops the jaw much lower, raising the first formant F1, while "bed" stays tighter and shorter.',
    phoneticTipRu: 'Открытый звук [æ] тянется чуть дольше и звучит между русскими «э» и «а».',
    phoneticTipEn: 'Listen for the wider jaw opening and longer duration of /æ/ in "bad".'
  },
  {
    id: 'wyh_en_3',
    titleRu: 'Гласные [ɪ] и [iː]: live vs leave',
    titleEn: 'Tense vs Lax Vowel: live / leave',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'leave',
    courseId: 'en',
    optionA: { text: 'Live', translationRu: 'Жить (краткий расслабленный [ɪ])', translationEn: 'Live (short lax /ɪ/)' },
    optionB: { text: 'Leave', translationRu: 'Уходить / оставлять (долгий [iː])', translationEn: 'Leave (long tense /iː/)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Перед звонким [v] оба гласных слегка удлиняются, но «leave» всё равно звучит напряжённее и чище по тону, чем расслабленный «live».',
    acousticDifferenceEn: 'Although voiced [v] lengthens the preceding vowel, "leave" keeps a noticeably higher, tenser /iː/ timbre.',
    phoneticTipRu: 'Слышите краткий звук ближе к «ы/и»? Это «live». Чистое долгое «ии» — «leave».',
    phoneticTipEn: 'Short centralized vowel = "live"; steady high [iː] = "leave".'
  },
  {
    id: 'wyh_en_4',
    titleRu: 'Межзубный [θ] против свистящего [s]',
    titleEn: 'Interdental [θ] vs Alveolar [s]',
    category: 'acoustic_trick',
    difficulty: 'hard',
    soundText: 'thin',
    courseId: 'en',
    optionA: { text: 'Thin', translationRu: 'Тонкий (межзубный мягкий шум [θ])', translationEn: 'Thin (dental fricative /θ/)' },
    optionB: { text: 'Sin', translationRu: 'Грех (резкий высокочастотный свист [s])', translationEn: 'Sin (sibilant fricative /s/)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Свистящий [s] концентрирует мощную энергию на частотах 4000–8000 Гц, а межзубный [θ] имеет тихий плоский спектр воздушного трения.',
    acousticDifferenceEn: 'Sibilant [s] creates sharp high-frequency hiss (4–8 kHz), whereas dental [θ] has soft broadband friction.',
    phoneticTipRu: 'Если начало звучит мягко, как лёгкий выдох без свиста — это межзубное «th».',
    phoneticTipEn: 'A soft breathy onset without sharp whistling indicates dental /θ/.'
  },
  {
    id: 'wyh_en_5',
    titleRu: 'Звонкое и глухое окончание: bag vs back',
    titleEn: 'Final Voicing & Pre-fortis Clipping',
    category: 'minimal_pair',
    difficulty: 'hard',
    soundText: 'bag',
    courseId: 'en',
    optionA: { text: 'Bag', translationRu: 'Сумка (долгий гласный перед звонким [g])', translationEn: 'Bag (longer vowel before voiced /g/)' },
    optionB: { text: 'Back', translationRu: 'Спина / назад (укороченный гласный перед [k])', translationEn: 'Back (clipped vowel before voiceless /k/)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'В английском ключевой сигнал — не только финальный согласный, но и длительность гласного: перед звонким [g] гласный звучит почти в полтора раза дольше!',
    acousticDifferenceEn: 'Pre-fortis clipping shortens vowels before voiceless /k/, making the vowel in "bag" markedly longer than in "back".',
    phoneticTipRu: 'Прислушайтесь к длине самого гласного «æ» — протянутый вариант указывает на звонкий финал.',
    phoneticTipEn: 'Track vowel duration: a fuller, stretched vowel points to voiced "bag".'
  },

  // Spanish (es)
  {
    id: 'wyh_es_1',
    titleRu: 'Одиночный [r] против раскатистого [rr]',
    titleEn: 'Single Tap [ɾ] vs Trill [r]',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'perro',
    courseId: 'es',
    optionA: { text: 'Pero', translationRu: 'Союз «Но / однако»', translationEn: 'Conjunction "But"' },
    optionB: { text: 'Perro', translationRu: 'Собака / домашний питомец', translationEn: 'Dog / pet' },
    correctOptionId: 'B',
    acousticDifferenceRu: '«Pero» произносится с одним касанием языка (tap [ɾ]), а «perro» — с несколькими ударами кончика языка (длинный trill [r]).',
    acousticDifferenceEn: '"Pero" uses a single alveolar tap [ɾ], whereas "perro" has multiple vibrations (trill [r]).',
    phoneticTipRu: 'Для «perro» язык должен вибрировать у верхних альвеол под потоком выдыхаемого воздуха.',
    phoneticTipEn: 'Allow air pressure to vibrate the tongue tip for "perro".'
  },
  {
    id: 'wyh_es_2',
    titleRu: 'Слова с одним и двумя r: caro vs carro',
    titleEn: 'Tap vs Trill: caro / carro',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'caro',
    courseId: 'es',
    optionA: { text: 'Caro', translationRu: 'Дорогой по цене (одиночный удар [ɾ])', translationEn: 'Expensive (single tap)' },
    optionB: { text: 'Carro', translationRu: 'Тележка / машина (вибрация [rr])', translationEn: 'Cart / car (rolled trill)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Длительность одиночного [ɾ] — около 25 мс (как быстрый щелчок), тогда как раскатистое [rr] длится 100–150 мс с тремя и более импульсами.',
    acousticDifferenceEn: 'A single tap lasts ~25 ms with one tongue contact, while a trill spans 100–150 ms across multiple beats.',
    phoneticTipRu: 'Одно короткое касание без трели означает «caro» (дорогой).',
    phoneticTipEn: 'One quick tongue flick without rolling means "caro".'
  },
  {
    id: 'wyh_es_3',
    titleRu: 'Сдвиг ударения: papa vs papá',
    titleEn: 'Spanish Stress Shift: papa / papá',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'papá',
    courseId: 'es',
    optionA: { text: 'Papa', translationRu: 'Картофель / Папа Римский (ударение на 1-й слог)', translationEn: 'Potato / Pope (first syllable stressed)' },
    optionB: { text: 'Papá', translationRu: 'Отец / папа (ударение на последний слог)', translationEn: 'Dad / father (final syllable stressed)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Акустический пик высоты и энергии в слове «papá» резко смещается на второй слог, тогда как «papa» падает по интонации к концу.',
    acousticDifferenceEn: 'Pitch and intensity peak sharply on the final syllable in "papá", whereas "papa" drops on the second syllable.',
    phoneticTipRu: 'Ловите подъём интонации на конце: «па-ПА́» — это отец.',
    phoneticTipEn: 'Listen for the rising emphasis at the end: pa-PÁ.'
  },
  {
    id: 'wyh_es_4',
    titleRu: 'Время глагола на слух: hablo vs habló',
    titleEn: 'Present vs Preterite Stress: hablo / habló',
    category: 'formant_contrast',
    difficulty: 'hard',
    soundText: 'habló',
    courseId: 'es',
    optionA: { text: 'Hablo', translationRu: 'Я говорю сейчас (ударение на A)', translationEn: 'I speak (present, stress on first syllable)' },
    optionB: { text: 'Habló', translationRu: 'Он/она говорил(а) в прошлом (ударение на Ó)', translationEn: 'He/she spoke (past, stress on final Ó)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Один ударный акцент меняет и лицо, и время! Финальное ударное [o] в «habló» не только громче, но и длиннее безударного окончания в «hablo».',
    acousticDifferenceEn: 'Final stressed [o] in "habló" carries both higher pitch and longer vowel duration than unstressed "-o" in "hablo".',
    phoneticTipRu: 'Чёткое звонкое «О́» в конце слова указывает на прошедшее время.',
    phoneticTipEn: 'A strong accented final -Ó signals past tense.'
  },

  // German (de)
  {
    id: 'wyh_de_1',
    titleRu: 'Долгота гласного и открытость в немецком',
    titleEn: 'German Vowel Quantity & Quality',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'Staat',
    courseId: 'de',
    optionA: { text: 'Stadt', translationRu: 'Город (краткий [a])', translationEn: 'City (short /a/)' },
    optionB: { text: 'Staat', translationRu: 'Государство / страна (долгий [aː])', translationEn: 'State / country (long /aː/)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'В немецком языке долгота гласного меняет смысл: «Stadt» звучит отрывисто, а «Staat» — протяжно.',
    acousticDifferenceEn: 'Vowel quantity differentiates meaning: "Stadt" has a staccato short /a/, "Staat" has a held /aː/.',
    phoneticTipRu: 'Двойная буква «aa» в немецком всегда указывает на долгий звук.',
    phoneticTipEn: 'Double "aa" in German orthography always signifies a lengthened vowel.'
  },
  {
    id: 'wyh_de_2',
    titleRu: 'Долгий [iː] против краткого [ɪ]: Stil vs still',
    titleEn: 'Long [iː] vs Short [ɪ]: Stil / still',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'still',
    courseId: 'de',
    optionA: { text: 'Stil', translationRu: 'Стиль (долгий напряжённый [iː])', translationEn: 'Style (long /iː/)' },
    optionB: { text: 'still', translationRu: 'Тихий / спокойный (краткий [ɪ])', translationEn: 'Quiet / still (short /ɪ/)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Удвоенная согласная «ll» обрывает предыдущий гласный, делая его кратким и расслабленным [ɪ], тогда как одиночное «l» даёт протяжный [iː].',
    acousticDifferenceEn: 'Double consonant "ll" clips the vowel short and lax [ɪ], whereas single "l" allows a tense long [iː].',
    phoneticTipRu: 'Короткий толчок гласного перед длинным «л» — это «still».',
    phoneticTipEn: 'A crisp, short vowel followed by held "ll" marks "still".'
  },
  {
    id: 'wyh_de_3',
    titleRu: 'Немецкие умлауты и долгота: Miete vs Mitte',
    titleEn: 'German Vowel Length: Miete / Mitte',
    category: 'minimal_pair',
    difficulty: 'hard',
    soundText: 'Miete',
    courseId: 'de',
    optionA: { text: 'Miete', translationRu: 'Аренда жилья (долгий [iː])', translationEn: 'Rent (long /iː/)' },
    optionB: { text: 'Mitte', translationRu: 'Середина / центр (краткий [ɪ])', translationEn: 'Middle (short /ɪ/)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Сочетание «ie» в «Miete» звучит как чистый протяжный [iː], а двойное «tt» в «Mitte» делает ударный гласный резким и коротким.',
    acousticDifferenceEn: 'The digraph "ie" yields a long tense [iː] in "Miete", contrasted with the abrupt short vowel before "tt" in "Mitte".',
    phoneticTipRu: 'Если гласный поётся долго перед «т» — это «Miete».',
    phoneticTipEn: 'Listen for the sustained vowel before the "t" release.'
  },
  {
    id: 'wyh_de_4',
    titleRu: 'Закрытый [oː] против открытого [ɔ]: Ofen vs offen',
    titleEn: 'Closed [oː] vs Open [ɔ]: Ofen / offen',
    category: 'formant_contrast',
    difficulty: 'hard',
    soundText: 'offen',
    courseId: 'de',
    optionA: { text: 'Ofen', translationRu: 'Печь / духовка (долгий закрытый [oː])', translationEn: 'Oven (long closed /oː/)' },
    optionB: { text: 'offen', translationRu: 'Открытый (краткий открытый [ɔ])', translationEn: 'Open (short open /ɔ/)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'В слове «Ofen» губы сильно округлены и звук тянется [oː], а в «offen» гласный раскрывается короче и резче упирается в «ff».',
    acousticDifferenceEn: '"Ofen" keeps tightly rounded lips for a long [oː], while "offen" opens briefly into [ɔ] before "ff".',
    phoneticTipRu: 'Быстрое отрывистое «о» перед чётким [ф] указывает на «offen».',
    phoneticTipEn: 'A short, open vowel cut off by "ff" identifies "offen".'
  },

  // French (fr)
  {
    id: 'wyh_fr_1',
    titleRu: 'Глухой [s] против звонкого [z] во французском',
    titleEn: 'Voiceless [s] vs Voiced [z]',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'poisson',
    courseId: 'fr',
    optionA: { text: 'Poisson', translationRu: 'Рыба (глухой [s])', translationEn: 'Fish (voiceless [s])' },
    optionB: { text: 'Poison', translationRu: 'Яд (звонкий [z])', translationEn: 'Poison (voiced [z])' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Удвоенная «ss» в «poisson» читается глухо [s], а одиночная «s» между гласными в «poison» озвончается в [z]. Ошибка меняет заказ рыбы в ресторане на яд!',
    acousticDifferenceEn: 'Double "ss" in "poisson" is voiceless [s]; single "s" in "poison" is voiced [z]. Confusing them turns a fish dish into poison!',
    phoneticTipRu: 'Следите за вибрацией голосовых связок: на [z] они вибрируют, на [s] расслаблены.',
    phoneticTipEn: 'Feel your throat: vocal cords vibrate on [z], but remain quiet on [s].'
  },
  {
    id: 'wyh_fr_2',
    titleRu: 'Огублённый [y] против заднего [u]: tu vs tout',
    titleEn: 'Front Rounded [y] vs Back [u]: tu / tout',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'tu',
    courseId: 'fr',
    optionA: { text: 'Tu', translationRu: 'Ты (передний звук [y], губы трубочкой)', translationEn: 'You (front rounded /y/)' },
    optionB: { text: 'Tout', translationRu: 'Всё / весь (глубокий задний [u])', translationEn: 'All / everything (back /u/)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Гласный [y] в «tu» сохраняет высокую вторую форманту (язык впереди, как на «и»), а в «tout» язык оттянут назад, давая низкий резонанс [u].',
    acousticDifferenceEn: 'French "u" (/y/) holds a high second formant with a fronted tongue, while "ou" (/u/) pulls the tongue back for a deeper timbre.',
    phoneticTipRu: 'Слышите более тонкий «высокий» оттенок, почти как «тю»? Это «tu».',
    phoneticTipEn: 'A brighter, fronted resonance signals "tu" (/y/).'
  },
  {
    id: 'wyh_fr_3',
    titleRu: 'Носовой гласный против чистого: bon vs bonne',
    titleEn: 'Nasal vs Oral Vowel: bon / bonne',
    category: 'acoustic_trick',
    difficulty: 'hard',
    soundText: 'bonne',
    courseId: 'fr',
    optionA: { text: 'Bon', translationRu: 'Хороший (муж. род, носовой [ɔ̃])', translationEn: 'Good (masculine, nasal vowel)' },
    optionB: { text: 'Bonne', translationRu: 'Хорошая (жен. род, чистый [ɔ] + слышный [n])', translationEn: 'Good (feminine, oral vowel + [n])' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'В «bon» буква «n» не произносится — она лишь переводит поток воздуха в нос, а в «bonne» звучит чёткий финальный согласный [n] после чистого гласного.',
    acousticDifferenceEn: 'In "bon", the "n" nasalizes the vowel and stays silent; in "bonne", the vowel is oral and the final [n] is clearly pronounced.',
    phoneticTipRu: 'Услышали отчётливый кончик [н] в финале — значит, это форма женского рода «bonne».',
    phoneticTipEn: 'If you clearly hear the final tongue-tip [n], it is "bonne".'
  },
  {
    id: 'wyh_fr_4',
    titleRu: 'Контраст носовых гласных: vin vs vent',
    titleEn: 'Nasal Vowel Contrast: vin / vent',
    category: 'formant_contrast',
    difficulty: 'hard',
    soundText: 'vin',
    courseId: 'fr',
    optionA: { text: 'Vin', translationRu: 'Вино (светлый носовой [ɛ̃])', translationEn: 'Wine (front nasal /ɛ̃/)' },
    optionB: { text: 'Vent', translationRu: 'Ветер (глубокий носовой [ɑ̃])', translationEn: 'Wind (back nasal /ɑ̃/)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Оба звука носовые, но «vin» звучит ярче и шире в улыбке ([ɛ̃]), тогда как «vent» опускает тон в глубокий носовой [ɑ̃].',
    acousticDifferenceEn: '"Vin" uses a brighter front nasal /ɛ̃/, whereas "vent" uses a deeper rounded back nasal /ɑ̃/.',
    phoneticTipRu: 'Более плоский «носовой э» — это вино (vin), густой «носовой а/о» — ветер (vent).',
    phoneticTipEn: 'Brighter front nasal quality points to "vin"; deeper back quality points to "vent".'
  },

  // Chuvash (cv)
  {
    id: 'wyh_cv_1',
    titleRu: 'Чувашские особые звуки [Ӑ] и [Ӗ]',
    titleEn: 'Chuvash Reduced Vowels [Ӑ] and [Ӗ]',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'ҫӑкӑр',
    courseId: 'cv',
    optionA: { text: 'Ҫӑкӑр', translationRu: 'Хлеб (с кратким редуцированным задним ӑ)', translationEn: 'Bread' },
    optionB: { text: 'Ҫӗкӗр', translationRu: 'Поднимите (с передним мягким редуцированным ӗ)', translationEn: 'Lift / raise' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'В чувашском языке буквы Ӑ и Ӗ обозначают уникальные краткие редуцированные гласные (задний и передний ряд гармонии гласных).',
    acousticDifferenceEn: 'Chuvash Ӑ and Ӗ represent distinct reduced vowels governed by vowel harmony.',
    phoneticTipRu: 'Буква «Ӑ» звучит средне между кратким «о» и «ы», а «Ӗ» — как редуцированный краткий «э».',
    phoneticTipEn: 'Ӑ is a back reduced vowel, while Ӗ is its front vowel harmony counterpart.'
  },
  {
    id: 'wyh_cv_2',
    titleRu: 'Сингармонизм: твёрдый [у] против мягкого [ӳ]',
    titleEn: 'Chuvash Vowel Harmony: [у] vs [ӳ]',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'тӳрӗ',
    courseId: 'cv',
    optionA: { text: 'Тура', translationRu: 'Гребень / расчёска (твёрдорядный [у])', translationEn: 'Comb (back vowel)' },
    optionB: { text: 'Тӳрӗ', translationRu: 'Прямой / ровный (мягкорядный [ӳ])', translationEn: 'Straight (front rounded ӳ)' },
    correctOptionId: 'B',
    acousticDifferenceRu: 'Буква «Ӳ» обозначает переднерядный огублённый звук, меняющий всю гармонию последующих слогов и мягкость слова.',
    acousticDifferenceEn: 'Chuvash Ӳ is a front rounded vowel that sets soft front-vowel harmony across the word.',
    phoneticTipRu: 'Услышали светлое звучание ближе к «тю» — это мягкая буква «ӳ».',
    phoneticTipEn: 'A lighter fronted timbre signals ӳ rather than deep back у.'
  },
  {
    id: 'wyh_cv_3',
    titleRu: 'Чувашский звук [Ç] и долгие гласные: пур vs пӗр',
    titleEn: 'Chuvash Vowel Contrast: пур / пӗр',
    category: 'minimal_pair',
    difficulty: 'hard',
    soundText: 'пур',
    courseId: 'cv',
    optionA: { text: 'Пур', translationRu: 'Есть / имеется / все (глубокий огублённый [у])', translationEn: 'Exists / all' },
    optionB: { text: 'Пӗр', translationRu: 'Один / единый (краткий передний [ӗ])', translationEn: 'One / single' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Полноценный гласный [у] имеет чёткую длительность и округление губ, тогда как [ӗ] сверхкраток и редуцирован.',
    acousticDifferenceEn: 'Full vowel [u] carries clear duration and lip rounding, whereas [ӗ] is ultra-short and centralized.',
    phoneticTipRu: 'Протяжный густой гласный — это «пур», короткий лёгкий — «пӗр».',
    phoneticTipEn: 'A sustained rounded vowel marks "пур"; a quick reduced one marks "пӗр".'
  },
  {
    id: 'wyh_cv_4',
    titleRu: 'Шипяще-свистящий [Ҫ] против [Ш]',
    titleEn: 'Chuvash Alveolo-palatal [ɕ] vs [ʂ]',
    category: 'acoustic_trick',
    difficulty: 'hard',
    soundText: 'ҫил',
    courseId: 'cv',
    optionA: { text: 'Ҫил', translationRu: 'Ветер (мягкий палатализованный [ҫ])', translationEn: 'Wind' },
    optionB: { text: 'Шил', translationRu: 'Созвучный твёрдый шипящий [ш]', translationEn: 'Hard postalveolar sh-contrast' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Чувашский [ҫ] — мягкий шипяще-свистящий звук с поднятой спинкой языка, звучит значительно светлее твёрдого [ш].',
    acousticDifferenceEn: 'Chuvash Ҫ is an alveolo-palatal fricative whose spectral energy sits higher and brighter than hard [ʂ].',
    phoneticTipRu: 'Высокий мягкий свист ближе к «сь/щ» указывает на букву «ҫ».',
    phoneticTipEn: 'Listen for the bright palatal hiss characteristic of ҫ.'
  },

  // Arabic (ar)
  {
    id: 'wyh_ar_1',
    titleRu: 'Эмфатический звук [ص] против обычного [س]',
    titleEn: 'Arabic Emphatic [ص] vs Plain [س]',
    category: 'formant_contrast',
    difficulty: 'easy',
    soundText: 'صيف',
    courseId: 'ar',
    optionA: { text: 'صيف', translationRu: 'Лето — Сайф (эмфатический твёрдый ص)', translationEn: 'Summer (emphatic Saad)' },
    optionB: { text: 'سيف', translationRu: 'Меч — Сейф (мягкий обычный س)', translationEn: 'Sword (plain Seen)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Буква «сад» (ص) опускает вторую форманту гласного за счёт прижатия корня языка к глотке (веляризация), делая слог глубоким и твёрдым.',
    acousticDifferenceEn: 'The emphatic letter Saad velarizes neighboring vowels, lowering the second formant compared to plain Seen.',
    phoneticTipRu: 'При произношении буквы «сад» задняя спинка языка приподнимается к мягкому нёбу.',
    phoneticTipEn: 'Raise the back of your tongue toward the soft palate to produce the emphatic coloring.'
  },
  {
    id: 'wyh_ar_2',
    titleRu: 'Глубокий увулярный [ق] против велярного [ك]',
    titleEn: 'Arabic Uvular [q] vs Velar [k]: قلب / كلب',
    category: 'minimal_pair',
    difficulty: 'easy',
    soundText: 'قلب',
    courseId: 'ar',
    optionA: { text: 'قلب', translationRu: 'Сердце — Кальб (глубокий горловой ق)', translationEn: 'Heart (uvular Qaf)' },
    optionB: { text: 'كلب', translationRu: 'Собака — Кяльб (передний мягкий ك)', translationEn: 'Dog (velar Kaf)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Увулярный [q] образуется глубоко у язычка в горле и затемняет следующий гласный [а], а [k] звучит звонче и ближе к зубам.',
    acousticDifferenceEn: 'Uvular Qaf ([q]) is released far back at the uvula and darkens the following vowel, unlike fronted Kaf ([k]).',
    phoneticTipRu: 'Глубокий «щелчок» из глубины горла и тёмное «о/а» — это «قلب» (сердце).',
    phoneticTipEn: 'A deep throat release paired with a darker vowel marks "قلب".'
  },
  {
    id: 'wyh_ar_3',
    titleRu: 'Эмфатический [ط] против мягкого [ت]',
    titleEn: 'Emphatic [tˤ] vs Plain [t]: طين / تين',
    category: 'formant_contrast',
    difficulty: 'hard',
    soundText: 'طين',
    courseId: 'ar',
    optionA: { text: 'طين', translationRu: 'Глина — Тын (твёрдый эмфатический ط)', translationEn: 'Clay (emphatic Taa)' },
    optionB: { text: 'تين', translationRu: 'Инжир — Тин (лёгкий передний ت)', translationEn: 'Fig (plain Taa)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Твёрдое эмфатическое «ط» окрашивает последующий «ي» ближе к глубокому «ы», тогда как «ت» оставляет гласный высоким и тонким «и».',
    acousticDifferenceEn: 'Emphatic Taa pulls the following vowel downward in pitch-resonance compared to light plain Taa.',
    phoneticTipRu: 'Тяжёлый глухой удар и густой гласный — это طين.',
    phoneticTipEn: 'A heavier release and darker following vowel point to طين.'
  },
  {
    id: 'wyh_ar_4',
    titleRu: 'Харизматичный гортанный [ح] против [هـ]',
    titleEn: 'Pharyngeal [ħ] vs Glottal [h]',
    category: 'acoustic_trick',
    difficulty: 'hard',
    soundText: 'حلم',
    courseId: 'ar',
    optionA: { text: 'حلم', translationRu: 'Сон / мечта (резкий фарингальный ح)', translationEn: 'Dream (pharyngeal Haa)' },
    optionB: { text: 'هرم', translationRu: 'Пирамида (лёгкий выдох هـ)', translationEn: 'Pyramid (glottal Haa)' },
    correctOptionId: 'A',
    acousticDifferenceRu: 'Согласный [ħ] возникает при сужении глотки (как тёплое дыхание на стекло с трением), а [h] — свободный лёгкий выдох.',
    acousticDifferenceEn: 'Pharyngeal [ħ] constricts the pharynx for crisp friction, while glottal [h] is a soft unobstructed breath.',
    phoneticTipRu: 'Слышите плотное «бархатное» трение в горле — это буква ح.',
    phoneticTipEn: 'Listen for the crisp pharyngeal friction unique to ح.'
  }
];

// Web Audio API Synthesizers for Sound Illusions
let webAudioCtx: AudioContext | null = null;
let activeIllusionNodes: { stop: () => void } | null = null;

const getWebAudioContext = (): AudioContext => {
  if (!webAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    webAudioCtx = new AudioContextClass();
  }
  if (webAudioCtx.state === 'suspended') {
    void webAudioCtx.resume();
  }
  return webAudioCtx;
};

/**
 * Stops any actively playing continuous illusion sound
 */
export const stopActiveIllusion = () => {
  if (activeIllusionNodes) {
    try {
      activeIllusionNodes.stop();
    } catch {}
    activeIllusionNodes = null;
  }
};

/**
 * Plays a scientific Shepard Tone glissando using 8 octave-spaced sine oscillators
 */
export const playShepardTone = (durationSeconds: number = 6): { stop: () => void } => {
  stopActiveIllusion();
  const ctx = getWebAudioContext();
  const baseFreq = 55; // A1 (55Hz)
  const numOctaves = 7;
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.connect(ctx.destination);

  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  // Bell-shaped spectral envelope center around 440 Hz
  const centerPitchLog = Math.log2(440);

  for (let i = 0; i < numOctaves; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const startFreq = baseFreq * Math.pow(2, i);
    const endFreq = startFreq * 2; // Ascend by 1 octave across duration

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + durationSeconds);

    // Compute gaussian bell-curve gain based on frequency
    const midFreq = (startFreq + endFreq) / 2;
    const distance = Math.abs(Math.log2(midFreq) - centerPitchLog);
    const amp = Math.max(0.001, Math.exp(-0.5 * Math.pow(distance / 1.3, 2)));

    gain.gain.setValueAtTime(amp * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, amp * 0.15), now + durationSeconds);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + durationSeconds);

    oscillators.push(osc);
    gains.push(gain);
  }

  const handle = {
    stop: () => {
      oscillators.forEach(o => {
        try { o.stop(); } catch {}
      });
      try { masterGain.disconnect(); } catch {}
    }
  };
  activeIllusionNodes = handle;
  return handle;
};

/**
 * Plays a Binaural Beat (e.g. 210Hz Left, 200Hz Right -> 10Hz Alpha Brainstem Beat)
 */
export const playBinauralBeats = (durationSeconds: number = 7): { stop: () => void } => {
  stopActiveIllusion();
  const ctx = getWebAudioContext();
  const now = ctx.currentTime;

  const leftOsc = ctx.createOscillator();
  const rightOsc = ctx.createOscillator();
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  const merger = ctx.createChannelMerger(2);

  leftOsc.type = 'sine';
  rightOsc.type = 'sine';
  leftOsc.frequency.setValueAtTime(200, now); // 200 Hz Left
  rightOsc.frequency.setValueAtTime(210, now); // 210 Hz Right (10 Hz beat difference)

  leftGain.gain.setValueAtTime(0.18, now);
  rightGain.gain.setValueAtTime(0.18, now);

  leftOsc.connect(leftGain);
  rightOsc.connect(rightGain);

  leftGain.connect(merger, 0, 0); // Channel 0 = Left
  rightGain.connect(merger, 0, 1); // Channel 1 = Right
  merger.connect(ctx.destination);

  leftOsc.start(now);
  rightOsc.start(now);
  leftOsc.stop(now + durationSeconds);
  rightOsc.stop(now + durationSeconds);

  const handle = {
    stop: () => {
      try { leftOsc.stop(); } catch {}
      try { rightOsc.stop(); } catch {}
      try { merger.disconnect(); } catch {}
    }
  };
  activeIllusionNodes = handle;
  return handle;
};

/**
 * Plays Tritone Paradox tone pairs separated by half-octave
 */
export const playTritoneParadox = (): { stop: () => void } => {
  stopActiveIllusion();
  const ctx = getWebAudioContext();
  const now = ctx.currentTime;

  const playToneCluster = (rootFreq: number, startTime: number, dur: number) => {
    const clusterGain = ctx.createGain();
    clusterGain.gain.setValueAtTime(0.12, startTime);
    clusterGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    clusterGain.connect(ctx.destination);

    // 4 octave-related sine harmonics
    for (let k = -1; k <= 2; k++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const f = rootFreq * Math.pow(2, k);
      if (f >= 60 && f <= 3000) {
        osc.frequency.setValueAtTime(f, startTime);
        const dist = Math.abs(Math.log2(f / 440));
        const amp = Math.max(0.01, Math.exp(-0.5 * Math.pow(dist / 1.1, 2)));
        g.gain.setValueAtTime(amp, startTime);
        osc.connect(g);
        g.connect(clusterGain);
        osc.start(startTime);
        osc.stop(startTime + dur);
      }
    }
  };

  // Tone 1: C (261.6 Hz)
  playToneCluster(261.63, now, 0.7);
  // Tone 2: F# / Gb (369.99 Hz - exactly 6 semitones, 1/2 octave away)
  playToneCluster(369.99, now + 0.85, 0.7);

  const handle = {
    stop: () => {}
  };
  activeIllusionNodes = handle;
  return handle;
};

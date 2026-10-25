import React, { useState, useEffect, useRef } from 'react';
import { Course, UserProgress } from '../types';
import { CloseIcon, VolumeIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon, PenIcon } from './Icons';
import { Mascot } from './Mascot';
import confetti from 'canvas-confetti';

export interface PoemLine {
  id: string;
  text: string;
  translationRu?: string;
  translationEn?: string;
  transcription?: string;
}

export interface PoemStanza {
  stanzaNumber: number;
  lines: PoemLine[];
}

export interface Poem {
  id: string;
  title: string;
  titleTranslation?: string;
  author: string;
  authorLife?: string;
  courseId: string; // 'ru', 'en', 'kk', 'uz', 'ky', 'be', 'uk', 'hy', 'de', 'fr', 'es', 'it', 'ja', 'zh', 'all'
  languageName: string;
  flagEmoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  era?: string;
  coverGradient: string;
  stanzas: PoemStanza[];
  xpReward: number;
}

export const OFFICIAL_POEMS: Poem[] = [
  // --- РУССКИЙ ЯЗЫК ---
  {
    id: 'ru-pushkin-lukomorye',
    title: 'У лукоморья дуб зелёный',
    titleTranslation: 'At the Seashore a Green Oak (from Ruslan and Ludmila)',
    author: 'Александр Сергеевич Пушкин',
    authorLife: '1799–1837',
    courseId: 'ru',
    languageName: 'Русский',
    flagEmoji: '🇷🇺',
    difficulty: 'easy',
    era: 'Золотой век русской поэзии',
    coverGradient: 'from-emerald-700 via-teal-800 to-slate-900',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'p1', text: 'У лукоморья дуб зелёный;', translationRu: 'У лукоморья дуб зелёный;', translationEn: 'By a curving shore a green oak stands;' },
          { id: 'p2', text: 'Златая цепь на дубе том:', translationRu: 'Златая цепь на дубе том:', translationEn: 'A golden chain upon that oak:' },
          { id: 'p3', text: 'И днём и ночью кот учёный', translationRu: 'И днём и ночью кот учёный', translationEn: 'And day and night a learned cat' },
          { id: 'p4', text: 'Всё ходит по цепи кругом;', translationRu: 'Всё ходит по цепи кругом;', translationEn: 'Walks round and round along the chain;' }
        ]
      },
      {
        stanzaNumber: 2,
        lines: [
          { id: 'p5', text: 'Идёт направо — песнь заводит,', translationRu: 'Идёт направо — песнь заводит,', translationEn: 'Steps to the right — a song it sings,' },
          { id: 'p6', text: 'Налево — сказку говорит.', translationRu: 'Налево — сказку говорит.', translationEn: 'Steps to the left — a tale it tells.' },
          { id: 'p7', text: 'Там чудеса: там леший бродит,', translationRu: 'Там чудеса: там леший бродит,', translationEn: 'There wonders dwell: the wood-sprite roams,' },
          { id: 'p8', text: 'Русалка на ветвях сидит;', translationRu: 'Русалка на ветвях сидит;', translationEn: 'A mermaid perches in the boughs;' }
        ]
      }
    ]
  },
  {
    id: 'ru-lermontov-parus',
    title: 'Парус',
    titleTranslation: 'The Sail',
    author: 'Михаил Юрьевич Лермонтов',
    authorLife: '1814–1841',
    courseId: 'ru',
    languageName: 'Русский',
    flagEmoji: '🇷🇺',
    difficulty: 'easy',
    era: 'Романтизм',
    coverGradient: 'from-blue-700 via-sky-800 to-indigo-950',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'l1', text: 'Белеет парус одинокой', translationRu: 'Белеет парус одинокой', translationEn: 'A lonely sail shows white and bare' },
          { id: 'l2', text: 'В тумане моря голубом!..', translationRu: 'В тумане моря голубом!..', translationEn: 'In blue mist rising from the sea!..' },
          { id: 'l3', text: 'Что ищет он в стране далёкой?', translationRu: 'Что ищет он в стране далёкой?', translationEn: 'What does it seek in distant air?' },
          { id: 'l4', text: 'Что кинул он в краю родном?..', translationRu: 'Что кинул он в краю родном?..', translationEn: 'What has it left behind on lea?..' }
        ]
      },
      {
        stanzaNumber: 2,
        lines: [
          { id: 'l5', text: 'Играют волны — ветер свищет,', translationRu: 'Играют волны — ветер свищет,', translationEn: 'The waves play high, the wind is crying,' },
          { id: 'l6', text: 'И мачта гнётся и скрыпит...', translationRu: 'И мачта гнётся и скрыпит...', translationEn: 'The mast is bending with a groan...' },
          { id: 'l7', text: 'Увы! он счастия не ищет,', translationRu: 'Увы! он счастия не ищет,', translationEn: 'Alas! It is not joy it’s plying,' },
          { id: 'l8', text: 'И не от счастия бежит!', translationRu: 'И не от счастия бежит!', translationEn: 'Nor from happiness has flown!' }
        ]
      }
    ]
  },
  {
    id: 'ru-esenin-bereza',
    title: 'Берёза',
    titleTranslation: 'The Birch Tree',
    author: 'Сергей Александрович Есенин',
    authorLife: '1895–1925',
    courseId: 'ru',
    languageName: 'Русский',
    flagEmoji: '🇷🇺',
    difficulty: 'easy',
    era: 'Серебряный век',
    coverGradient: 'from-slate-700 via-indigo-900 to-sky-950',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'e1', text: 'Белая берёза', translationRu: 'Белая берёза', translationEn: 'A white birch tree' },
          { id: 'e2', text: 'Под моим окном', translationRu: 'Под моим окном', translationEn: 'Beneath my window' },
          { id: 'e3', text: 'Принакрылась снегом,', translationRu: 'Принакрылась снегом,', translationEn: 'Veiled itself in snow,' },
          { id: 'e4', text: 'Точно серебром.', translationRu: 'Точно серебром.', translationEn: 'Just like pure silver.' }
        ]
      },
      {
        stanzaNumber: 2,
        lines: [
          { id: 'e5', text: 'На пушистых ветках', translationRu: 'На пушистых ветках', translationEn: 'On its fluffy branches' },
          { id: 'e6', text: 'Снежною каймой', translationRu: 'Снежною каймой', translationEn: 'With a snowy rim' },
          { id: 'e7', text: 'Распустились кисти', translationRu: 'Распустились кисти', translationEn: 'Tassels have blossomed' },
          { id: 'e8', text: 'Белой бахромой.', translationRu: 'Белой бахромой.', translationEn: 'Like white fringe.' }
        ]
      }
    ]
  },

  // --- ENGLISH ---
  {
    id: 'en-frost-road-not-taken',
    title: 'The Road Not Taken',
    titleTranslation: 'Неизбранная дорога',
    author: 'Robert Frost',
    authorLife: '1874–1963',
    courseId: 'en',
    languageName: 'English',
    flagEmoji: '🇬🇧',
    difficulty: 'medium',
    era: 'American Classic',
    coverGradient: 'from-amber-700 via-yellow-800 to-stone-900',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'f1', text: 'Two roads diverged in a yellow wood,', translationRu: 'Две дороги расходились в осеннем лесу,', translationEn: 'Two roads diverged in a yellow wood,' },
          { id: 'f2', text: 'And sorry I could not travel both', translationRu: 'И жаль, я не мог пройти по обеим сразу', translationEn: 'And sorry I could not travel both' },
          { id: 'f3', text: 'And be one traveler, long I stood', translationRu: 'И будучи одним путником, долго стоял я', translationEn: 'And be one traveler, long I stood' },
          { id: 'f4', text: 'And looked down one as far as I could', translationRu: 'И вглядывался в одну из них так далеко, как мог,', translationEn: 'And looked down one as far as I could' },
          { id: 'f5', text: 'To where it bent in the undergrowth;', translationRu: 'Туда, где она исчезала в зарослях;', translationEn: 'To where it bent in the undergrowth;' }
        ]
      },
      {
        stanzaNumber: 2,
        lines: [
          { id: 'f6', text: 'I took the one less traveled by,', translationRu: 'Я выбрал ту, по которой реже ходили,', translationEn: 'I took the one less traveled by,' },
          { id: 'f7', text: 'And that has made all the difference.', translationRu: 'И это решило абсолютно всё.', translationEn: 'And that has made all the difference.' }
        ]
      }
    ]
  },
  {
    id: 'en-shakespeare-sonnet-18',
    title: 'Sonnet 18',
    titleTranslation: 'Сонет 18: Сравню ли с летним днём твои черты?',
    author: 'William Shakespeare',
    authorLife: '1564–1616',
    courseId: 'en',
    languageName: 'English',
    flagEmoji: '🇬🇧',
    difficulty: 'hard',
    era: 'Renaissance',
    coverGradient: 'from-purple-800 via-violet-900 to-indigo-950',
    xpReward: 40,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 's1', text: 'Shall I compare thee to a summer’s day?', translationRu: 'Сравню ли с летним днем твои черты?', translationEn: 'Shall I compare thee to a summer’s day?' },
          { id: 's2', text: 'Thou art more lovely and more temperate:', translationRu: 'Но ты милей, умеренней и краше:', translationEn: 'Thou art more lovely and more temperate:' },
          { id: 's3', text: 'Rough winds do shake the darling buds of May,', translationRu: 'Дрожат от бурь майские цветы,', translationEn: 'Rough winds do shake the darling buds of May,' },
          { id: 's4', text: 'And summer’s lease hath all too short a date;', translationRu: 'И слишком краток срок у лета нашего;', translationEn: 'And summer’s lease hath all too short a date;' }
        ]
      }
    ]
  },

  // --- KAZAKH ---
  {
    id: 'kk-abai-gylym',
    title: 'Ғылым таппай мақтанба',
    titleTranslation: 'Без науки не хвались',
    author: 'Абай Құнанбаев',
    authorLife: '1845–1904',
    courseId: 'kk',
    languageName: 'Қазақ тілі',
    flagEmoji: '🇰🇿',
    difficulty: 'medium',
    era: 'Классическая казахская поэзия',
    coverGradient: 'from-sky-700 via-teal-800 to-emerald-950',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'ab1', text: 'Ғылым таппай мақтанба,', translationRu: 'Без науки не хвались,', translationEn: 'Do not boast without knowledge,' },
          { id: 'ab2', text: 'Орын таппай баптанба,', translationRu: 'Не найдя призвания, не гордись,', translationEn: 'Do not be arrogant before finding your path,' },
          { id: 'ab3', text: 'Құмарланып шаттанба,', translationRu: 'Не предавайся пустой радости,', translationEn: 'Do not rejoice in empty passions,' },
          { id: 'ab4', text: 'Ойнап босқа күлуге.', translationRu: 'Проводя время в пустом смехе.', translationEn: 'Wasting time in idle laughter.' }
        ]
      },
      {
        stanzaNumber: 2,
        lines: [
          { id: 'ab5', text: 'Бес нәрседен қашық бол,', translationRu: 'От пяти вещей беги подальше,', translationEn: 'Stay far away from five evil vices,' },
          { id: 'ab6', text: 'Бес нәрсеге асық бол,', translationRu: 'К пяти благородным вещам стремись,', translationEn: 'Eagerly strive toward five noble virtues,' },
          { id: 'ab7', text: 'Адам болам десеңіз.', translationRu: 'Если человеком стать желаешь.', translationEn: 'If you wish to truly become human.' }
        ]
      }
    ]
  },

  // --- UZBEK ---
  {
    id: 'uz-navoi-ghazal',
    title: 'Ғазал (Илм ва Ҳикмат)',
    titleTranslation: 'Газель о науке и мудрости',
    author: 'Алишер Навоий',
    authorLife: '1441–1501',
    courseId: 'uz',
    languageName: 'O‘zbek tili',
    flagEmoji: '🇺🇿',
    difficulty: 'medium',
    era: 'Темуриды / Восточный Ренессанс',
    coverGradient: 'from-emerald-700 via-cyan-800 to-slate-900',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'nv1', text: 'Билим олган киши шоҳдур жаҳонда,', translationRu: 'Обретший знание — словно царь в мире,', translationEn: 'The one who gains wisdom is a king in this world,' },
          { id: 'nv2', text: 'Ҳунарсиз юрган инсон бенишондур.', translationRu: 'Человек же без ремесла и дела — безымянен.', translationEn: 'A person without craft remains without a trace.' },
          { id: 'nv3', text: 'Ҳамиша яхшилик қилгил биродар,', translationRu: 'Всегда твори добро, о брат мой,', translationEn: 'Always do good deeds, my brother,' },
          { id: 'nv4', text: 'Яхшилик бирла олам гулистондур.', translationRu: 'Ведь добром весь мир расцветает садом.', translationEn: 'For with goodness the whole world blooms like a garden.' }
        ]
      }
    ]
  },

  // --- KYRGYZ ---
  {
    id: 'ky-osmonov-ata-zhurt',
    title: 'Ата Журт',
    titleTranslation: 'Родная земля',
    author: 'Алыкул Осмонов',
    authorLife: '1915–1950',
    courseId: 'ky',
    languageName: 'Кыргыз тили',
    flagEmoji: '🇰🇬',
    difficulty: 'medium',
    era: 'Кыргызская классика',
    coverGradient: 'from-red-800 via-rose-900 to-stone-900',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'osm1', text: 'Жылуу кийин, жолуң кыйын үшүүрсүң,', translationRu: 'Оденься теплее, путь твой труден — озябнешь,', translationEn: 'Dress warmly, your path is tough and cold,' },
          { id: 'osm2', text: 'Кыш да катуу... бороон улуп, кар уруп...', translationRu: 'Зима сурова... буря воет, бьет снег...', translationEn: 'The winter is harsh... snowstorms howl...' },
          { id: 'osm3', text: 'Зор күч менен сени сүйөм Ата Журт,', translationRu: 'С великой силой люблю тебя, Родная земля,', translationEn: 'With mighty power I love you, my Motherland,' },
          { id: 'osm4', text: 'Бүт өмүрүм сенин жолуңа арналып.', translationRu: 'Вся жизнь моя посвящена твоему пути.', translationEn: 'All my life is devoted to your path.' }
        ]
      }
    ]
  },

  // --- BELARUSIAN ---
  {
    id: 'be-bahdanovich-zorka',
    title: 'Зорка Венера',
    titleTranslation: 'Звезда Венера',
    author: 'Максім Багдановіч',
    authorLife: '1891–1917',
    courseId: 'be',
    languageName: 'Беларуская мова',
    flagEmoji: '🇧🇾',
    difficulty: 'easy',
    era: 'Срэбны век',
    coverGradient: 'from-indigo-800 via-sky-900 to-slate-950',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'zb1', text: 'Зорка Венера ўзышла над зямлёю,', translationRu: 'Звезда Венера взошла над землёю,', translationEn: 'The star Venus has risen over the earth,' },
          { id: 'zb2', text: 'Светлыя згадкі з сабой прывяла...', translationRu: 'Светлые воспоминания с собой принесла...', translationEn: 'Bringing bright memories with her light...' },
          { id: 'zb3', text: 'Помніш, калі я спаткаўся з табою,', translationRu: 'Помнишь, когда я встретился с тобою,', translationEn: 'Do you remember when I met you,' },
          { id: 'zb4', text: 'Зорка Венера над намі была.', translationRu: 'Звезда Венера сияла над нами.', translationEn: 'The star Venus shone above us both.' }
        ]
      }
    ]
  },

  // --- GERMAN ---
  {
    id: 'de-goethe-wanderers-nachtlied',
    title: 'Wanderers Nachtlied',
    titleTranslation: 'Ночная песнь странника (Горные вершины)',
    author: 'Johann Wolfgang von Goethe',
    authorLife: '1749–1832',
    courseId: 'de',
    languageName: 'Deutsch',
    flagEmoji: '🇩🇪',
    difficulty: 'easy',
    era: 'Веймарский классицизм',
    coverGradient: 'from-amber-900 via-stone-800 to-black',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'g1', text: 'Über allen Gipfeln ist Ruh,', translationRu: 'Горные вершины спят во тьме ночной;', translationEn: 'Over all the hilltops is peace,' },
          { id: 'g2', text: 'In allen Wipfeln spürest du', translationRu: 'Тихие долины полны свежей мглой;', translationEn: 'In all the treetops you feel' },
          { id: 'g3', text: 'Kaum einen Hauch;', translationRu: 'Не пылит дорога, не дрожат листы...', translationEn: 'Scarcely a breath;' },
          { id: 'g4', text: 'Die Vögelein schweigen im Walde.', translationRu: 'Птицы умолкли в лесу.', translationEn: 'The little birds are silent in the woods.' },
          { id: 'g5', text: 'Warte nur, balde ruhest du auch.', translationRu: 'Подожди немного, отдохнёшь и ты.', translationEn: 'Just wait, soon you too will rest.' }
        ]
      }
    ]
  },

  // --- FRENCH ---
  {
    id: 'fr-verlaine-chanson-d-automne',
    title: 'Chanson d’automne',
    titleTranslation: 'Осенняя песня',
    author: 'Paul Verlaine',
    authorLife: '1844–1896',
    courseId: 'fr',
    languageName: 'Français',
    flagEmoji: '🇫🇷',
    difficulty: 'medium',
    era: 'Символизм',
    coverGradient: 'from-purple-900 via-rose-950 to-slate-950',
    xpReward: 35,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'v1', text: 'Les sanglots longs', translationRu: 'Долгие рыдания', translationEn: 'The long sobs' },
          { id: 'v2', text: 'Des violons', translationRu: 'Скрипок', translationEn: 'Of the violins' },
          { id: 'v3', text: 'De l’automne', translationRu: 'Осени', translationEn: 'Of autumn' },
          { id: 'v4', text: 'Blessent mon cœur', translationRu: 'Ранят моё сердце', translationEn: 'Wound my heart' },
          { id: 'v5', text: 'D’une langueur', translationRu: 'Томительной', translationEn: 'With a languid' },
          { id: 'v6', text: 'Monotone.', translationRu: 'Монотонностью.', translationEn: 'Monotony.' }
        ]
      }
    ]
  },

  // --- SPANISH ---
  {
    id: 'es-machado-caminante',
    title: 'Caminante, no hay camino',
    titleTranslation: 'Путник, дороги нет',
    author: 'Antonio Machado',
    authorLife: '1875–1939',
    courseId: 'es',
    languageName: 'Español',
    flagEmoji: '🇪🇸',
    difficulty: 'easy',
    era: 'Поколение 98 года',
    coverGradient: 'from-orange-800 via-amber-900 to-stone-950',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'm1', text: 'Caminante, son tus huellas', translationRu: 'Путник, твои следы —', translationEn: 'Traveler, your footprints are' },
          { id: 'm2', text: 'el camino y nada más;', translationRu: 'это и есть дорога, и ничего больше;', translationEn: 'the road, and nothing more;' },
          { id: 'm3', text: 'caminante, no hay camino,', translationRu: 'путник, нет готовой дороги,', translationEn: 'traveler, there is no road,' },
          { id: 'm4', text: 'se hace camino al andar.', translationRu: 'дорога рождается шагом.', translationEn: 'you make the road as you walk.' }
        ]
      }
    ]
  },

  // --- JAPANESE (HAIKU) ---
  {
    id: 'ja-basho-furu-ike',
    title: '古池や (Старый пруд)',
    titleTranslation: 'Old Pond Haiku',
    author: 'Мацуо Басё (松尾芭蕉)',
    authorLife: '1644–1694',
    courseId: 'ja',
    languageName: '日本語',
    flagEmoji: '🇯🇵',
    difficulty: 'easy',
    era: 'Эпоха Эдо / Хайку',
    coverGradient: 'from-emerald-900 via-teal-950 to-black',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'j1', text: '古池や (Furuike ya)', translationRu: 'Старый пруд,', translationEn: 'Old silent pond,' },
          { id: 'j2', text: '蛙飛びこむ (Kawazu tobikomu)', translationRu: 'Прыгнула в воду лягушка —', translationEn: 'A frog leaps into the water —' },
          { id: 'j3', text: '水の音 (Mizu no oto)', translationRu: 'Всплеск в тишине.', translationEn: 'Sound of the water.' }
        ]
      }
    ]
  },

  // --- CHINESE ---
  {
    id: 'zh-libai-quiet-night',
    title: '静夜思 (Думы тихой ночью)',
    titleTranslation: 'Quiet Night Thought',
    author: 'Ли Бо (李白)',
    authorLife: '701–762',
    courseId: 'zh',
    languageName: '中文',
    flagEmoji: '🇨🇳',
    difficulty: 'easy',
    era: 'Эпоха Тан',
    coverGradient: 'from-rose-900 via-purple-950 to-slate-950',
    xpReward: 30,
    stanzas: [
      {
        stanzaNumber: 1,
        lines: [
          { id: 'zh1', text: '床前明月光 (Chuáng qián míng yuè guāng)', translationRu: 'Перед постелью сияет свет луны,', translationEn: 'Moonlight shines before my bed,' },
          { id: 'zh2', text: '疑是地上霜 (Yí shì dì shàng shuāng)', translationRu: 'Кажется, будто это иней на земле.', translationEn: 'Looking like frost upon the ground.' },
          { id: 'zh3', text: '举头望明月 (Jǔ tóu wàng míng yuè)', translationRu: 'Поднимаю голову — смотрю на яркую луну,', translationEn: 'I raise my head to gaze at the bright moon,' },
          { id: 'zh4', text: '低头思故乡 (Dī tóu sī gù xiāng)', translationRu: 'Опускаю голову — тоскую о родном краю.', translationEn: 'I lower my head and think of my homeland.' }
        ]
      }
    ]
  }
];

interface DuoWindo6601PoemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourse: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  speakText?: (text: string, courseId: string, slow?: boolean) => void;
}

type TrainingStep = 'select' | 'stage1_read' | 'stage2_blanks' | 'stage3_reorder' | 'stage4_recite' | 'custom_poem';

export const DuoWindo6601PoemModal: React.FC<DuoWindo6601PoemModalProps> = ({
  isOpen,
  onClose,
  currentCourse,
  user,
  setUser,
  playSound,
  setToast,
  speakText
}) => {
  const isRu = user.language === 'ru';
  const learnedPoems = user.learnedPoems || [];

  const [step, setStep] = useState<TrainingStep>('select');
  const [selectedPoem, setSelectedPoem] = useState<Poem>(OFFICIAL_POEMS[0]);
  const [filterLang, setFilterLang] = useState<string>('recommended'); // 'recommended', 'all', or course id
  
  // Custom poem form
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customText, setCustomText] = useState('');

  // Stage 1: Read & Audio playback state
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);

  // Stage 2: Vanishing Words state
  const [blankDifficulty, setBlankDifficulty] = useState<25 | 50 | 75 | 100>(50); // 100 is first letters only
  const [userFilledWords, setUserFilledWords] = useState<Record<string, string>>({}); // lineId_wordIndex -> entered word
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});

  // Stage 3: Reorder lines
  const [scrambledLines, setScrambledLines] = useState<PoemLine[]>([]);
  const [orderedLineIds, setOrderedLineIds] = useState<string[]>([]);
  const [reorderError, setReorderError] = useState(false);

  // Stage 4: Recitation & Speech recognition
  const [reciteInput, setReciteInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [reciteAccuracy, setReciteAccuracy] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Web Speech API ref
  const recognitionRef = useRef<any>(null);

  // Initial filter setup based on course
  useEffect(() => {
    if (isOpen) {
      // Find matching poem for course
      const matched = OFFICIAL_POEMS.find(p => p.courseId === currentCourse.id);
      if (matched) {
        setSelectedPoem(matched);
      } else {
        setSelectedPoem(OFFICIAL_POEMS[0]);
      }
      setStep('select');
      setIsCompleted(false);
      setReciteAccuracy(null);
    }
  }, [isOpen, currentCourse.id]);

  if (!isOpen) return null;

  // Filter poems list
  const filteredPoems = OFFICIAL_POEMS.filter(p => {
    if (filterLang === 'recommended') {
      return p.courseId === currentCourse.id || p.courseId === 'ru';
    }
    if (filterLang === 'all') return true;
    return p.courseId === filterLang;
  });

  const allLines = selectedPoem.stanzas.flatMap(s => s.lines);
  const fullPoemText = allLines.map(l => l.text).join('\n');

  // Audio helper
  const handlePlayLine = (text: string, lineId: string) => {
    playSound('click');
    setActiveLineId(lineId);
    if (speakText) {
      speakText(text, selectedPoem.courseId, false);
    }
    setTimeout(() => setActiveLineId(null), 3000);
  };

  const handlePlayAll = () => {
    playSound('click');
    setToast(isRu ? '🎧 Прослушивание всего стихотворения...' : '🎧 Listening to the whole poem...');
    if (speakText) {
      allLines.forEach((line, index) => {
        setTimeout(() => {
          setActiveLineId(line.id);
          speakText(line.text, selectedPoem.courseId, false);
        }, index * 2600);
      });
      setTimeout(() => setActiveLineId(null), allLines.length * 2600 + 1000);
    }
  };

  // Launch Stage 2
  const startStage2 = () => {
    playSound('select');
    setStep('stage2_blanks');
    setUserFilledWords({});
    setRevealedWords({});
  };

  // Launch Stage 3
  const startStage3 = () => {
    playSound('select');
    setStep('stage3_reorder');
    // Scramble lines from first stanza or first 4 lines
    const targetLines = allLines.slice(0, 4);
    const shuffled = [...targetLines].sort(() => Math.random() - 0.5);
    setScrambledLines(shuffled);
    setOrderedLineIds([]);
    setReorderError(false);
  };

  // Launch Stage 4
  const startStage4 = () => {
    playSound('select');
    setStep('stage4_recite');
    setReciteInput('');
    setReciteAccuracy(null);
  };

  // Select a line in stage 3
  const handleSelectReorderLine = (line: PoemLine) => {
    playSound('click');
    const nextOrder = [...orderedLineIds, line.id];
    setOrderedLineIds(nextOrder);

    const targetLines = allLines.slice(0, 4);
    if (nextOrder.length === targetLines.length) {
      const isCorrect = nextOrder.every((id, idx) => id === targetLines[idx].id);
      if (isCorrect) {
        playSound('correct');
        setToast(isRu ? '🎉 Отлично! Строки расставлены верно!' : '🎉 Perfect! Lines in correct order!');
      } else {
        playSound('wrong');
        setReorderError(true);
        setTimeout(() => {
          setOrderedLineIds([]);
          setReorderError(false);
        }, 1200);
      }
    }
  };

  // Voice speech check in stage 4
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast(isRu ? 'Микрофон не поддерживается браузером. Введите текст вручную.' : 'Speech API not supported in browser. Please type.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedPoem.courseId === 'ru' ? 'ru-RU' : selectedPoem.courseId === 'en' ? 'en-US' : selectedPoem.courseId === 'kk' ? 'kk-KZ' : 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        playSound('click');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setReciteInput(transcript.trim());
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
      setToast(isRu ? 'Ошибка доступа к микрофону' : 'Microphone access error');
    }
  };

  // Compute recitation accuracy score (Levenshtein / word match)
  const handleCheckRecitation = () => {
    playSound('click');
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-zA-Zа-яА-ЯёЁәғқңөұүһі0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
    const targetWords = normalize(fullPoemText);
    const inputWords = normalize(reciteInput);

    if (inputWords.length === 0) {
      setToast(isRu ? 'Пожалуйста, расскажите или введите стихотворение!' : 'Please recite or type the poem!');
      return;
    }

    let matched = 0;
    inputWords.forEach(w => {
      if (targetWords.includes(w)) matched++;
    });

    const accuracy = Math.min(100, Math.round((matched / Math.max(1, targetWords.length)) * 100));
    setReciteAccuracy(accuracy);

    if (accuracy >= 65) {
      playSound('fanfare');
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setIsCompleted(true);

      const alreadyLearned = learnedPoems.includes(selectedPoem.id);
      if (!alreadyLearned) {
        setUser(prev => ({
          ...prev,
          xp: prev.xp + selectedPoem.xpReward,
          gems: prev.gems + 5,
          learnedPoems: [...(prev.learnedPoems || []), selectedPoem.id]
        }));
        setToast(isRu 
          ? `🏆 Стихотворение выучено наизусть! +${selectedPoem.xpReward} XP и +5 💎!` 
          : `🏆 Poem memorized by heart! +${selectedPoem.xpReward} XP & +5 💎!`
        );
      } else {
        setUser(prev => ({
          ...prev,
          xp: prev.xp + 15
        }));
        setToast(isRu ? '🌟 Повторение стихотворения завершено! +15 XP' : '🌟 Poem review completed! +15 XP');
      }
    } else {
      playSound('wrong');
      setToast(isRu ? `Точность ${accuracy}%. Повторите строки ещё раз!` : `Accuracy: ${accuracy}%. Review lines again!`);
    }
  };

  // Save custom user poem
  const handleSaveCustomPoem = () => {
    if (!customTitle.trim() || !customText.trim()) {
      setToast(isRu ? 'Заполните название и текст стихотворения' : 'Fill title and text');
      return;
    }

    const lines = customText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `custom-line-${idx}`,
        text,
        translationRu: text
      }));

    const newPoem: Poem = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      author: customAuthor.trim() || (isRu ? 'Пользователь DuoWindo6601' : 'User'),
      courseId: currentCourse.id,
      languageName: currentCourse.localName,
      flagEmoji: '✍️',
      difficulty: 'easy',
      era: 'Пользовательское стихотворение',
      coverGradient: 'from-purple-800 via-indigo-900 to-slate-900',
      xpReward: 30,
      stanzas: [{ stanzaNumber: 1, lines }]
    };

    setSelectedPoem(newPoem);
    setStep('stage1_read');
    playSound('fanfare');
    setToast(isRu ? '🎉 Стихотворение добавлено в тренажёр!' : '🎉 Poem added to trainer!');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-[#131f24] border-4 border-[#243946] rounded-3xl md:rounded-[2.5rem] max-w-4xl w-full p-5 md:p-8 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ============================================================== */}
        {/* MODAL HEADER                                                   */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-4 border-b border-[#243946] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-2xl shadow-lg ring-2 ring-purple-400/40">
              📜
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-din font-black text-xl md:text-2xl text-white uppercase tracking-wider">
                  {isRu ? 'Выучить стихотворение наизусть' : 'Memorize Poem by Heart'}
                </h2>
                <span className="bg-purple-500/30 text-purple-300 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  DuoWindo6601 Поэзия
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-bold mt-0.5">
                {isRu 
                  ? 'Метод исчезающих слов, ритмическая озвучка и проверка декламации' 
                  : 'Vanishing words technique, audio recitation and memory recitation test'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/20 flex items-center gap-1 shadow-sm"
              title={isRu ? "Пропустить выучить стихотворение" : "Skip poem memorization"}
            >
              <span>{isRu ? 'Пропустить' : 'Skip'}</span>
              <span>✕</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Закрыть"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVIGATION TABS / STAGES                                       */}
        {/* ============================================================== */}
        {step !== 'select' && step !== 'custom_poem' && (
          <div className="py-3 px-2 border-b border-[#243946] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => { playSound('click'); setStep('select'); }}
              className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/60 hover:bg-gray-700 transition-colors"
            >
              <span>←</span>
              <span>{isRu ? 'К списку стихов' : 'All Poems'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-black">
              <button
                type="button"
                onClick={() => { playSound('click'); setStep('stage1_read'); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${step === 'stage1_read' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}
              >
                1. 📖 {isRu ? 'Чтение & Аудио' : 'Read & Listen'}
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); startStage2(); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${step === 'stage2_blanks' ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}
              >
                2. 🧩 {isRu ? 'Исчезающие слова' : 'Vanishing'}
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); startStage3(); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${step === 'stage3_reorder' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}
              >
                3. 🔀 {isRu ? 'Порядок строк' : 'Order Lines'}
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); startStage4(); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${step === 'stage4_recite' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-800/60 text-gray-400 hover:text-white'}`}
              >
                4. 🎤 {isRu ? 'Наизусть' : 'Recite'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE: SELECT POEM / LIBRARY                                   */}
        {/* ============================================================== */}
        {step === 'select' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterLang('recommended')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterLang === 'recommended' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  ⭐ {isRu ? 'Рекомендовано курсом' : 'Recommended'} ({currentCourse.localName})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLang('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterLang === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                  🌍 {isRu ? 'Все языки мира' : 'All World Poems'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { playSound('click'); setStep('custom_poem'); }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>{isRu ? 'Добавить своё стихотворение' : 'Add custom poem'}</span>
              </button>
            </div>

            {/* Grid of Poems */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {filteredPoems.map(poem => {
                const isLearned = learnedPoems.includes(poem.id);
                return (
                  <div
                    key={poem.id}
                    onClick={() => {
                      playSound('click');
                      setSelectedPoem(poem);
                      setStep('stage1_read');
                    }}
                    className={`bg-gradient-to-r ${poem.coverGradient} border-2 ${isLearned ? 'border-emerald-500/80 shadow-emerald-950/40' : 'border-gray-700/80 hover:border-purple-400'} rounded-3xl p-5 text-left transition-all cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.99] group flex flex-col justify-between relative overflow-hidden`}
                  >
                    {isLearned && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span>✓</span>
                        <span>{isRu ? 'Выучено наизусть' : 'Memorized'}</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{poem.flagEmoji}</span>
                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                          {poem.languageName} • {poem.era || 'Классика'}
                        </span>
                      </div>
                      <h3 className="font-black text-lg md:text-xl text-white group-hover:text-purple-200 transition-colors">
                        {poem.title}
                      </h3>
                      {poem.titleTranslation && poem.titleTranslation !== poem.title && (
                        <p className="text-xs text-purple-200/70 font-semibold italic">
                          {poem.titleTranslation}
                        </p>
                      )}
                      <p className="text-xs text-gray-300 font-bold mt-1">
                        ✍️ {poem.author} {poem.authorLife ? `(${poem.authorLife})` : ''}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-gray-200">
                      <span className="flex items-center gap-1 text-amber-300">
                        <span>⚡</span>
                        <span>+{poem.xpReward} XP</span>
                      </span>
                      <span className="text-sky-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>{isRu ? 'Учить наизусть' : 'Start learning'}</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 1: READ & LISTEN                                         */}
        {/* ============================================================== */}
        {step === 'stage1_read' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="bg-[#18262e] border-2 border-[#2b404d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">{selectedPoem.title}</h3>
                <p className="text-xs text-purple-300 font-bold">
                  {selectedPoem.author} • {selectedPoem.languageName} {selectedPoem.flagEmoji}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="bg-duo-green hover:brightness-110 active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <VolumeIcon className="w-4 h-4" />
                  <span>{isRu ? 'Слушать целиком' : 'Play Full Poem'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTranslations(!showTranslations)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer border border-gray-700"
                >
                  {showTranslations ? '👁️ Скрыть перевод' : '👁️ Показать перевод'}
                </button>
              </div>
            </div>

            {/* Poem Stanzas display */}
            <div className="bg-[#10181d] border-2 border-[#20323d] rounded-3xl p-6 md:p-8 space-y-6 shadow-inner text-left font-serif">
              {selectedPoem.stanzas.map(stanza => (
                <div key={stanza.stanzaNumber} className="space-y-2.5">
                  {stanza.lines.map(line => {
                    const isActive = activeLineId === line.id;
                    return (
                      <div
                        key={line.id}
                        onClick={() => handlePlayLine(line.text, line.id)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                          isActive
                            ? 'bg-purple-900/60 border border-purple-400 shadow-md ring-2 ring-purple-400/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div>
                          <p className={`text-base md:text-lg font-bold ${isActive ? 'text-purple-200' : 'text-gray-100 group-hover:text-white'}`}>
                            {line.text}
                          </p>
                          {showTranslations && (line.translationRu || line.translationEn) && (
                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                              {isRu ? line.translationRu : (line.translationEn || line.translationRu)}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          className="opacity-70 group-hover:opacity-100 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 ml-3"
                          title="Озвучить строку"
                        >
                          <VolumeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-bold">
                Шаг 1 из 4: прочитайте и послушайте ритм строк
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  title="Пропустить выучить стихотворение"
                >
                  {isRu ? 'Пропустить' : 'Skip'}
                </button>
                <button
                  type="button"
                  onClick={startStage2}
                  className="flex-1 sm:flex-initial bg-duo-blue hover:brightness-110 active:scale-95 text-white font-black text-xs md:text-sm px-6 py-3 rounded-2xl border-b-4 border-duo-blueDark uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isRu ? 'К шагу 2: Исчезающие слова' : 'Next: Vanishing Words'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 2: VANISHING WORDS (МЕТОД ИСЧЕЗАЮЩИХ СЛОВ)               */}
        {/* ============================================================== */}
        {step === 'stage2_blanks' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="bg-[#18262e] border-2 border-[#2b404d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>🧩 Метод исчезающих слов</span>
                </h4>
                <p className="text-xs text-gray-300 font-medium">
                  {isRu ? 'Скрывайте слова и вспоминайте их по памяти, восстанавливая ритм' : 'Hide words and recall them from memory'}
                </p>
              </div>

              {/* Difficulty selector */}
              <div className="flex items-center gap-1.5">
                {[
                  { lvl: 25 as const, label: '25% скрыто' },
                  { lvl: 50 as const, label: '50% скрыто' },
                  { lvl: 75 as const, label: '75% скрыто' },
                  { lvl: 100 as const, label: 'Первые буквы (У л д з...)' }
                ].map(opt => (
                  <button
                    key={opt.lvl}
                    type="button"
                    onClick={() => { playSound('click'); setBlankDifficulty(opt.lvl); }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                      blankDifficulty === opt.lvl
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vanishing Lines Container */}
            <div className="bg-[#10181d] border-2 border-[#20323d] rounded-3xl p-6 md:p-8 space-y-4 shadow-inner text-left font-serif">
              {allLines.map((line, lIdx) => {
                const words = line.text.split(' ');
                return (
                  <div key={line.id} className="text-base md:text-lg leading-relaxed flex flex-wrap items-center gap-2 py-1 border-b border-white/5">
                    <span className="text-xs text-gray-500 font-sans font-bold w-6 select-none">{lIdx + 1}.</span>
                    {words.map((w, wIdx) => {
                      const wordKey = `${line.id}_${wIdx}`;
                      const isHidden = (wIdx % (blankDifficulty === 25 ? 4 : blankDifficulty === 50 ? 2 : blankDifficulty === 75 ? 1.5 : 1)) < 1;
                      const isRevealed = revealedWords[wordKey];

                      if (blankDifficulty === 100) {
                        // First letters mode
                        const firstLetter = w.charAt(0);
                        const punctuation = w.replace(/[a-zA-Zа-яА-ЯёЁәғқңөұүһі]/g, '');
                        return (
                          <span
                            key={wIdx}
                            onClick={() => {
                              playSound('click');
                              setRevealedWords(prev => ({ ...prev, [wordKey]: !isRevealed }));
                            }}
                            className={`cursor-pointer px-1.5 py-0.5 rounded-md font-mono text-sm transition-all ${
                              isRevealed 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-serif' 
                                : 'bg-gray-800 text-amber-300 border border-amber-500/30 hover:border-amber-400'
                            }`}
                            title="Нажмите, чтобы показать полное слово"
                          >
                            {isRevealed ? w : `${firstLetter}__${punctuation}`}
                          </span>
                        );
                      }

                      if (isHidden && !isRevealed) {
                        return (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => {
                              playSound('click');
                              setRevealedWords(prev => ({ ...prev, [wordKey]: true }));
                            }}
                            className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 px-2 py-0.5 rounded-lg text-xs md:text-sm font-sans font-black transition-all cursor-pointer animate-pulse"
                            title="Вспомнили слово? Кликните для проверки"
                          >
                            [ ??? ]
                          </button>
                        );
                      }

                      return (
                        <span key={wIdx} className="text-white">
                          {w}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRevealedWords({})}
                  className="text-xs text-gray-400 hover:text-white font-bold px-3 py-2 rounded-xl bg-gray-800"
                >
                  🔄 Сбросить и скрыть снова
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-gray-400 hover:text-white font-bold px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  title="Пропустить выучить стихотворение"
                >
                  {isRu ? 'Пропустить' : 'Skip'}
                </button>
              </div>
              <button
                type="button"
                onClick={startStage3}
                className="w-full sm:w-auto bg-sky-600 hover:brightness-110 active:scale-95 text-white font-black text-xs md:text-sm px-6 py-3 rounded-2xl border-b-4 border-sky-800 uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isRu ? 'К шагу 3: Собрать строки' : 'Next: Reorder Lines'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 3: REORDER LINES                                         */}
        {/* ============================================================== */}
        {step === 'stage3_reorder' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="bg-[#18262e] border-2 border-[#2b404d] rounded-2xl p-4">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <span>🔀 Соберите четверостишие по памяти</span>
              </h4>
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                {isRu ? 'Нажимайте на строки в правильном порядке их рифмы и звучания' : 'Tap lines in the correct poetic order'}
              </p>
            </div>

            {/* Ordered slots */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Ваш собранный стих:
              </p>
              <div className={`min-h-[140px] bg-[#10181d] border-2 ${reorderError ? 'border-red-500 animate-shake' : 'border-[#20323d]'} rounded-2xl p-4 space-y-2`}>
                {orderedLineIds.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-8">
                    {isRu ? 'Нажимайте на перемешанные строки ниже, чтобы выстроить четверостишие' : 'Tap scrambled lines below to order'}
                  </p>
                ) : (
                  orderedLineIds.map((id, idx) => {
                    const l = allLines.find(x => x.id === id);
                    return (
                      <div key={id} className="p-2.5 bg-purple-950/60 border border-purple-500/40 rounded-xl text-sm font-serif font-bold text-white flex items-center gap-2">
                        <span className="text-xs text-purple-300 w-5">{idx + 1}.</span>
                        <span>{l?.text}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Available scrambled pool */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Строки в случайном порядке:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {scrambledLines.map(line => {
                  const isUsed = orderedLineIds.includes(line.id);
                  return (
                    <button
                      key={line.id}
                      type="button"
                      disabled={isUsed}
                      onClick={() => handleSelectReorderLine(line)}
                      className={`p-3.5 rounded-2xl text-left font-serif text-sm md:text-base font-bold transition-all ${
                        isUsed
                          ? 'opacity-30 bg-gray-900 border border-gray-800 text-gray-500'
                          : 'bg-[#1a2933] hover:bg-[#223644] border-2 border-[#2f4857] hover:border-purple-400 text-white shadow-md active:scale-[0.99] cursor-pointer'
                      }`}
                    >
                      {line.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startStage3}
                  className="text-xs text-gray-400 hover:text-white font-bold px-3 py-2 rounded-xl bg-gray-800"
                >
                  🔄 Перемешать заново
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-gray-400 hover:text-white font-bold px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  title="Пропустить выучить стихотворение"
                >
                  {isRu ? 'Пропустить' : 'Skip'}
                </button>
              </div>
              <button
                type="button"
                onClick={startStage4}
                className="w-full sm:w-auto bg-emerald-600 hover:brightness-110 active:scale-95 text-white font-black text-xs md:text-sm px-6 py-3 rounded-2xl border-b-4 border-emerald-800 uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isRu ? 'К финалу: Проверка наизусть' : 'Next: Test Memory'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 4: RECITE FROM MEMORY (ПРОВЕРКА НАИЗУСТЬ)               */}
        {/* ============================================================== */}
        {step === 'stage4_recite' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="bg-[#18262e] border-2 border-[#2b404d] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>🎤 Проверка наизусть: {selectedPoem.title}</span>
                </h4>
                <p className="text-xs text-gray-300 font-medium">
                  {isRu ? 'Расскажите стихотворение в микрофон или напечатайте строки по памяти' : 'Recite into the microphone or type from memory'}
                </p>
              </div>

              <div className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black px-3 py-1.5 rounded-xl">
                🏆 +{selectedPoem.xpReward} XP & 5 💎
              </div>
            </div>

            {/* Voice Recitation / Microphone Bar */}
            <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-slate-900/50 border-2 border-purple-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all cursor-pointer ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse text-white ring-4 ring-red-400/50' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105'
                  }`}
                  title={isRecording ? "Остановить запись" : "Включить микрофон и рассказывать"}
                >
                  {isRecording ? '⏹️' : '🎙️'}
                </button>
                <div>
                  <h5 className="font-black text-white text-sm">
                    {isRecording 
                      ? (isRu ? 'Слушаю вас... Декламируйте стихотворение!' : 'Listening... Recite the poem!') 
                      : (isRu ? 'Нажмите микрофон и расскажите вслух' : 'Tap mic and recite aloud')}
                  </h5>
                  <p className="text-xs text-purple-200/80">
                    {isRecording ? 'Говорите громко и выразительно' : 'Или используйте поле ввода текста ниже'}
                  </p>
                </div>
              </div>

              {reciteAccuracy !== null && (
                <div className={`px-4 py-2 rounded-2xl text-center font-black ${reciteAccuracy >= 65 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'}`}>
                  <div className="text-lg md:text-xl">{reciteAccuracy}%</div>
                  <div className="text-[10px] uppercase tracking-wider">{reciteAccuracy >= 65 ? 'Отлично!' : 'Попробуйте ещё'}</div>
                </div>
              )}
            </div>

            {/* Recitation TextArea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                <span>Ваш текст наизусть:</span>
                <button
                  type="button"
                  onClick={() => setReciteInput('')}
                  className="hover:text-white"
                >
                  Очистить
                </button>
              </div>
              <textarea
                value={reciteInput}
                onChange={e => setReciteInput(e.target.value)}
                placeholder={isRu ? 'Декламируйте в микрофон или введите строки стихотворения по памяти...' : 'Recite or type the poem lines from memory...'}
                rows={5}
                className="w-full bg-[#10181d] border-2 border-[#20323d] focus:border-purple-400 rounded-2xl p-4 text-white text-sm md:text-base font-serif leading-relaxed focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Hint spoiler */}
            <details className="bg-gray-900/60 border border-gray-800 rounded-2xl p-3 text-xs text-gray-400">
              <summary className="font-bold cursor-pointer hover:text-gray-200">
                💡 Забыли строчку? Нажмите, чтобы подсмотреть первую строку
              </summary>
              <div className="mt-2 text-gray-300 font-serif text-sm pl-2 border-l-2 border-purple-500">
                {allLines[0]?.text} ...
              </div>
            </details>

            {/* Check Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer text-center"
                title="Пропустить выучить стихотворение"
              >
                {isRu ? 'Пропустить' : 'Skip'}
              </button>

              <button
                type="button"
                onClick={handleCheckRecitation}
                className="w-full sm:flex-1 py-4 bg-duo-green hover:brightness-110 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🏆</span>
                <span>{isRu ? 'ПРОВЕРИТЬ НАИЗУСТЬ: ЗАВЕРШИТЬ (+35 XP)' : 'CHECK MEMORIZATION: FINISH (+35 XP)'}</span>
              </button>

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => { playSound('click'); setStep('select'); }}
                  className="w-full sm:w-auto px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  {isRu ? 'Выбрать другой стих' : 'Choose another'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CUSTOM POEM FORM                                               */}
        {/* ============================================================== */}
        {step === 'custom_poem' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-left">
            <div className="bg-[#18262e] border-2 border-[#2b404d] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-white">
                  ✍️ Добавьте своё стихотворение для заучивания
                </h4>
                <p className="text-xs text-gray-300 font-medium">
                  {isRu ? 'Вставьте любой любимый стих на любом языке и тренируйте его наизусть' : 'Paste any poem in any language to memorize it'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs text-gray-400 hover:text-white font-bold"
              >
                Отмена
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Название стихотворения:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Например: Люблю тебя, Петра творенье..."
                  className="w-full bg-[#10181d] border-2 border-[#20323d] focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Автор (поэт):
                </label>
                <input
                  type="text"
                  value={customAuthor}
                  onChange={e => setCustomAuthor(e.target.value)}
                  placeholder="Например: А.С. Пушкин или Моё стихотворение"
                  className="w-full bg-[#10181d] border-2 border-[#20323d] focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Текст стихотворения (строки построчно):
                </label>
                <textarea
                  rows={6}
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Вставьте четверостишие или полное стихотворение по одной строчке..."
                  className="w-full bg-[#10181d] border-2 border-[#20323d] focus:border-emerald-500 rounded-2xl p-4 text-sm font-serif text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCustomPoem}
                className="w-full py-4 bg-duo-green hover:brightness-110 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark shadow-xl transition-all cursor-pointer"
              >
                Начать учить наизусть 🚀
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

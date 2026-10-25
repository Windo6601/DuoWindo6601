// Stroke point in 0-100 normalized coordinate system
export interface StrokePoint {
  x: number;
  y: number;
  angle?: number;
}

export interface StrokeGuide {
  id: number;
  order: number;
  path: StrokePoint[];
  startPoint: StrokePoint;
  endPoint: StrokePoint;
  start?: StrokePoint;
  end?: StrokePoint;
  checkpoints?: StrokePoint[];
  arrow?: { from: StrokePoint; to: StrokePoint };
  arrowPos?: StrokePoint;
  directionHintRu?: string;
  hint: string;
  hintRu: string;
  svgPath: string;
}

export interface HandwritingItem {
  id: string;
  char: string;
  name: string;
  title?: string;
  subtitle?: string;
  categoryTitleRu?: string;
  language?: string;
  sound?: string;
  soundText?: string;
  translit?: string;
  translation?: string;
  translationRu?: string;
  tipsRu?: string;
  connectionRuleRu?: string;
  type?: string;
  script: 'cyrillic' | 'latin' | 'arabic' | 'japanese' | 'hebrew' | 'other';
  category: 'alphabet' | 'forms' | 'words';
  theme?: 'travel' | 'faith' | 'family' | 'art' | 'basic' | 'ligature';
  difficulty: 'easy' | 'medium' | 'hard';
  strokes: StrokeGuide[];
  cursiveNotes?: string;
  cursiveNotesRu?: string;
  exampleWord?: { word: string; translation: string; phonetic: string };
  audioSample?: string;
}

export interface HandwritingCategory {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  icon: string;
  theme?: string;
  items: HandwritingItem[];
}

// Helper to construct simple SVG path string from point array
export const pointsToSvgPath = (points: StrokePoint[]): string => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
};

// 1. FULL ALPHABET STROKE DATA (CYRILLIC, LATIN, ARABIC, JAPANESE)
export const ALPHABET_HANDWRITING_ITEMS: HandwritingItem[] = [
  // CYRILLIC
  {
    id: 'ru_a',
    char: 'А',
    name: 'А (а)',
    sound: '[a]',
    translit: 'A',
    translation: 'Watermelon / Арбуз',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotes: 'Cursive A starts from the baseline with an oval loop and descending hook.',
    cursiveNotesRu: 'Пишется в 3 штриха: левая наклонная линия, правая наклонная линия и горизонтальная перемычка по центру.',
    exampleWord: { word: 'Арбуз', translation: 'Watermelon', phonetic: 'Ar-buz' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 50, y: 15 }, { x: 38, y: 50 }, { x: 25, y: 85 }],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 25, y: 85 },
        arrow: { from: { x: 45, y: 30 }, to: { x: 30, y: 70 } },
        hint: 'Downstroke from top center to bottom left',
        hintRu: 'Наклонная линия сверху вниз влево',
        svgPath: 'M 50 15 L 25 85'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 50, y: 15 }, { x: 62, y: 50 }, { x: 75, y: 85 }],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 75, y: 85 },
        arrow: { from: { x: 55, y: 30 }, to: { x: 70, y: 70 } },
        hint: 'Downstroke from top center to bottom right',
        hintRu: 'Наклонная линия сверху вниз вправо',
        svgPath: 'M 50 15 L 75 85'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 35, y: 58 }, { x: 50, y: 58 }, { x: 65, y: 58 }],
        startPoint: { x: 35, y: 58 },
        endPoint: { x: 65, y: 58 },
        arrow: { from: { x: 40, y: 58 }, to: { x: 60, y: 58 } },
        hint: 'Horizontal crossbar from left to right',
        hintRu: 'Горизонтальная перекладина слева направо',
        svgPath: 'M 35 58 L 65 58'
      }
    ]
  },
  {
    id: 'ru_b',
    char: 'Б',
    name: 'Б (бэ)',
    sound: '[b]',
    translit: 'B',
    translation: 'Butterfly / Бабочка',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Вертикальная стойка, правый округлый овал внизу и верхняя горизонтальная полочка.',
    exampleWord: { word: 'Бабочка', translation: 'Butterfly', phonetic: 'Ba-boch-ka' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 35, y: 15 }, { x: 35, y: 85 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 35, y: 85 },
        arrow: { from: { x: 35, y: 30 }, to: { x: 35, y: 70 } },
        hintRu: 'Вертикальная стойка сверху вниз',
        hint: 'Vertical downstroke from top to baseline',
        svgPath: 'M 35 15 L 35 85'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 35, y: 15 }, { x: 70, y: 15 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 70, y: 15 },
        arrow: { from: { x: 40, y: 15 }, to: { x: 65, y: 15 } },
        hintRu: 'Верхняя горизонтальная полочка слева направо',
        hint: 'Top horizontal stroke to the right',
        svgPath: 'M 35 15 L 70 15'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 35, y: 50 }, { x: 65, y: 50 }, { x: 70, y: 68 }, { x: 65, y: 85 }, { x: 35, y: 85 }],
        startPoint: { x: 35, y: 50 },
        endPoint: { x: 35, y: 85 },
        arrow: { from: { x: 50, y: 50 }, to: { x: 70, y: 68 } },
        hintRu: 'Нижний округлый животик по часовой стрелке',
        hint: 'Bottom round bowl clockwise',
        svgPath: 'M 35 50 C 65 50 72 65 72 68 C 72 75 65 85 35 85'
      }
    ]
  },
  {
    id: 'ru_v',
    char: 'В',
    name: 'В (вэ)',
    sound: '[v]',
    translit: 'V',
    translation: 'Water / Вода',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Стойка и два правых округлых овала (верхний чуть меньше нижнего).',
    exampleWord: { word: 'Вода', translation: 'Water', phonetic: 'Vo-da' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 35, y: 15 }, { x: 35, y: 85 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 35, y: 85 },
        hintRu: 'Вертикальная стойка',
        hint: 'Vertical spine',
        svgPath: 'M 35 15 L 35 85'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 35, y: 15 }, { x: 65, y: 15 }, { x: 68, y: 32 }, { x: 35, y: 50 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 35, y: 50 },
        hintRu: 'Верхний полукруг',
        hint: 'Upper bowl',
        svgPath: 'M 35 15 C 65 15 68 30 68 32 C 68 45 55 50 35 50'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 35, y: 50 }, { x: 70, y: 50 }, { x: 72, y: 68 }, { x: 35, y: 85 }],
        startPoint: { x: 35, y: 50 },
        endPoint: { x: 35, y: 85 },
        hintRu: 'Нижний полукруг',
        hint: 'Lower bowl',
        svgPath: 'M 35 50 C 70 50 72 65 72 68 C 72 80 55 85 35 85'
      }
    ]
  },
  {
    id: 'ru_g',
    char: 'Г',
    name: 'Г (гэ)',
    sound: '[ɡ]',
    translit: 'G',
    translation: 'City / Город',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Вертикальная линия и верхняя перекладина.',
    exampleWord: { word: 'Город', translation: 'City', phonetic: 'Go-rod' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 35, y: 15 }, { x: 35, y: 85 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 35, y: 85 },
        hintRu: 'Вертикальная стойка сверху вниз',
        hint: 'Vertical downstroke',
        svgPath: 'M 35 15 L 35 85'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 35, y: 15 }, { x: 70, y: 15 }],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 70, y: 15 },
        hintRu: 'Верхняя горизонтальная полка',
        hint: 'Top horizontal stroke',
        svgPath: 'M 35 15 L 70 15'
      }
    ]
  },
  {
    id: 'ru_d',
    char: 'Д',
    name: 'Д (дэ)',
    sound: '[d]',
    translit: 'D',
    translation: 'House / Дом',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'medium',
    cursiveNotesRu: 'Трапеция на горизонтальной подставке с двумя нижними ножками.',
    exampleWord: { word: 'Дом', translation: 'House', phonetic: 'Dom' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 50, y: 20 }, { x: 35, y: 70 }],
        startPoint: { x: 50, y: 20 },
        endPoint: { x: 35, y: 70 },
        hintRu: 'Левый скат крыши',
        hint: 'Left roof slant',
        svgPath: 'M 50 20 L 35 70'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 50, y: 20 }, { x: 65, y: 70 }],
        startPoint: { x: 50, y: 20 },
        endPoint: { x: 65, y: 70 },
        hintRu: 'Правый скат крыши',
        hint: 'Right roof slant',
        svgPath: 'M 50 20 L 65 70'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 25, y: 70 }, { x: 75, y: 70 }],
        startPoint: { x: 25, y: 70 },
        endPoint: { x: 75, y: 70 },
        hintRu: 'Горизонтальное основание',
        hint: 'Horizontal base',
        svgPath: 'M 25 70 L 75 70'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 28, y: 70 }, { x: 28, y: 88 }],
        startPoint: { x: 28, y: 70 },
        endPoint: { x: 28, y: 88 },
        hintRu: 'Левая ножка вниз',
        hint: 'Left leg down',
        svgPath: 'M 28 70 L 28 88'
      },
      {
        id: 5,
        order: 5,
        path: [{ x: 72, y: 70 }, { x: 72, y: 88 }],
        startPoint: { x: 72, y: 70 },
        endPoint: { x: 72, y: 88 },
        hintRu: 'Правая ножка вниз',
        hint: 'Right leg down',
        svgPath: 'M 72 70 L 72 88'
      }
    ]
  },
  {
    id: 'ru_m',
    char: 'М',
    name: 'М (эм)',
    sound: '[m]',
    translit: 'M',
    translation: 'Sea / Море',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'medium',
    cursiveNotesRu: 'Две вертикальные стойки с центральной галочкой (углом вниз до основания).',
    exampleWord: { word: 'Море', translation: 'Sea', phonetic: 'Mo-re' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 28, y: 85 }, { x: 28, y: 15 }],
        startPoint: { x: 28, y: 85 },
        endPoint: { x: 28, y: 15 },
        hintRu: 'Левая вертикаль снизу вверх',
        hint: 'Left vertical up',
        svgPath: 'M 28 85 L 28 15'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 28, y: 15 }, { x: 50, y: 65 }],
        startPoint: { x: 28, y: 15 },
        endPoint: { x: 50, y: 65 },
        hintRu: 'Диагональ в центр вниз',
        hint: 'Diagonal to center down',
        svgPath: 'M 28 15 L 50 65'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 50, y: 65 }, { x: 72, y: 15 }],
        startPoint: { x: 50, y: 65 },
        endPoint: { x: 72, y: 15 },
        hintRu: 'Диагональ вправо вверх',
        hint: 'Diagonal to right up',
        svgPath: 'M 50 65 L 72 15'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 72, y: 15 }, { x: 72, y: 85 }],
        startPoint: { x: 72, y: 15 },
        endPoint: { x: 72, y: 85 },
        hintRu: 'Правая вертикаль вниз',
        hint: 'Right vertical down',
        svgPath: 'M 72 15 L 72 85'
      }
    ]
  },
  {
    id: 'ru_ya',
    char: 'Я',
    name: 'Я (я)',
    sound: '[ja]',
    translit: 'Ya',
    translation: 'Apple / Яблоко',
    script: 'cyrillic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'medium',
    cursiveNotesRu: 'Вертикальная стойка, левый верхний овал и левая наклонная ножка.',
    exampleWord: { word: 'Яблоко', translation: 'Apple', phonetic: 'Yab-lo-ko' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 65, y: 15 }, { x: 65, y: 85 }],
        startPoint: { x: 65, y: 15 },
        endPoint: { x: 65, y: 85 },
        hintRu: 'Правая вертикальная линия',
        hint: 'Right vertical line',
        svgPath: 'M 65 15 L 65 85'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 65, y: 15 }, { x: 35, y: 15 }, { x: 30, y: 32 }, { x: 65, y: 50 }],
        startPoint: { x: 65, y: 15 },
        endPoint: { x: 65, y: 50 },
        hintRu: 'Левый верхний овал',
        hint: 'Upper left bowl',
        svgPath: 'M 65 15 C 35 15 30 30 30 32 C 30 45 45 50 65 50'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 48, y: 50 }, { x: 32, y: 85 }],
        startPoint: { x: 48, y: 50 },
        endPoint: { x: 32, y: 85 },
        hintRu: 'Наклонная ножка влево вниз',
        hint: 'Left slant leg to base',
        svgPath: 'M 48 50 L 32 85'
      }
    ]
  },

  // LATIN
  {
    id: 'en_c',
    char: 'C',
    name: 'C',
    sound: '[k] / [s]',
    translit: 'C',
    translation: 'Cat / Кот',
    script: 'latin',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Один плавный круговой дуговой штрих против часовой стрелки.',
    exampleWord: { word: 'Cat', translation: 'Cat', phonetic: 'kæt' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 70, y: 25 }, { x: 50, y: 15 }, { x: 30, y: 50 }, { x: 50, y: 85 }, { x: 70, y: 75 }],
        startPoint: { x: 70, y: 25 },
        endPoint: { x: 70, y: 75 },
        arrow: { from: { x: 55, y: 18 }, to: { x: 32, y: 40 } },
        hintRu: 'Полукруг против часовой стрелки сверху вниз',
        hint: 'Smooth counter-clockwise curve',
        svgPath: 'M 70 25 C 50 15 30 30 30 50 C 30 70 50 85 70 75'
      }
    ]
  },
  {
    id: 'en_s',
    char: 'S',
    name: 'S',
    sound: '[s]',
    translit: 'S',
    translation: 'Sun / Солнце',
    script: 'latin',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'medium',
    cursiveNotesRu: 'S-образная плавная кривая: влево-вниз, затем вправо-вниз.',
    exampleWord: { word: 'Sun', translation: 'Sun', phonetic: 'sʌn' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 68, y: 25 }, { x: 50, y: 15 }, { x: 35, y: 32 }, { x: 65, y: 65 }, { x: 50, y: 85 }, { x: 32, y: 75 }],
        startPoint: { x: 68, y: 25 },
        endPoint: { x: 32, y: 75 },
        hintRu: 'Плавная змейка сверху вниз',
        hint: 'Smooth snake curve from top to bottom',
        svgPath: 'M 68 25 C 50 15 35 30 35 38 C 35 55 68 55 68 70 C 68 85 45 88 32 75'
      }
    ]
  },

  // ARABIC
  {
    id: 'ar_alif',
    char: 'ا',
    name: 'Алиф (Alif)',
    sound: '[aː]',
    translit: 'ā',
    translation: 'Peace / سلام',
    script: 'arabic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Прямой вертикальный штрих сверху вниз. Не соединяется со следующей буквой слева.',
    exampleWord: { word: 'أمل', translation: 'Hope', phonetic: 'Amal' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 50, y: 15 }, { x: 50, y: 85 }],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 50, y: 85 },
        hintRu: 'Строгая прямая линия сверху вниз',
        hint: 'Direct vertical stroke top to bottom',
        svgPath: 'M 50 15 L 50 85'
      }
    ]
  },
  {
    id: 'ar_baa',
    char: 'ب',
    name: 'Ба (Baa)',
    sound: '[b]',
    translit: 'B',
    translation: 'House / بيت',
    script: 'arabic',
    category: 'alphabet',
    theme: 'basic',
    difficulty: 'easy',
    cursiveNotesRu: 'Ладьеобразная форма справа налево с одной точкой снизу.',
    exampleWord: { word: 'باب', translation: 'Door', phonetic: 'Baab' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 75, y: 55 }, { x: 70, y: 70 }, { x: 30, y: 70 }, { x: 25, y: 55 }],
        startPoint: { x: 75, y: 55 },
        endPoint: { x: 25, y: 55 },
        hintRu: 'Ладья справа налево',
        hint: 'Boat stroke from right to left',
        svgPath: 'M 75 55 C 75 70 70 70 50 70 C 30 70 25 70 25 55'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 50, y: 85 }, { x: 50.1, y: 85.1 }],
        startPoint: { x: 50, y: 85 },
        endPoint: { x: 50.1, y: 85.1 },
        hintRu: 'Точка снизу под центром',
        hint: 'Single dot centered underneath',
        svgPath: 'M 50 85 L 50.1 85.1'
      }
    ]
  }
];

// 2. CONNECTED FORMS & LIGATURES (КАК БУКВЫ СОЕДИНЯЮТСЯ В СЛОВАХ)
export const LIGATURE_HANDWRITING_ITEMS: HandwritingItem[] = [
  {
    id: 'lig_an',
    char: 'ан',
    name: 'Соединение «а-н»',
    sound: '[an]',
    translit: 'an',
    translation: 'Cursive join "a-n"',
    script: 'cyrillic',
    category: 'forms',
    theme: 'ligature',
    difficulty: 'medium',
    cursiveNotesRu: 'Нижнее соединение: от хвостика буквы «а» плавно ведём соединительную линию к левой ножке «н».',
    exampleWord: { word: 'Анна', translation: 'Anna', phonetic: 'An-na' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 35, y: 35 }, { x: 22, y: 50 }, { x: 35, y: 65 }, { x: 42, y: 50 }, { x: 35, y: 35 }],
        startPoint: { x: 35, y: 35 },
        endPoint: { x: 35, y: 35 },
        hintRu: 'Овал буквы «а» против часовой стрелки',
        hint: 'Oval of letter "a" counter-clockwise',
        svgPath: 'M 35 35 C 20 40 20 60 35 65 C 45 60 45 40 35 35'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 42, y: 35 }, { x: 42, y: 65 }, { x: 52, y: 65 }, { x: 60, y: 45 }],
        startPoint: { x: 42, y: 35 },
        endPoint: { x: 60, y: 45 },
        hintRu: 'Хвостик буквы «а» и соединительный мостик к «н»',
        hint: 'Tail of "a" connecting to "n"',
        svgPath: 'M 42 35 L 42 65 C 42 65 48 65 60 45'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 60, y: 35 }, { x: 60, y: 65 }],
        startPoint: { x: 60, y: 35 },
        endPoint: { x: 60, y: 65 },
        hintRu: 'Левая вертикаль «н»',
        hint: 'Left vertical of "n"',
        svgPath: 'M 60 35 L 60 65'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 60, y: 50 }, { x: 75, y: 50 }],
        startPoint: { x: 60, y: 50 },
        endPoint: { x: 75, y: 50 },
        hintRu: 'Перемычка буквы «н»',
        hint: 'Crossbar of "n"',
        svgPath: 'M 60 50 L 75 50'
      },
      {
        id: 5,
        order: 5,
        path: [{ x: 75, y: 35 }, { x: 75, y: 65 }, { x: 82, y: 63 }],
        startPoint: { x: 75, y: 35 },
        endPoint: { x: 82, y: 63 },
        hintRu: 'Правая вертикаль «н» с хвостиком выхода',
        hint: 'Right vertical of "n" with output tail',
        svgPath: 'M 75 35 L 75 65 C 75 65 77 65 82 63'
      }
    ]
  },
  {
    id: 'lig_ko',
    char: 'ко',
    name: 'Соединение «к-о»',
    sound: '[ko]',
    translit: 'ko',
    translation: 'Cursive join "k-o"',
    script: 'cyrillic',
    category: 'forms',
    theme: 'ligature',
    difficulty: 'medium',
    cursiveNotesRu: 'Верхнее/среднее соединение: правый лепесток «к» соединяется с верхним краем овала «о».',
    exampleWord: { word: 'Кот', translation: 'Cat', phonetic: 'Kot' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 30, y: 25 }, { x: 30, y: 65 }],
        startPoint: { x: 30, y: 25 },
        endPoint: { x: 30, y: 65 },
        hintRu: 'Стойка буквы «к»',
        hint: 'Spine of letter "k"',
        svgPath: 'M 30 25 L 30 65'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 42, y: 35 }, { x: 30, y: 48 }, { x: 45, y: 65 }, { x: 55, y: 50 }],
        startPoint: { x: 42, y: 35 },
        endPoint: { x: 55, y: 50 },
        hintRu: 'Усики буквы «к» и мостик к «о»',
        hint: 'Arms of "k" reaching toward "o"',
        svgPath: 'M 42 35 L 30 48 L 45 65 C 45 65 50 60 55 50'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 70, y: 35 }, { x: 58, y: 50 }, { x: 70, y: 65 }, { x: 82, y: 50 }, { x: 70, y: 35 }],
        startPoint: { x: 70, y: 35 },
        endPoint: { x: 70, y: 35 },
        hintRu: 'Овал буквы «о»',
        hint: 'Oval of letter "o"',
        svgPath: 'M 70 35 C 55 40 55 60 70 65 C 85 60 85 40 70 35'
      }
    ]
  },
  {
    id: 'lig_ar_salam',
    char: 'سل',
    name: 'Синтез Син + Лям (Arabic)',
    sound: '[sal]',
    translit: 'sal',
    translation: 'Peace connection',
    script: 'arabic',
    category: 'forms',
    theme: 'ligature',
    difficulty: 'hard',
    cursiveNotesRu: 'Арабская лигатура: три зубца буквы Син плавно переходят в высокую вертикаль буквы Лям.',
    exampleWord: { word: 'سلام', translation: 'Peace', phonetic: 'Salam' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 85, y: 45 }, { x: 80, y: 55 }, { x: 75, y: 45 }, { x: 70, y: 55 }, { x: 65, y: 45 }, { x: 55, y: 55 }],
        startPoint: { x: 85, y: 45 },
        endPoint: { x: 55, y: 55 },
        hintRu: 'Зубцы буквы Син справа налево',
        hint: 'Teeth of letter Seen right to left',
        svgPath: 'M 85 45 C 85 55 80 55 75 45 C 75 55 70 55 65 45 L 55 55'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 55, y: 55 }, { x: 55, y: 15 }, { x: 55, y: 65 }, { x: 35, y: 65 }],
        startPoint: { x: 55, y: 55 },
        endPoint: { x: 35, y: 65 },
        hintRu: 'Вверх по стойке Лям и продолжение влево',
        hint: 'Up the Lam mast and out to the left',
        svgPath: 'M 55 55 L 55 15 L 55 65 L 35 65'
      }
    ]
  }
];

// 3. FULL WORDS TRACING (ОТСЛЕЖИВАНИЕ СЛОВ ДЛЯ ПУТЕШЕСТВИЙ, ВЕРЫ, СЕМЬИ И ИСКУССТВА)
export const WORD_HANDWRITING_ITEMS: HandwritingItem[] = [
  // TRAVEL / ДЛЯ ПУТЕШЕСТВИЙ
  {
    id: 'w_ticket',
    char: 'Билет',
    name: 'Билет (Ticket)',
    sound: '[bi-let]',
    translit: 'Bilet',
    translation: 'Ticket / Билет в путешествие',
    script: 'cyrillic',
    category: 'words',
    theme: 'travel',
    difficulty: 'medium',
    cursiveNotesRu: 'Слитное письмо слова «Билет»: стойка Б, соединение и-л-е-т с ровными наклонами.',
    exampleWord: { word: 'Билет', translation: 'Travel ticket', phonetic: 'Bi-let' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 15, y: 25 }, { x: 15, y: 70 }, { x: 28, y: 70 }, { x: 28, y: 50 }, { x: 15, y: 50 }],
        startPoint: { x: 15, y: 25 },
        endPoint: { x: 15, y: 50 },
        hintRu: 'Буква Б: стойка и овал',
        hint: 'Letter B',
        svgPath: 'M 15 25 L 15 70 C 28 70 28 50 15 50'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 15, y: 25 }, { x: 28, y: 25 }],
        startPoint: { x: 15, y: 25 },
        endPoint: { x: 28, y: 25 },
        hintRu: 'Верхняя полочка Б',
        hint: 'Top stroke of B',
        svgPath: 'M 15 25 L 28 25'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 32, y: 45 }, { x: 32, y: 70 }, { x: 42, y: 45 }, { x: 42, y: 70 }],
        startPoint: { x: 32, y: 45 },
        endPoint: { x: 42, y: 70 },
        hintRu: 'Буква И: две стойки с диагональю',
        hint: 'Letter I',
        svgPath: 'M 32 45 L 32 70 L 42 45 L 42 70'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 46, y: 70 }, { x: 52, y: 45 }, { x: 58, y: 70 }],
        startPoint: { x: 46, y: 70 },
        endPoint: { x: 58, y: 70 },
        hintRu: 'Буква Л: шалашик с нижним входом',
        hint: 'Letter L',
        svgPath: 'M 46 70 L 52 45 L 58 70'
      },
      {
        id: 5,
        order: 5,
        path: [{ x: 62, y: 45 }, { x: 62, y: 70 }, { x: 72, y: 70 }],
        startPoint: { x: 62, y: 45 },
        endPoint: { x: 72, y: 70 },
        hintRu: 'Буква Е',
        hint: 'Letter E',
        svgPath: 'M 72 45 L 62 45 L 62 57 L 70 57 M 62 70 L 72 70'
      },
      {
        id: 6,
        order: 6,
        path: [{ x: 76, y: 45 }, { x: 90, y: 45 }, { x: 83, y: 45 }, { x: 83, y: 70 }],
        startPoint: { x: 76, y: 45 },
        endPoint: { x: 83, y: 70 },
        hintRu: 'Буква Т: перекладина и стойка',
        hint: 'Letter T',
        svgPath: 'M 76 45 L 90 45 M 83 45 L 83 70'
      }
    ]
  },
  {
    id: 'w_hotel',
    char: 'Отель',
    name: 'Отель (Hotel)',
    sound: '[o-tel]',
    translit: 'Otel',
    translation: 'Hotel / Место отдыха',
    script: 'cyrillic',
    category: 'words',
    theme: 'travel',
    difficulty: 'medium',
    cursiveNotesRu: 'Отель: мягкий знак на конце смягчает звук «л».',
    exampleWord: { word: 'Отель', translation: 'Hotel', phonetic: 'O-tel' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 18, y: 45 }, { x: 12, y: 57 }, { x: 18, y: 70 }, { x: 24, y: 57 }, { x: 18, y: 45 }],
        startPoint: { x: 18, y: 45 },
        endPoint: { x: 18, y: 45 },
        hintRu: 'Буква О: круговой овал',
        hint: 'Letter O',
        svgPath: 'M 18 45 C 10 50 10 65 18 70 C 26 65 26 50 18 45'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 28, y: 45 }, { x: 42, y: 45 }, { x: 35, y: 45 }, { x: 35, y: 70 }],
        startPoint: { x: 28, y: 45 },
        endPoint: { x: 35, y: 70 },
        hintRu: 'Буква Т',
        hint: 'Letter T',
        svgPath: 'M 28 45 L 42 45 M 35 45 L 35 70'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 46, y: 45 }, { x: 46, y: 70 }, { x: 56, y: 70 }],
        startPoint: { x: 46, y: 45 },
        endPoint: { x: 56, y: 70 },
        hintRu: 'Буква Е',
        hint: 'Letter E',
        svgPath: 'M 56 45 L 46 45 L 46 57 L 54 57 M 46 70 L 56 70'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 60, y: 70 }, { x: 66, y: 45 }, { x: 72, y: 70 }],
        startPoint: { x: 60, y: 70 },
        endPoint: { x: 72, y: 70 },
        hintRu: 'Буква Л',
        hint: 'Letter L',
        svgPath: 'M 60 70 L 66 45 L 72 70'
      },
      {
        id: 5,
        order: 5,
        path: [{ x: 76, y: 45 }, { x: 76, y: 70 }, { x: 88, y: 70 }, { x: 88, y: 57 }, { x: 76, y: 57 }],
        startPoint: { x: 76, y: 45 },
        endPoint: { x: 76, y: 57 },
        hintRu: 'Мягкий знак Ь',
        hint: 'Soft sign Ь',
        svgPath: 'M 76 45 L 76 70 C 88 70 88 57 76 57'
      }
    ]
  },

  // FAITH & HERITAGE / ДЛЯ ВЕРЫ И ТРАДИЦИЙ
  {
    id: 'w_peace',
    char: 'Мир',
    name: 'Мир (Peace & World)',
    sound: '[mir]',
    translit: 'Mir',
    translation: 'Peace & Harmony / Духовный мир',
    script: 'cyrillic',
    category: 'words',
    theme: 'faith',
    difficulty: 'easy',
    cursiveNotesRu: 'Священное слово «Мир» — пишется плавно и вдохновенно в 3 буквы: М, И, Р.',
    exampleWord: { word: 'Мир', translation: 'Peace', phonetic: 'Mir' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 15, y: 70 }, { x: 15, y: 35 }, { x: 26, y: 58 }, { x: 37, y: 35 }, { x: 37, y: 70 }],
        startPoint: { x: 15, y: 70 },
        endPoint: { x: 37, y: 70 },
        hintRu: 'Буква М: две стойки и центр',
        hint: 'Letter M',
        svgPath: 'M 15 70 L 15 35 L 26 58 L 37 35 L 37 70'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 45, y: 45 }, { x: 45, y: 70 }, { x: 57, y: 45 }, { x: 57, y: 70 }],
        startPoint: { x: 45, y: 45 },
        endPoint: { x: 57, y: 70 },
        hintRu: 'Буква И',
        hint: 'Letter I',
        svgPath: 'M 45 45 L 45 70 L 57 45 L 57 70'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 68, y: 45 }, { x: 68, y: 85 }, { x: 68, y: 45 }, { x: 82, y: 45 }, { x: 82, y: 58 }, { x: 68, y: 58 }],
        startPoint: { x: 68, y: 45 },
        endPoint: { x: 68, y: 58 },
        hintRu: 'Буква Р: длинная ножка вниз и верхний овал',
        hint: 'Letter R with descending tail',
        svgPath: 'M 68 85 L 68 45 C 82 45 82 58 68 58'
      }
    ]
  },
  {
    id: 'w_faith',
    char: 'Вера',
    name: 'Вера (Faith)',
    sound: '[ve-ra]',
    translit: 'Vera',
    translation: 'Faith & Trust / Сердечная вера',
    script: 'cyrillic',
    category: 'words',
    theme: 'faith',
    difficulty: 'medium',
    cursiveNotesRu: 'Слово «Вера»: стойка В, плавное Е, ножка Р и раскрытая А.',
    exampleWord: { word: 'Вера', translation: 'Faith', phonetic: 'Ve-ra' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 15, y: 25 }, { x: 15, y: 70 }, { x: 26, y: 70 }, { x: 26, y: 48 }, { x: 15, y: 48 }, { x: 25, y: 48 }, { x: 25, y: 25 }, { x: 15, y: 25 }],
        startPoint: { x: 15, y: 25 },
        endPoint: { x: 15, y: 25 },
        hintRu: 'Буква В: стойка и два полукруга',
        hint: 'Letter V',
        svgPath: 'M 15 25 L 15 70 C 26 70 26 48 15 48 C 25 48 25 25 15 25'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 33, y: 45 }, { x: 33, y: 70 }, { x: 44, y: 70 }],
        startPoint: { x: 33, y: 45 },
        endPoint: { x: 44, y: 70 },
        hintRu: 'Буква Е',
        hint: 'Letter E',
        svgPath: 'M 44 45 L 33 45 L 33 57 L 42 57 M 33 70 L 44 70'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 52, y: 85 }, { x: 52, y: 45 }, { x: 64, y: 45 }, { x: 64, y: 58 }, { x: 52, y: 58 }],
        startPoint: { x: 52, y: 85 },
        endPoint: { x: 52, y: 58 },
        hintRu: 'Буква Р',
        hint: 'Letter R',
        svgPath: 'M 52 85 L 52 45 C 64 45 64 58 52 58'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 78, y: 45 }, { x: 70, y: 70 }, { x: 86, y: 70 }, { x: 73, y: 58 }, { x: 83, y: 58 }],
        startPoint: { x: 78, y: 45 },
        endPoint: { x: 83, y: 58 },
        hintRu: 'Буква А',
        hint: 'Letter A',
        svgPath: 'M 78 45 L 70 70 M 78 45 L 86 70 M 73 58 L 83 58'
      }
    ]
  },

  // FAMILY / ДЛЯ СЕМЬИ И ОБЩЕНИЯ
  {
    id: 'w_mama',
    char: 'Мама',
    name: 'Мама (Mom)',
    sound: '[ma-ma]',
    translit: 'Mama',
    translation: 'Mother / Самое теплое слово',
    script: 'cyrillic',
    category: 'words',
    theme: 'family',
    difficulty: 'easy',
    cursiveNotesRu: 'Ритмичное написание: две повторяющиеся пары М-А с плавными соединениями.',
    exampleWord: { word: 'Мама', translation: 'Mom', phonetic: 'Ma-ma' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 12, y: 70 }, { x: 12, y: 35 }, { x: 20, y: 55 }, { x: 28, y: 35 }, { x: 28, y: 70 }],
        startPoint: { x: 12, y: 70 },
        endPoint: { x: 28, y: 70 },
        hintRu: 'Первая буква М',
        hint: 'First letter M',
        svgPath: 'M 12 70 L 12 35 L 20 55 L 28 35 L 28 70'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 38, y: 45 }, { x: 32, y: 70 }, { x: 44, y: 70 }, { x: 34, y: 58 }, { x: 42, y: 58 }],
        startPoint: { x: 38, y: 45 },
        endPoint: { x: 42, y: 58 },
        hintRu: 'Первая буква А',
        hint: 'First letter A',
        svgPath: 'M 38 45 L 32 70 M 38 45 L 44 70 M 34 58 L 42 58'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 52, y: 70 }, { x: 52, y: 35 }, { x: 60, y: 55 }, { x: 68, y: 35 }, { x: 68, y: 70 }],
        startPoint: { x: 52, y: 70 },
        endPoint: { x: 68, y: 70 },
        hintRu: 'Вторая буква М',
        hint: 'Second letter M',
        svgPath: 'M 52 70 L 52 35 L 60 55 L 68 35 L 68 70'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 78, y: 45 }, { x: 72, y: 70 }, { x: 84, y: 70 }, { x: 74, y: 58 }, { x: 82, y: 58 }],
        startPoint: { x: 78, y: 45 },
        endPoint: { x: 82, y: 58 },
        hintRu: 'Вторая буква А',
        hint: 'Second letter A',
        svgPath: 'M 78 45 L 72 70 M 78 45 L 84 70 M 74 58 L 82 58'
      }
    ]
  },
  {
    id: 'w_dom',
    char: 'Дом',
    name: 'Дом (Home)',
    sound: '[dom]',
    translit: 'Dom',
    translation: 'Home & Family / Родной очаг',
    script: 'cyrillic',
    category: 'words',
    theme: 'family',
    difficulty: 'medium',
    cursiveNotesRu: 'Теплое слово «Дом»: Д с ножками, круглый О и широкий М.',
    exampleWord: { word: 'Дом', translation: 'Home', phonetic: 'Dom' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 25, y: 35 }, { x: 15, y: 65 }, { x: 35, y: 65 }, { x: 25, y: 35 }, { x: 10, y: 65 }, { x: 40, y: 65 }, { x: 12, y: 75 }, { x: 38, y: 75 }],
        startPoint: { x: 25, y: 35 },
        endPoint: { x: 38, y: 75 },
        hintRu: 'Буква Д',
        hint: 'Letter D',
        svgPath: 'M 25 35 L 15 65 L 35 65 Z M 10 65 L 40 65 M 13 65 L 13 75 M 37 65 L 37 75'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 50, y: 45 }, { x: 44, y: 57 }, { x: 50, y: 70 }, { x: 56, y: 57 }, { x: 50, y: 45 }],
        startPoint: { x: 50, y: 45 },
        endPoint: { x: 50, y: 45 },
        hintRu: 'Буква О',
        hint: 'Letter O',
        svgPath: 'M 50 45 C 42 50 42 65 50 70 C 58 65 58 50 50 45'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 65, y: 70 }, { x: 65, y: 45 }, { x: 75, y: 60 }, { x: 85, y: 45 }, { x: 85, y: 70 }],
        startPoint: { x: 65, y: 70 },
        endPoint: { x: 85, y: 70 },
        hintRu: 'Буква М',
        hint: 'Letter M',
        svgPath: 'M 65 70 L 65 45 L 75 60 L 85 45 L 85 70'
      }
    ]
  },

  // ART & BEAUTY / ДЛЯ ДУШИ И КРАСОТЫ
  {
    id: 'w_mechta',
    char: 'Мечта',
    name: 'Мечта (Dream)',
    sound: '[mech-ta]',
    translit: 'Mechta',
    translation: 'Dream & Aspiration / Высокая мечта',
    script: 'cyrillic',
    category: 'words',
    theme: 'art',
    difficulty: 'hard',
    cursiveNotesRu: 'Изящное каллиграфическое написание «Мечта»: М-е-ч-т-а в едином дыхании.',
    exampleWord: { word: 'Мечта', translation: 'Dream', phonetic: 'Mech-ta' },
    strokes: [
      {
        id: 1,
        order: 1,
        path: [{ x: 10, y: 70 }, { x: 10, y: 45 }, { x: 17, y: 60 }, { x: 24, y: 45 }, { x: 24, y: 70 }],
        startPoint: { x: 10, y: 70 },
        endPoint: { x: 24, y: 70 },
        hintRu: 'Буква М',
        hint: 'Letter M',
        svgPath: 'M 10 70 L 10 45 L 17 60 L 24 45 L 24 70'
      },
      {
        id: 2,
        order: 2,
        path: [{ x: 30, y: 45 }, { x: 30, y: 70 }, { x: 40, y: 70 }],
        startPoint: { x: 30, y: 45 },
        endPoint: { x: 40, y: 70 },
        hintRu: 'Буква Е',
        hint: 'Letter E',
        svgPath: 'M 40 45 L 30 45 L 30 57 L 38 57 M 30 70 L 40 70'
      },
      {
        id: 3,
        order: 3,
        path: [{ x: 46, y: 45 }, { x: 46, y: 57 }, { x: 56, y: 57 }, { x: 56, y: 45 }, { x: 56, y: 70 }],
        startPoint: { x: 46, y: 45 },
        endPoint: { x: 56, y: 70 },
        hintRu: 'Буква Ч: полудужка и правая стойка',
        hint: 'Letter Ch',
        svgPath: 'M 46 45 C 46 57 56 57 56 57 M 56 45 L 56 70'
      },
      {
        id: 4,
        order: 4,
        path: [{ x: 62, y: 45 }, { x: 74, y: 45 }, { x: 68, y: 45 }, { x: 68, y: 70 }],
        startPoint: { x: 62, y: 45 },
        endPoint: { x: 68, y: 70 },
        hintRu: 'Буква Т',
        hint: 'Letter T',
        svgPath: 'M 62 45 L 74 45 M 68 45 L 68 70'
      },
      {
        id: 5,
        order: 5,
        path: [{ x: 84, y: 45 }, { x: 78, y: 70 }, { x: 90, y: 70 }, { x: 80, y: 58 }, { x: 88, y: 58 }],
        startPoint: { x: 84, y: 45 },
        endPoint: { x: 88, y: 58 },
        hintRu: 'Буква А',
        hint: 'Letter A',
        svgPath: 'M 84 45 L 78 70 M 84 45 L 90 70 M 80 58 L 88 58'
      }
    ]
  }
];

// Combine all items into categorized datasets
export const HANDWRITING_SECTIONS: HandwritingCategory[] = [
  {
    id: 'stage_alphabet',
    title: 'Full Alphabet, Letter by Letter',
    titleRu: 'Полный алфавит, буква за буквой',
    description: 'Master individual letters with accurate stroke order, start points, and direction.',
    descriptionRu: 'Обводка настоящих букв штрих за штрихом с мгновенной проверкой порядка и точности.',
    icon: '🔤',
    items: ALPHABET_HANDWRITING_ITEMS
  },
  {
    id: 'stage_forms',
    title: 'Letter Forms & Cursive Ligatures',
    titleRu: 'Формы букв и соединения',
    description: 'Learn how individual letters connect smoothly into cursive ligatures and words.',
    descriptionRu: 'Как буквы соединяются в словах: нижние и верхние соединения, лигатуры и мостики.',
    icon: '🔗',
    items: LIGATURE_HANDWRITING_ITEMS
  },
  {
    id: 'stage_words',
    title: 'Word Tracing & Real-World Vocab',
    titleRu: 'Отслеживание слов и синтез',
    description: 'Put it all together: Trace full words for travel, faith, family, and personal inspiration.',
    descriptionRu: 'Сборка всего воедино: письмо целых слов для путешествий, веры, семьи и души.',
    icon: '✍️',
    items: WORD_HANDWRITING_ITEMS
  }
];

// Daily handwriting challenges (3 items per day)
export const getDailyHandwritingWorkout = (dateStr?: string): HandwritingItem[] => {
  const all = [...ALPHABET_HANDWRITING_ITEMS, ...LIGATURE_HANDWRITING_ITEMS, ...WORD_HANDWRITING_ITEMS];
  const d = dateStr ? new Date(dateStr) : new Date();
  const dayIndex = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % all.length;
  
  const item1 = ALPHABET_HANDWRITING_ITEMS[dayIndex % ALPHABET_HANDWRITING_ITEMS.length];
  const item2 = LIGATURE_HANDWRITING_ITEMS[dayIndex % LIGATURE_HANDWRITING_ITEMS.length];
  const item3 = WORD_HANDWRITING_ITEMS[dayIndex % WORD_HANDWRITING_ITEMS.length];
  
  return [item1, item2, item3];
};

export const CYRILLIC_LETTERS = ALPHABET_HANDWRITING_ITEMS;
export const LETTER_CONNECTIONS = LIGATURE_HANDWRITING_ITEMS;
export const HANDWRITING_WORDS = WORD_HANDWRITING_ITEMS;

export interface DailyHandwritingHabit {
  completedDates: string[];
  currentStreak: number;
  lastTrainedItem?: string;
  lastPracticedTitle?: string;
  totalLettersDrawn: number;
  completedCount?: number;
  targetCount?: number;
  streakDays?: number;
  isCompleted?: boolean;
}

export const getStoredHandwritingHabit = (): DailyHandwritingHabit => {
  try {
    const raw = localStorage.getItem('duowindo_handwriting_habit');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { completedDates: [], currentStreak: 0, totalLettersDrawn: 0 };
};

export const saveHandwritingHabit = (habit: DailyHandwritingHabit) => {
  try {
    localStorage.setItem('duowindo_handwriting_habit', JSON.stringify(habit));
  } catch (e) {}
};

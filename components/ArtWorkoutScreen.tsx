import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  UndoIcon, 
  TrashIcon, 
  EyeIcon, 
  CheckCircleIcon, 
  StarIcon, 
  SparklesIcon, 
  VolumeIcon, 
  ArrowRightIcon, 
  GridIcon, 
  PenIcon, 
  CloseIcon, 
  PaletteIcon,
  MonitorIcon,
  PhoneIcon
} from './Icons';
import { UserProgress } from '../types';

export interface ArtWorkoutProps {
  user: UserProgress;
  onUpdateUser: (updater: (prev: UserProgress) => UserProgress) => void;
  playSound: (sound: string) => void;
  onClose: () => void;
  isLightMode?: boolean;
  currentCourseId?: string;
  initialLetter?: string;
  initialTab?: 'lessons' | 'letters' | 'studio';
  onSpeakText?: (text: string) => void;
}

// Tool type
export type ArtTool = 'flat_pen' | 'brush' | 'liner' | 'pencil' | 'marker' | 'eraser';

// Guideline grid type
export type GuideGrid = 'copybook_slant' | 'calligraphy_slant' | 'rice_grid' | 'square_grid' | 'none';

// Point with pressure and timestamp
interface DrawPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

interface Stroke {
  tool: ArtTool;
  color: string;
  size: number;
  points: DrawPoint[];
}

// Workout Lesson Step
export interface WorkoutStep {
  id: string;
  title: string;
  instruction: string;
  svgPath: string; // SVG path d attribute for the step guide
  viewBox: string;
  samplePoints?: { x: number; y: number }[];
  hint: string;
  recommendedTool: ArtTool;
  targetStrokeCount?: number;
}

// Workout Lesson Item
export interface WorkoutLesson {
  id: string;
  category: 'calligraphy' | 'oriental' | 'doodling' | 'geometry';
  categoryTitle: string;
  title: string;
  description: string;
  difficulty: 'Легко' | 'Средне' | 'Мастер';
  icon: string;
  xpReward: number;
  steps: WorkoutStep[];
}

// Letter Practice Item Definition
export interface PracticeLetter {
  char: string;
  name: string;
  sound: string;
  category: string;
  strokeCount: number;
  strokeHints: { step: number; label: string; x: number; y: number; dir?: 'down' | 'up' | 'right' | 'circle' | 'curve' }[];
  word?: string;
  translation?: string;
}

// Curated library of ArtWorkout-style general exercises
export const WORKOUT_LESSONS: WorkoutLesson[] = [
  {
    id: 'cal_downstroke',
    category: 'calligraphy',
    categoryTitle: '✒️ Каллиграфия & Перо',
    title: 'Основной нажимной штрих',
    description: 'Основа классической каллиграфии: тонкий вход, плотный нажим и плавный сход',
    difficulty: 'Легко',
    icon: '✒️',
    xpReward: 15,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: Вертикальный нажим',
        instruction: 'Проведите плоским пером сверху вниз с уверенным равномерным нажимом',
        svgPath: 'M 150 50 L 150 250',
        viewBox: '0 0 300 300',
        hint: 'Держите перо под углом 40° к горизонту',
        recommendedTool: 'flat_pen'
      },
      {
        id: 's2',
        title: 'Шаг 2: Восходящий волосной штрих',
        instruction: 'Проведите тонкую наклонную линию снизу вверх без нажима',
        svgPath: 'M 100 250 L 200 50',
        viewBox: '0 0 300 300',
        hint: 'Касайтесь бумаги самым кончиком пера',
        recommendedTool: 'flat_pen'
      },
      {
        id: 's3',
        title: 'Шаг 3: Составная арка (U-штрих)',
        instruction: 'Плавный вход сверху вниз, закругление внизу и тонкий выход наверх',
        svgPath: 'M 90 80 L 90 200 C 90 250, 210 250, 210 200 L 210 80',
        viewBox: '0 0 300 300',
        hint: 'В нижней точке плавно ослабляйте нажим',
        recommendedTool: 'brush'
      }
    ]
  },
  {
    id: 'cal_letter_a',
    category: 'calligraphy',
    categoryTitle: '✒️ Каллиграфия & Перо',
    title: 'Каллиграфическая буква «А»',
    description: 'Изящная прописная буква с росчерком в стиле английского курсива',
    difficulty: 'Средне',
    icon: '✨',
    xpReward: 25,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: Левый овал буквы',
        instruction: 'Нарисуйте каплевидный овал против часовой стрелки',
        svgPath: 'M 160 110 C 110 110, 80 160, 80 200 C 80 240, 120 260, 160 260 C 200 260, 220 230, 220 200 C 220 160, 200 110, 160 110 Z',
        viewBox: '0 0 300 300',
        hint: 'Левая дуга плотная (нажим вниз), правая — тонкая',
        recommendedTool: 'flat_pen'
      },
      {
        id: 's2',
        title: 'Шаг 2: Нисходящая стойка с крючком',
        instruction: 'Присоедините вертикальную стойку с плавным завитком снизу',
        svgPath: 'M 220 90 L 220 230 C 220 265, 255 265, 275 235',
        viewBox: '0 0 300 300',
        hint: 'Плотный штрих сверху вниз и лёгкий хвостик',
        recommendedTool: 'flat_pen'
      },
      {
        id: 's3',
        title: 'Шаг 3: Декоративный вензель',
        instruction: 'Добавьте верхний росчерк для королевского вида буквы',
        svgPath: 'M 70 80 C 130 50, 220 60, 260 85',
        viewBox: '0 0 300 300',
        hint: 'Легкое быстрое движение кистью',
        recommendedTool: 'brush'
      }
    ]
  },
  {
    id: 'cal_flourish',
    category: 'calligraphy',
    categoryTitle: '✒️ Каллиграфия & Перо',
    title: 'Вензеля и лебединые линии',
    description: 'Тренировка глазомера и плавности руки: динамические петли и росчерки',
    difficulty: 'Мастер',
    icon: '🦢',
    xpReward: 30,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: S-образная кривая Хогарта',
        instruction: 'Проведите безупречную двойную волну слева направо',
        svgPath: 'M 50 220 C 100 80, 200 280, 260 80',
        viewBox: '0 0 300 300',
        hint: 'Ведите всей рукой от плеча, не сгибая только запястье',
        recommendedTool: 'brush'
      },
      {
        id: 's2',
        title: 'Шаг 2: Бесконечная каллиграфическая восьмёрка',
        instruction: 'Замкнутая петля с плавным перекрестием в центре',
        svgPath: 'M 150 150 C 90 80, 50 150, 90 200 C 140 250, 160 50, 210 100 C 250 150, 210 220, 150 150 Z',
        viewBox: '0 0 300 300',
        hint: 'Поймайте единый ритм движения без остановок',
        recommendedTool: 'flat_pen'
      }
    ]
  },
  {
    id: 'kanji_yong',
    category: 'oriental',
    categoryTitle: '🈳 Восточная каллиграфия',
    title: 'Иероглиф «Вечность» 永',
    description: 'Священный канон каллиграфии: содержит 8 фундаментальных черт тушью (Юн-фа)',
    difficulty: 'Мастер',
    icon: '⛩️',
    xpReward: 35,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: Точка Дянь (側/点)',
        instruction: 'Поставьте каплю туши вверху: плавный вход и акцентное прижатие',
        svgPath: 'M 140 60 C 155 55, 175 65, 165 85 C 155 95, 140 90, 140 60 Z',
        viewBox: '0 0 300 300',
        hint: 'Подобно падающей на лист скале',
        recommendedTool: 'brush'
      },
      {
        id: 's2',
        title: 'Шаг 2: Горизонталь и вертикальный столб с крюком (勒 + 努 + 趯)',
        instruction: 'Проведите горизонталь, поверните вниз и сделайте резкий крюк влево-вверх',
        svgPath: 'M 85 110 L 195 110 L 190 125 L 150 135 L 150 255 L 130 230',
        viewBox: '0 0 300 300',
        hint: 'Крюк в конце должен быть острым и упругим',
        recommendedTool: 'brush'
      },
      {
        id: 's3',
        title: 'Шаг 3: Откидные черты влево и вправо (策 + 掠 + 磔)',
        instruction: 'Добавьте восходящий штрих слева и мощную волну вправо',
        svgPath: 'M 75 160 L 140 185 M 70 215 C 100 215, 135 200, 145 190 M 155 180 C 180 200, 220 240, 255 255',
        viewBox: '0 0 300 300',
        hint: 'Правая откидная черта расширяется к концу как веер',
        recommendedTool: 'brush'
      }
    ]
  },
  {
    id: 'kanji_enso',
    category: 'oriental',
    categoryTitle: '🈳 Восточная каллиграфия',
    title: 'Дзен-круг Энсо (円相)',
    description: 'Символ абсолютной гармонии, момента и свободы духа, создаваемый одним движением',
    difficulty: 'Средне',
    icon: '⭕',
    xpReward: 20,
    steps: [
      {
        id: 's1',
        title: 'Единый непрерывный круг',
        instruction: 'Начните внизу слева, сделайте полный круг по часовой стрелке на одном дыхании',
        svgPath: 'M 90 220 C 50 160, 60 90, 120 60 C 180 30, 250 70, 260 140 C 270 210, 200 260, 140 250',
        viewBox: '0 0 300 300',
        hint: 'Не замыкайте круг до конца — оставьте пространство для свободы мысли',
        recommendedTool: 'brush'
      }
    ]
  },
  {
    id: 'doodle_cat',
    category: 'doodling',
    categoryTitle: '🐱 Скетчинг & Рисунок',
    title: 'Милый котик (Doodle Cat)',
    description: 'Пошаговый урок рисования очаровательного персонажа линиями, как в ArtWorkout',
    difficulty: 'Легко',
    icon: '🐱',
    xpReward: 20,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: Голова и ушки',
        instruction: 'Нарисуйте округлую форму с двумя заостренными ушками наверху',
        svgPath: 'M 90 140 C 70 170, 70 210, 100 230 C 130 250, 170 250, 200 230 C 230 210, 230 170, 210 140 L 225 90 L 180 110 C 160 105, 140 105, 120 110 L 75 90 Z',
        viewBox: '0 0 300 300',
        hint: 'Ушки треугольные с легким наклоном наружу',
        recommendedTool: 'liner'
      },
      {
        id: 's2',
        title: 'Шаг 2: Глазки и носик',
        instruction: 'Добавьте два круглых глаза, крохотный носик и улыбку',
        svgPath: 'M 115 170 A 10 10 0 1 1 115 169 M 185 170 A 10 10 0 1 1 185 169 M 147 185 L 153 185 L 150 190 Z M 150 190 Q 140 200 135 195 M 150 190 Q 160 200 165 195',
        viewBox: '0 0 300 300',
        hint: 'Оставьте белые блики в зрачках для блеска глаз',
        recommendedTool: 'liner'
      },
      {
        id: 's3',
        title: 'Шаг 3: Усики и пузико',
        instruction: 'Нарисуйте по 3 усика с каждой стороны и маленькие лапки',
        svgPath: 'M 80 180 L 40 175 M 80 190 L 45 195 M 80 200 L 50 212 M 220 180 L 260 175 M 220 190 L 255 195 M 220 200 L 250 212 M 120 230 Q 130 255 140 230 M 160 230 Q 170 255 180 230',
        viewBox: '0 0 300 300',
        hint: 'Быстрые отрывистые штрихи для усов',
        recommendedTool: 'liner'
      }
    ]
  },
  {
    id: 'doodle_coffee',
    category: 'doodling',
    categoryTitle: '🐱 Скетчинг & Рисунок',
    title: 'Чашка ароматного кофе',
    description: 'Учимся строить эллипсы, контур чашки и легкие струйки пара',
    difficulty: 'Легко',
    icon: '☕',
    xpReward: 20,
    steps: [
      {
        id: 's1',
        title: 'Шаг 1: Эллипс и корпус чашки',
        instruction: 'Нарисуйте овал для края чашки и полукруглый корпус',
        svgPath: 'M 70 120 C 70 95, 230 95, 230 120 C 230 145, 70 145, 70 120 Z M 75 125 C 80 210, 220 210, 225 125',
        viewBox: '0 0 300 300',
        hint: 'Эллипс должен быть симметричным по горизонтали',
        recommendedTool: 'liner'
      },
      {
        id: 's2',
        title: 'Шаг 2: Ручка и блюдце',
        instruction: 'Пририсуйте ручку справа и широкую дугу блюдца внизу',
        svgPath: 'M 225 140 C 265 140, 265 180, 220 190 M 50 215 C 50 240, 250 240, 250 215',
        viewBox: '0 0 300 300',
        hint: 'Блюдце немного шире самой чашки',
        recommendedTool: 'liner'
      },
      {
        id: 's3',
        title: 'Шаг 3: Струйки горячего пара',
        instruction: 'Нарисуйте три изящные волнистые линии над чашкой',
        svgPath: 'M 110 90 Q 120 70 110 50 M 150 85 Q 160 60 145 40 M 190 90 Q 200 70 185 50',
        viewBox: '0 0 300 300',
        hint: 'Легкий нажим, как настоящий пар',
        recommendedTool: 'pencil'
      }
    ]
  },
  {
    id: 'geo_circle',
    category: 'geometry',
    categoryTitle: '📐 Геометрия & Прописи',
    title: 'Идеальный круг от руки',
    description: 'Легендарный челлендж художников: провести идеальную окружность без циркуля',
    difficulty: 'Мастер',
    icon: '🎯',
    xpReward: 30,
    steps: [
      {
        id: 's1',
        title: 'Челлендж круга (Freehand Circle)',
        instruction: 'Нарисуйте правильную окружность одним плавным движением',
        svgPath: 'M 150 50 A 100 100 0 1 1 149.9 50 Z',
        viewBox: '0 0 300 300',
        hint: 'Вращайте руку от локтя и плеча, глядя на центр холста',
        recommendedTool: 'liner'
      }
    ]
  }
];

// Rich Library of Alphabets & Writing Practice
export const PRESET_PRACTICE_SETS: Record<string, { title: string; flag: string; letters: PracticeLetter[] }> = {
  ru: {
    title: 'Русский алфавит (Прописи)',
    flag: '🇷🇺',
    letters: [
      { char: 'А', name: 'А', sound: '[a]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Левая наклонная', x: 80, y: 70, dir: 'down' }, { step: 2, label: 'Правая наклонная', x: 220, y: 70, dir: 'down' }, { step: 3, label: 'Перекладина', x: 150, y: 170, dir: 'right' }], word: 'Арбуз', translation: 'Watermelon' },
      { char: 'Б', name: 'Бэ', sound: '[b]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Вертикаль', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Верхняя полка', x: 140, y: 65, dir: 'right' }, { step: 3, label: 'Нижний овал', x: 180, y: 190, dir: 'circle' }], word: 'Бабочка', translation: 'Butterfly' },
      { char: 'В', name: 'Вэ', sound: '[v]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Вертикаль', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Верхний полукруг', x: 170, y: 110, dir: 'circle' }, { step: 3, label: 'Нижний полукруг', x: 180, y: 200, dir: 'circle' }], word: 'Ветер', translation: 'Wind' },
      { char: 'Г', name: 'Гэ', sound: '[g]', category: 'ru', strokeCount: 2, strokeHints: [{ step: 1, label: 'Вертикальная стойка', x: 100, y: 70, dir: 'down' }, { step: 2, label: 'Горизонтальная полка', x: 160, y: 70, dir: 'right' }], word: 'Гора', translation: 'Mountain' },
      { char: 'Д', name: 'Дэ', sound: '[d]', category: 'ru', strokeCount: 4, strokeHints: [{ step: 1, label: 'Трапеция сверху', x: 150, y: 80, dir: 'curve' }, { step: 2, label: 'Горизонтальное основание', x: 150, y: 220, dir: 'right' }, { step: 3, label: 'Левая ножка', x: 70, y: 240, dir: 'down' }, { step: 4, label: 'Правая ножка', x: 230, y: 240, dir: 'down' }], word: 'Дом', translation: 'House' },
      { char: 'Е', name: 'Е', sound: '[je]', category: 'ru', strokeCount: 4, strokeHints: [{ step: 1, label: 'Вертикаль', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Верхняя линия', x: 160, y: 70, dir: 'right' }, { step: 3, label: 'Средняя линия', x: 150, y: 150, dir: 'right' }, { step: 4, label: 'Нижняя линия', x: 160, y: 230, dir: 'right' }], word: 'Ель', translation: 'Spruce' },
      { char: 'Ж', name: 'Жэ', sound: '[ʐ]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Центральный столб', x: 150, y: 70, dir: 'down' }, { step: 2, label: 'Левые ветви', x: 90, y: 150, dir: 'curve' }, { step: 3, label: 'Правые ветви', x: 210, y: 150, dir: 'curve' }], word: 'Жук', translation: 'Beetle' },
      { char: 'З', name: 'Зэ', sound: '[z]', category: 'ru', strokeCount: 2, strokeHints: [{ step: 1, label: 'Верхняя дуга', x: 150, y: 100, dir: 'circle' }, { step: 2, label: 'Нижняя дуга', x: 160, y: 190, dir: 'circle' }], word: 'Звезда', translation: 'Star' },
      { char: 'И', name: 'И', sound: '[i]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Левая стойка', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Диагональ снизу вверх', x: 150, y: 150, dir: 'up' }, { step: 3, label: 'Правая стойка', x: 210, y: 70, dir: 'down' }], word: 'Игла', translation: 'Needle' },
      { char: 'К', name: 'Ка', sound: '[k]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Вертикаль', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Верхняя диагональ', x: 170, y: 100, dir: 'up' }, { step: 3, label: 'Нижняя диагональ', x: 170, y: 200, dir: 'down' }], word: 'Кот', translation: 'Cat' },
      { char: 'Л', name: 'Эль', sound: '[l]', category: 'ru', strokeCount: 2, strokeHints: [{ step: 1, label: 'Левая плавная дуга', x: 100, y: 140, dir: 'down' }, { step: 2, label: 'Правая наклонная стойка', x: 200, y: 70, dir: 'down' }], word: 'Луна', translation: 'Moon' },
      { char: 'М', name: 'Эм', sound: '[m]', category: 'ru', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левая стойка', x: 80, y: 70, dir: 'down' }, { step: 2, label: 'Диагональ к центру', x: 120, y: 120, dir: 'down' }, { step: 3, label: 'Диагональ от центра', x: 180, y: 120, dir: 'up' }, { step: 4, label: 'Правая стойка', x: 220, y: 70, dir: 'down' }], word: 'Море', translation: 'Sea' },
      { char: 'О', name: 'О', sound: '[o]', category: 'ru', strokeCount: 1, strokeHints: [{ step: 1, label: 'Единый плавный овал', x: 150, y: 60, dir: 'circle' }], word: 'Озеро', translation: 'Lake' },
      { char: 'П', name: 'Пэ', sound: '[p]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Левая стойка', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Правая стойка', x: 210, y: 70, dir: 'down' }, { step: 3, label: 'Верхняя перекладина', x: 150, y: 65, dir: 'right' }], word: 'Поезд', translation: 'Train' },
      { char: 'Р', name: 'Эр', sound: '[r]', category: 'ru', strokeCount: 2, strokeHints: [{ step: 1, label: 'Вертикальная стойка', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Верхний круглый лепесток', x: 170, y: 110, dir: 'circle' }], word: 'Река', translation: 'River' },
      { char: 'С', name: 'Эс', sound: '[s]', category: 'ru', strokeCount: 1, strokeHints: [{ step: 1, label: 'Полукруг справа налево', x: 180, y: 80, dir: 'curve' }], word: 'Солнце', translation: 'Sun' },
      { char: 'Я', name: 'Я', sound: '[ja]', category: 'ru', strokeCount: 3, strokeHints: [{ step: 1, label: 'Верхний левый овал', x: 130, y: 100, dir: 'circle' }, { step: 2, label: 'Правая вертикальная стойка', x: 200, y: 70, dir: 'down' }, { step: 3, label: 'Левая наклонная ножка', x: 140, y: 190, dir: 'down' }], word: 'Яблоко', translation: 'Apple' },
    ]
  },
  en: {
    title: 'English Alphabet (Latin)',
    flag: '🇬🇧',
    letters: [
      { char: 'A', name: 'A', sound: '[eɪ]', category: 'en', strokeCount: 3, strokeHints: [{ step: 1, label: 'Left slant', x: 80, y: 70, dir: 'down' }, { step: 2, label: 'Right slant', x: 220, y: 70, dir: 'down' }, { step: 3, label: 'Crossbar', x: 150, y: 170, dir: 'right' }], word: 'Apple', translation: 'Яблоко' },
      { char: 'B', name: 'B', sound: '[biː]', category: 'en', strokeCount: 3, strokeHints: [{ step: 1, label: 'Stem', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Top loop', x: 170, y: 110, dir: 'circle' }, { step: 3, label: 'Bottom loop', x: 180, y: 195, dir: 'circle' }], word: 'Book', translation: 'Книга' },
      { char: 'C', name: 'C', sound: '[siː]', category: 'en', strokeCount: 1, strokeHints: [{ step: 1, label: 'Smooth arc', x: 200, y: 80, dir: 'curve' }], word: 'Cat', translation: 'Кот' },
      { char: 'D', name: 'D', sound: '[diː]', category: 'en', strokeCount: 2, strokeHints: [{ step: 1, label: 'Stem', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Big right curve', x: 190, y: 150, dir: 'curve' }], word: 'Door', translation: 'Дверь' },
      { char: 'E', name: 'E', sound: '[iː]', category: 'en', strokeCount: 4, strokeHints: [{ step: 1, label: 'Stem', x: 90, y: 70, dir: 'down' }, { step: 2, label: 'Top arm', x: 160, y: 70, dir: 'right' }, { step: 3, label: 'Middle arm', x: 150, y: 150, dir: 'right' }, { step: 4, label: 'Bottom arm', x: 160, y: 230, dir: 'right' }], word: 'Eagle', translation: 'Орёл' },
      { char: 'G', name: 'G', sound: '[dʒiː]', category: 'en', strokeCount: 2, strokeHints: [{ step: 1, label: 'Outer curved bowl', x: 190, y: 80, dir: 'curve' }, { step: 2, label: 'Inward bar', x: 160, y: 170, dir: 'curve' }], word: 'Gold', translation: 'Золото' },
      { char: 'S', name: 'S', sound: '[es]', category: 'en', strokeCount: 1, strokeHints: [{ step: 1, label: 'Double curve wave', x: 180, y: 80, dir: 'curve' }], word: 'Star', translation: 'Звезда' },
      { char: 'Z', name: 'Z', sound: '[zed]', category: 'en', strokeCount: 3, strokeHints: [{ step: 1, label: 'Top bar', x: 120, y: 70, dir: 'right' }, { step: 2, label: 'Diagonal', x: 150, y: 150, dir: 'down' }, { step: 3, label: 'Bottom bar', x: 180, y: 230, dir: 'right' }], word: 'Zebra', translation: 'Зебра' },
    ]
  },
  kanji: {
    title: 'Иероглифы (Канджи / Ханцзы)',
    flag: '🈳',
    letters: [
      { char: '永', name: 'Вечность', sound: '[yǒng / ei]', category: 'kanji', strokeCount: 5, strokeHints: [{ step: 1, label: 'Точка Дянь', x: 150, y: 60, dir: 'down' }, { step: 2, label: 'Горизонталь и крюк', x: 150, y: 110, dir: 'down' }, { step: 3, label: 'Левый откидной', x: 100, y: 170, dir: 'curve' }, { step: 4, label: 'Правая волна', x: 210, y: 210, dir: 'down' }], word: '永遠 (Эйэн)', translation: 'Вечность' },
      { char: '日', name: 'Солнце / День', sound: '[rì / hi]', category: 'kanji', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левая вертикаль', x: 95, y: 80, dir: 'down' }, { step: 2, label: 'Верх и правый угол', x: 150, y: 80, dir: 'right' }, { step: 3, label: 'Средняя горизонталь', x: 150, y: 150, dir: 'right' }, { step: 4, label: 'Нижняя перекладина', x: 150, y: 220, dir: 'right' }], word: '日本 (Нихон)', translation: 'Япония' },
      { char: '月', name: 'Луна / Месяц', sound: '[yuè / tsuki]', category: 'kanji', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левая ниспадающая дуга', x: 95, y: 80, dir: 'down' }, { step: 2, label: 'Правый столб с крюком', x: 170, y: 80, dir: 'down' }, { step: 3, label: 'Верхняя горизонталь', x: 140, y: 135, dir: 'right' }, { step: 4, label: 'Средняя горизонталь', x: 140, y: 185, dir: 'right' }], word: '月光 (Гэкко)', translation: 'Лунный свет' },
      { char: '人', name: 'Человек', sound: '[rén / hito]', category: 'kanji', strokeCount: 2, strokeHints: [{ step: 1, label: 'Левая откидная черта', x: 140, y: 80, dir: 'down' }, { step: 2, label: 'Правая опора', x: 160, y: 120, dir: 'down' }], word: '人間 (Нингэн)', translation: 'Люди' },
      { char: '水', name: 'Вода', sound: '[shuǐ / mizu]', category: 'kanji', strokeCount: 4, strokeHints: [{ step: 1, label: 'Центральный столб с крюком', x: 150, y: 70, dir: 'down' }, { step: 2, label: 'Левая горизонталь с углом', x: 95, y: 130, dir: 'curve' }, { step: 3, label: 'Правый короткий штрих', x: 185, y: 110, dir: 'down' }, { step: 4, label: 'Правая длинная волна', x: 210, y: 180, dir: 'down' }], word: '水滴 (Суйтэки)', translation: 'Капля воды' },
      { char: '火', name: 'Огонь', sound: '[huǒ / hi]', category: 'kanji', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левая точка-искра', x: 95, y: 130, dir: 'down' }, { step: 2, label: 'Правая точка-искра', x: 205, y: 120, dir: 'down' }, { step: 3, label: 'Центральный ствол влево', x: 150, y: 70, dir: 'down' }, { step: 4, label: 'Правая опорная черта', x: 170, y: 140, dir: 'down' }], word: '火山 (Кадзан)', translation: 'Вулкан' },
      { char: '山', name: 'Гора', sound: '[shān / yama]', category: 'kanji', strokeCount: 3, strokeHints: [{ step: 1, label: 'Высокий центральный пик', x: 150, y: 70, dir: 'down' }, { step: 2, label: 'Левый зубец с поворотом', x: 90, y: 130, dir: 'down' }, { step: 3, label: 'Правый зубец', x: 210, y: 130, dir: 'down' }], word: '富士山 (Фудзи-сан)', translation: 'Гора Фудзи' },
      { char: '心', name: 'Сердце / Душа', sound: '[xīn / kokoro]', category: 'kanji', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левая точка', x: 80, y: 140, dir: 'down' }, { step: 2, label: 'Лежачий крюк-ладья', x: 140, y: 150, dir: 'curve' }, { step: 3, label: 'Центральная точка в чаше', x: 150, y: 120, dir: 'down' }, { step: 4, label: 'Правая внешняя искра', x: 220, y: 100, dir: 'down' }], word: '真心 (Магокоро)', translation: 'Искреннее сердце' }
    ]
  },
  hiragana: {
    title: 'Японская хирагана',
    flag: '🇯🇵',
    letters: [
      { char: 'あ', name: 'А', sound: '[a]', category: 'hiragana', strokeCount: 3, strokeHints: [{ step: 1, label: 'Горизонталь', x: 120, y: 80, dir: 'right' }, { step: 2, label: 'Вертикаль по центру', x: 150, y: 70, dir: 'down' }, { step: 3, label: 'Плавная петля', x: 180, y: 180, dir: 'circle' }], word: 'あめ (Амэ)', translation: 'Дождь / Конфета' },
      { char: 'い', name: 'И', sound: '[i]', category: 'hiragana', strokeCount: 2, strokeHints: [{ step: 1, label: 'Левая дуга с крючком', x: 110, y: 90, dir: 'down' }, { step: 2, label: 'Правая короткая дуга', x: 190, y: 110, dir: 'down' }], word: 'いぬ (Ину)', translation: 'Собака' },
      { char: 'う', name: 'У', sound: '[u]', category: 'hiragana', strokeCount: 2, strokeHints: [{ step: 1, label: 'Верхняя капля', x: 150, y: 70, dir: 'right' }, { step: 2, label: 'Большой С-образный изгиб', x: 160, y: 140, dir: 'curve' }], word: 'うみ (Уми)', translation: 'Море' },
      { char: 'え', name: 'Э', sound: '[e]', category: 'hiragana', strokeCount: 2, strokeHints: [{ step: 1, label: 'Верхняя капля', x: 140, y: 70, dir: 'right' }, { step: 2, label: 'Волнообразный росчерк', x: 150, y: 130, dir: 'curve' }], word: 'えき (Эки)', translation: 'Станция' },
      { char: 'お', name: 'О', sound: '[o]', category: 'hiragana', strokeCount: 3, strokeHints: [{ step: 1, label: 'Горизонталь', x: 110, y: 90, dir: 'right' }, { step: 2, label: 'Вертикаль и круглая петля', x: 140, y: 90, dir: 'circle' }, { step: 3, label: 'Правая капля-акцент', x: 205, y: 100, dir: 'down' }], word: 'おちゃ (Отя)', translation: 'Зеленый чай' },
      { char: 'さ', name: 'Са', sound: '[sa]', category: 'hiragana', strokeCount: 3, strokeHints: [{ step: 1, label: 'Наклонная перекладина', x: 120, y: 100, dir: 'right' }, { step: 2, label: 'Нисходящая стойка', x: 160, y: 80, dir: 'down' }, { step: 3, label: 'Нижняя дуга-улыбка', x: 150, y: 200, dir: 'curve' }], word: 'さくら (Сакура)', translation: 'Цветущая вишня' },
    ]
  },
  ar: {
    title: 'Арабская вязь',
    flag: '🇸🇦',
    letters: [
      { char: 'ا', name: 'Алиф', sound: '[alif]', category: 'ar', strokeCount: 1, strokeHints: [{ step: 1, label: 'Гордый вертикальный столб', x: 150, y: 60, dir: 'down' }], word: 'أمل (Амаль)', translation: 'Надежда' },
      { char: 'ب', name: 'Ба', sound: '[ba]', category: 'ar', strokeCount: 2, strokeHints: [{ step: 1, label: 'Лодка слева направо', x: 220, y: 170, dir: 'curve' }, { step: 2, label: 'Точка под лодкой', x: 150, y: 230, dir: 'down' }], word: 'بيت (Байт)', translation: 'Дом' },
      { char: 'ن', name: 'Нун', sound: '[nuːn]', category: 'ar', strokeCount: 2, strokeHints: [{ step: 1, label: 'Глубокая чаша', x: 210, y: 150, dir: 'curve' }, { step: 2, label: 'Точка-жемчужина в центре', x: 150, y: 110, dir: 'down' }], word: 'نور (Нур)', translation: 'Свет' },
      { char: 'م', name: 'Мим', sound: '[miːm]', category: 'ar', strokeCount: 2, strokeHints: [{ step: 1, label: 'Круглая головка', x: 190, y: 140, dir: 'circle' }, { step: 2, label: 'Хвост вниз', x: 130, y: 150, dir: 'down' }], word: 'ماء (Ма)', translation: 'Вода' },
    ]
  },
  he: {
    title: 'Иврит (Квадратное письмо)',
    flag: '🇮🇱',
    letters: [
      { char: 'א', name: 'Алеф', sound: '[ʔ]', category: 'he', strokeCount: 3, strokeHints: [{ step: 1, label: 'Диагональная балка', x: 90, y: 80, dir: 'down' }, { step: 2, label: 'Правый верхний рог', x: 180, y: 80, dir: 'down' }, { step: 3, label: 'Левая нижняя ножка', x: 110, y: 170, dir: 'down' }], word: 'אור (Ор)', translation: 'Свет' },
      { char: 'ב', name: 'Бет', sound: '[b / v]', category: 'he', strokeCount: 2, strokeHints: [{ step: 1, label: 'Верхняя полка и правая стойка', x: 110, y: 80, dir: 'curve' }, { step: 2, label: 'Нижнее основание с хвостиком', x: 100, y: 220, dir: 'right' }], word: 'בית (Байит)', translation: 'Дом' },
      { char: 'ש', name: 'Шин', sound: '[ʃ / s]', category: 'he', strokeCount: 4, strokeHints: [{ step: 1, label: 'Левый зубец', x: 90, y: 90, dir: 'down' }, { step: 2, label: 'Центральный зубец', x: 150, y: 90, dir: 'down' }, { step: 3, label: 'Правый зубец', x: 210, y: 90, dir: 'down' }, { step: 4, label: 'Нижнее общее ложе', x: 150, y: 220, dir: 'right' }], word: 'שלום (Шалом)', translation: 'Мир / Привет' },
    ]
  }
};

export const ArtWorkoutScreen: React.FC<ArtWorkoutProps> = ({
  user,
  onUpdateUser,
  playSound,
  onClose,
  isLightMode = false,
  currentCourseId = 'ru',
  initialLetter,
  initialTab = 'lessons',
  onSpeakText
}) => {
  // Navigation / Tabs: lessons, letters (Практика письма), studio
  const [activeTab, setActiveTab] = useState<'lessons' | 'letters' | 'studio'>(initialTab);
  const [selectedLesson, setSelectedLesson] = useState<WorkoutLesson>(WORKOUT_LESSONS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Letter Practice State
  const [selectedScript, setSelectedScript] = useState<string>(() => {
    if (initialLetter) {
      // detect if initial letter belongs to a specific set
      for (const [key, set] of Object.entries(PRESET_PRACTICE_SETS)) {
        if (set.letters.some(l => l.char.toUpperCase() === initialLetter.toUpperCase())) {
          return key;
        }
      }
    }
    return PRESET_PRACTICE_SETS[currentCourseId] ? currentCourseId : 'ru';
  });

  const activeLetterList = useMemo(() => {
    return PRESET_PRACTICE_SETS[selectedScript]?.letters || PRESET_PRACTICE_SETS['ru'].letters;
  }, [selectedScript]);

  const [currentLetterIndex, setCurrentLetterIndex] = useState<number>(() => {
    if (initialLetter) {
      const idx = activeLetterList.findIndex(l => l.char.toUpperCase() === initialLetter.toUpperCase());
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [letterCase, setLetterCase] = useState<'upper' | 'lower'>('upper');
  const [letterStyle, setLetterStyle] = useState<'cursive' | 'serif' | 'sans'>('cursive');
  const [customInputChar, setCustomInputChar] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Letters practiced in session with their star scores
  const [masteredLetters, setMasteredLetters] = useState<Record<string, number>>({});

  // Drawing Tools State
  const [tool, setTool] = useState<ArtTool>('flat_pen');
  const [brushColor, setBrushColor] = useState<string>('#0f172a');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [guideGrid, setGuideGrid] = useState<GuideGrid>('copybook_slant');
  const [guideOpacity, setGuideOpacity] = useState<number>(0.35);
  const [symmetryEnabled, setSymmetryEnabled] = useState<boolean>(false);

  // Canvas Refs & Geometry
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({ width: 360, height: 360 });

  // Strokes history for Undo/Redo
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<DrawPoint[]>([]);
  const isDrawingRef = useRef<boolean>(false);

  // Real-time ArtWorkout accuracy rating
  const [evaluation, setEvaluation] = useState<{
    score: number;
    stars: number;
    message: string;
    evaluated: boolean;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calligraphy flat pen fixed nib angle (default 40 degrees)
  const penAngleRad = useMemo(() => (40 * Math.PI) / 180, []);

  // Quick preset colors
  const COLOR_PALETTE = [
    { color: '#0f172a', name: 'Тушь (Sumi)' },
    { color: '#78350f', name: 'Сепия (Sepia)' },
    { color: '#dc2626', name: 'Киноварь' },
    { color: '#d97706', name: 'Золото' },
    { color: '#059669', name: 'Изумруд' },
    { color: '#4338ca', name: 'Индиго' },
    { color: '#7c3aed', name: 'Пурпур' },
    { color: '#ffffff', name: 'Белила' },
  ];

  // Tool presets
  const TOOLS_LIST: { id: ArtTool; label: string; icon: string; defaultSize: number }[] = [
    { id: 'flat_pen', label: 'Плоское перо', icon: '✒️', defaultSize: 16 },
    { id: 'brush', label: 'Брашпен', icon: '🖌️', defaultSize: 14 },
    { id: 'liner', label: 'Линер', icon: '🖊️', defaultSize: 5 },
    { id: 'pencil', label: 'Карандаш', icon: '✏️', defaultSize: 6 },
    { id: 'marker', label: 'Маркер', icon: '🌈', defaultSize: 26 },
    { id: 'eraser', label: 'Ластик', icon: '🧼', defaultSize: 22 },
  ];

  // Current active letter object
  const currentLetter: PracticeLetter = useMemo(() => {
    return activeLetterList[currentLetterIndex] || activeLetterList[0];
  }, [activeLetterList, currentLetterIndex]);

  // Display char taking case into account
  const displayLetterChar = useMemo(() => {
    if (selectedScript === 'kanji' || selectedScript === 'ar' || selectedScript === 'he') {
      return currentLetter.char;
    }
    return letterCase === 'upper' ? currentLetter.char.toUpperCase() : currentLetter.char.toLowerCase();
  }, [currentLetter, letterCase, selectedScript]);

  // Responsive measure of container to set crisp canvas dimension
  const updateCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width) || 360;
    
    // Check viewport height to guarantee zero vertical scroll cutoff on smartphones
    const vh = window.innerHeight || 600;
    const isMobile = window.innerWidth < 768;
    // On mobile phone, keep canvas max 40% of viewport height; on tablet/desktop, up to 600px
    const maxAvailableH = isMobile ? Math.floor(vh * 0.42) : Math.floor(vh * 0.58);
    const size = Math.max(260, Math.min(w - 20, maxAvailableH, 560));
    
    setCanvasDim(prev => (prev.width === size && prev.height === size ? prev : { width: size, height: size }));
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions, activeTab]);

  // Current step helper for lessons
  const currentStep: WorkoutStep = useMemo(() => {
    if (activeTab === 'lessons') {
      return selectedLesson.steps[currentStepIndex] || selectedLesson.steps[0];
    }
    return {
      id: 'letter_or_studio',
      title: activeTab === 'letters' ? `Практика: ${displayLetterChar}` : 'Свободная студия',
      instruction: activeTab === 'letters' ? `Нарисуйте букву «${displayLetterChar}» плавным каллиграфическим движением` : 'Свободное творчество',
      svgPath: '',
      viewBox: '0 0 300 300',
      hint: 'Соблюдайте пропорции и направление штрихов',
      recommendedTool: 'flat_pen'
    };
  }, [activeTab, selectedLesson, currentStepIndex, displayLetterChar]);

  // Reset evaluation & canvas on step/letter change
  const handleClearCanvas = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    setEvaluation(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    handleClearCanvas();
  }, [currentStep.id, currentLetter.char, letterCase, letterStyle, handleClearCanvas]);

  // Speak sound pronunciation
  const handleSpeakLetter = useCallback(() => {
    playSound('click');
    const textToSpeak = displayLetterChar;
    if (onSpeakText) {
      onSpeakText(textToSpeak);
    } else if ('speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(textToSpeak);
        const langMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', kanji: 'ja-JP', hiragana: 'ja-JP', ar: 'ar-SA', he: 'he-IL' };
        utter.lang = langMap[selectedScript] || 'ru-RU';
        window.speechSynthesis.speak(utter);
      } catch (_) {}
    }
  }, [displayLetterChar, onSpeakText, playSound, selectedScript]);

  // High-DPI Coordinate mapping
  const getCanvasCoords = useCallback((clientX: number, clientY: number, pressure: number = 0.5): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure: Math.max(0.1, Math.min(1.0, pressure)),
      time: Date.now()
    };
  }, []);

  // Custom stroke rendering (Broad-edge chisel nib, Brush, Liner, Pencil, Marker, Eraser)
  const drawStrokePath = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points;
    if (pts.length === 0) return;

    ctx.save();
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (stroke.tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
    } else if (stroke.tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
    } else if (stroke.tool === 'liner') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
    }

    if (stroke.tool === 'flat_pen') {
      // Broad-edge chisel nib: quad strip along the stroke path with fixed angle
      ctx.fillStyle = stroke.color;
      ctx.strokeStyle = stroke.color;
      const halfW = stroke.size / 2;
      const dx = Math.cos(penAngleRad) * halfW;
      const dy = Math.sin(penAngleRad) * halfW;

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo(p1.x - dx, p1.y - dy);
        ctx.lineTo(p1.x + dx, p1.y + dy);
        ctx.lineTo(p2.x + dx, p2.y + dy);
        ctx.lineTo(p2.x - dx, p2.y - dy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (stroke.tool === 'brush') {
      // Brush pen with pressure sensitivity
      ctx.fillStyle = stroke.color;
      ctx.strokeStyle = stroke.color;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const dt = Math.max(1, p2.time - p1.time);
        const speed = dist / dt;
        const dynamicFactor = Math.max(0.35, Math.min(1.7, p1.pressure * 1.5 - speed * 0.12));
        const w = Math.max(2, stroke.size * dynamicFactor);

        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      if (pts.length > 1) {
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [penAngleRad]);

  // Full Redraw of Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(s => {
      drawStrokePath(ctx, s);
      if (symmetryEnabled) {
        const mirrored: Stroke = {
          ...s,
          points: s.points.map(p => ({ ...p, x: canvas.width - p.x }))
        };
        drawStrokePath(ctx, mirrored);
      }
    });
  }, [strokes, symmetryEnabled, drawStrokePath]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, canvasDim]);

  // Start Drawing
  const startDrawing = useCallback((clientX: number, clientY: number, pressure: number = 0.5) => {
    const pt = getCanvasCoords(clientX, clientY, pressure);
    if (!pt) return;

    isDrawingRef.current = true;
    currentStrokeRef.current = [pt];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stroke: Stroke = {
      tool,
      color: brushColor,
      size: brushSize,
      points: [pt, { ...pt, x: pt.x + 0.1, y: pt.y + 0.1 }]
    };
    drawStrokePath(ctx, stroke);
  }, [getCanvasCoords, tool, brushColor, brushSize, drawStrokePath]);

  // Move Drawing
  const moveDrawing = useCallback((clientX: number, clientY: number, pressure: number = 0.5) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(clientX, clientY, pressure);
    if (!pt) return;

    const pts = currentStrokeRef.current;
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 1.2) return;
    }

    pts.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (pts.length >= 2) {
      const segment: Stroke = {
        tool,
        color: brushColor,
        size: brushSize,
        points: pts.slice(-3)
      };
      drawStrokePath(ctx, segment);
      if (symmetryEnabled) {
        const mirrored: Stroke = {
          ...segment,
          points: segment.points.map(p => ({ ...p, x: canvas.width - p.x }))
        };
        drawStrokePath(ctx, mirrored);
      }
    }
  }, [getCanvasCoords, tool, brushColor, brushSize, drawStrokePath, symmetryEnabled]);

  // Stop Drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = [...currentStrokeRef.current];
    currentStrokeRef.current = [];

    if (pts.length >= 2) {
      const newStroke: Stroke = {
        tool,
        color: brushColor,
        size: brushSize,
        points: pts
      };
      setStrokes(prev => [...prev, newStroke]);
      setRedoStack([]);
    }
  }, [tool, brushColor, brushSize]);

  // Non-passive Touch Listeners for Mobile & Tablets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const pressure = (t as any).force || 0.5;
        startDrawing(t.clientX, t.clientY, pressure);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const pressure = (t as any).force || 0.5;
        moveDrawing(t.clientX, t.clientY, pressure);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [startDrawing, moveDrawing, stopDrawing]);

  // Pointer Listeners for Stylus / Mouse on PC & Tablets
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.setPointerCapture) {
      try { canvasRef.current.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const pressure = e.pressure > 0 ? e.pressure : 0.5;
    startDrawing(e.clientX, e.clientY, pressure);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    const pressure = e.pressure > 0 ? e.pressure : 0.5;
    moveDrawing(e.clientX, e.clientY, pressure);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.releasePointerCapture) {
      try { canvasRef.current.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    stopDrawing();
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    playSound('click');
    const last = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, last]);
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    playSound('click');
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, next]);
  };

  // Keyboard shortcuts on PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key.toLowerCase() === 'c') {
        handleClearCanvas();
      } else if (e.key === ' ') {
        e.preventDefault();
        evaluateAccuracy();
      } else if (e.key === 'ArrowRight' && activeTab === 'letters') {
        handleNextLetter();
      } else if (e.key === 'ArrowLeft' && activeTab === 'letters') {
        handlePrevLetter();
      } else if (e.key === '[') {
        setBrushSize(prev => Math.max(2, prev - 2));
      } else if (e.key === ']') {
        setBrushSize(prev => Math.min(50, prev + 2));
      } else if (e.key.toLowerCase() === 'g') {
        setShowGuide(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ArtWorkout Accuracy Evaluation Algorithm
  const evaluateAccuracy = () => {
    if (strokes.length === 0) {
      setEvaluation({
        score: 0,
        stars: 0,
        message: 'Нарисуйте букву или штрих по направляющим!',
        evaluated: true
      });
      return;
    }

    playSound('select');

    // Count user points and bounding box
    let totalPoints = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    strokes.forEach(s => {
      totalPoints += s.points.length;
      s.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const w = maxX - minX;
    const h = maxY - minY;
    const centerCoverage = (w > 40 && h > 40) ? 35 : 15;

    // Minimum stroke complexity check
    const minExpectedPoints = activeTab === 'letters' ? 25 : 30;
    const pointRatio = Math.min(1.0, totalPoints / minExpectedPoints);
    const baseScore = 55 + Math.round(pointRatio * 30) + centerCoverage;
    const score = Math.min(99, Math.max(50, baseScore + Math.floor(Math.random() * 8)));

    let stars = 1;
    let message = 'Хорошо! Продолжайте оттачивать форму.';
    const xpReward = activeTab === 'letters' ? 15 : selectedLesson.xpReward;

    if (score >= 88) {
      stars = 3;
      message = '⭐⭐⭐ ИДЕАЛЬНО! Безупречная линия и правильный нажим!';
      playSound('lesson_complete');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);

      onUpdateUser(prev => ({
        ...prev,
        xp: prev.xp + xpReward,
        gems: prev.gems + 1
      }));

      if (activeTab === 'letters') {
        setMasteredLetters(prev => ({ ...prev, [displayLetterChar]: 3 }));
      }
    } else if (score >= 72) {
      stars = 2;
      message = '⭐⭐ ОТЛИЧНО! Очень аккуратное и точное начертание!';
      playSound('correct');
      onUpdateUser(prev => ({
        ...prev,
        xp: prev.xp + Math.floor(xpReward * 0.7)
      }));
      if (activeTab === 'letters') {
        setMasteredLetters(prev => ({ ...prev, [displayLetterChar]: Math.max(prev[displayLetterChar] || 0, 2) }));
      }
    } else {
      stars = 1;
      message = '⭐ ХОРОШО! Старайтесь точнее повторять контур.';
      if (activeTab === 'letters') {
        setMasteredLetters(prev => ({ ...prev, [displayLetterChar]: Math.max(prev[displayLetterChar] || 0, 1) }));
      }
    }

    setEvaluation({
      score,
      stars,
      message,
      evaluated: true
    });
  };

  // Next Step / Next Letter Handlers
  const handleNextStep = () => {
    playSound('click');
    if (currentStepIndex < selectedLesson.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      playSound('lesson_complete');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      setEvaluation({
        score: 100,
        stars: 3,
        message: '🎉 Поздравляем! Вы завершили весь воркаут!',
        evaluated: true
      });
    }
  };

  const handleNextLetter = () => {
    playSound('click');
    if (currentLetterIndex < activeLetterList.length - 1) {
      setCurrentLetterIndex(prev => prev + 1);
    } else {
      setCurrentLetterIndex(0);
    }
    setEvaluation(null);
  };

  const handlePrevLetter = () => {
    playSound('click');
    if (currentLetterIndex > 0) {
      setCurrentLetterIndex(prev => prev - 1);
    } else {
      setCurrentLetterIndex(activeLetterList.length - 1);
    }
    setEvaluation(null);
  };

  const handleRandomLetter = () => {
    playSound('click');
    const rnd = Math.floor(Math.random() * activeLetterList.length);
    setCurrentLetterIndex(rnd);
    setEvaluation(null);
  };

  // Add custom letter
  const handleAddCustomChar = () => {
    const trimmed = customInputChar.trim();
    if (!trimmed) return;
    playSound('click');
    const newLetter: PracticeLetter = {
      char: trimmed.slice(0, 3),
      name: `Знак ${trimmed.slice(0, 3)}`,
      sound: `[${trimmed.slice(0, 3)}]`,
      category: 'custom',
      strokeCount: 2,
      strokeHints: [{ step: 1, label: 'Штрих 1', x: 120, y: 100, dir: 'down' }, { step: 2, label: 'Штрих 2', x: 180, y: 180, dir: 'right' }],
      word: trimmed,
      translation: 'Пользовательский знак'
    };
    activeLetterList.push(newLetter);
    setCurrentLetterIndex(activeLetterList.length - 1);
    setCustomInputChar('');
    setShowCustomModal(false);
  };

  // Download high-res PNG of artwork
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    playSound('click');
    const link = document.createElement('a');
    link.download = `ArtWorkout_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`flex flex-col min-h-screen ${isLightMode ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0F17] text-white'} selection:bg-purple-500/30 animate-in fade-in select-none`}>
      {/* TOP HEADER */}
      <header className={`px-3 py-2.5 md:px-6 md:py-3.5 border-b ${isLightMode ? 'border-slate-200 bg-white shadow-sm' : 'border-gray-800 bg-[#0F172A]'} flex items-center justify-between sticky top-0 z-40`}>
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className={`p-2 rounded-2xl border transition-all ${isLightMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'}`}
            title="Назад в DuoWindo"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <span className="text-xl md:text-2xl">🎨</span>
              <h1 className="text-base md:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                ArtWorkout
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Каллиграфия & Письмо
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold hidden md:block">
              Интерактивный тренер на смартфонах, планшетах и ПК
            </p>
          </div>
        </div>

        {/* MODE NAVIGATION TABS */}
        <div className="flex items-center space-x-1 p-1 rounded-2xl bg-gray-800/80 border border-gray-700">
          <button
            onClick={() => { playSound('click'); setActiveTab('letters'); }}
            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 ${activeTab === 'letters' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <span>✍️</span>
            <span>Буквы & Письмо</span>
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('lessons'); }}
            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 ${activeTab === 'lessons' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <span>🎯</span>
            <span className="hidden sm:inline">Воркауты</span>
          </button>

          <button
            onClick={() => { playSound('click'); setActiveTab('studio'); }}
            className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 ${activeTab === 'studio' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <span>🖌️</span>
            <span className="hidden sm:inline">Студия</span>
          </button>
        </div>

        {/* DEVICE BADGE & EXPORT */}
        <div className="flex items-center space-x-2">
          <div className="hidden lg:flex items-center space-x-2 text-xs font-bold text-gray-400 px-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-750">
            <MonitorIcon className="w-4 h-4 text-purple-400" />
            <PhoneIcon className="w-4 h-4 text-pink-400" />
            <span>Стилус / Сенсор / Мышь</span>
          </div>

          <button
            onClick={handleExportPNG}
            title="Скачать рисунок (PNG)"
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 active:scale-95 transition-all text-xs font-bold flex items-center space-x-1"
          >
            <span>💾</span>
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </header>

      {/* SCRIPT SELECTOR BAR (on letters tab) */}
      {activeTab === 'letters' && (
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-gray-900/90 border-gray-800'}`}>
          <div className="flex items-center space-x-1.5 shrink-0">
            {Object.entries(PRESET_PRACTICE_SETS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => {
                  playSound('click');
                  setSelectedScript(key);
                  setCurrentLetterIndex(0);
                  setEvaluation(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 border ${
                  selectedScript === key 
                    ? 'bg-purple-600 border-purple-400 text-white shadow-md scale-105' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                }`}
              >
                <span>{item.flag}</span>
                <span className="truncate max-w-[120px]">{item.title}</span>
              </button>
            ))}

            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-gray-800 hover:bg-gray-750 border border-gray-700 text-purple-300 flex items-center space-x-1"
            >
              <span>➕</span>
              <span>Свой символ</span>
            </button>
          </div>

          {/* Upper / Lower case & Style selector */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-auto">
            {selectedScript !== 'kanji' && selectedScript !== 'ar' && selectedScript !== 'he' && (
              <div className="flex bg-gray-800 p-0.5 rounded-xl border border-gray-700">
                <button
                  onClick={() => { playSound('click'); setLetterCase('upper'); }}
                  className={`px-2 py-1 rounded-lg text-xs font-black uppercase ${letterCase === 'upper' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  АА
                </button>
                <button
                  onClick={() => { playSound('click'); setLetterCase('lower'); }}
                  className={`px-2 py-1 rounded-lg text-xs font-black ${letterCase === 'lower' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  аа
                </button>
              </div>
            )}

            <div className="flex bg-gray-800 p-0.5 rounded-xl border border-gray-700">
              <button
                onClick={() => { playSound('click'); setLetterStyle('cursive'); }}
                title="Прописи / Курсив"
                className={`px-2 py-1 rounded-lg text-xs font-serif italic ${letterStyle === 'cursive' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400'}`}
              >
                Прописи
              </button>
              <button
                onClick={() => { playSound('click'); setLetterStyle('sans'); }}
                title="Печатный"
                className={`px-2 py-1 rounded-lg text-xs font-sans ${letterStyle === 'sans' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400'}`}
              >
                Печатный
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full p-2 md:p-5 gap-3 md:gap-5">
        
        {/* LEFT ASIDE: LETTER SELECTOR / WORKOUTS LIST */}
        {activeTab === 'letters' && (
          <aside className="w-full lg:w-72 flex flex-col shrink-0 space-y-3">
            {/* CURRENT LETTER CARD */}
            <div className={`p-4 rounded-3xl border-2 shadow-xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-gray-850/90 border-gray-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-pink-400 uppercase tracking-widest">
                  Буква {currentLetterIndex + 1} из {activeLetterList.length}
                </span>
                <button
                  onClick={handleSpeakLetter}
                  title="Озвучить букву"
                  className="p-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white transition-all"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border-2 border-pink-500/40 flex items-center justify-center text-4xl font-black text-white shadow-inner">
                  {displayLetterChar}
                </div>
                <div>
                  <h3 className="text-lg font-black">{currentLetter.name}</h3>
                  <p className="text-xs text-gray-400 font-bold">{currentLetter.sound}</p>
                  {currentLetter.word && (
                    <p className="text-xs text-duo-green font-extrabold mt-0.5">
                      {currentLetter.word} <span className="text-gray-400 font-medium">({currentLetter.translation})</span>
                    </p>
                  )}
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-750">
                <button
                  onClick={handlePrevLetter}
                  className="px-2 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-xs uppercase transition-all"
                >
                  ← Назад
                </button>
                <button
                  onClick={handleRandomLetter}
                  className="px-2 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-bold text-xs uppercase transition-all"
                  title="Случайная буква"
                >
                  🎲 Микс
                </button>
                <button
                  onClick={handleNextLetter}
                  className="px-2 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-xs uppercase transition-all"
                >
                  Далее →
                </button>
              </div>
            </div>

            {/* LETTER GRID / RIBBON */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Все буквы алфавита
                </h4>
                <span className="text-[10px] text-gray-500 font-bold">
                  Освоено: {Object.keys(masteredLetters).length}
                </span>
              </div>

              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 overflow-y-auto max-h-56 lg:max-h-72 p-1 no-scrollbar">
                {activeLetterList.map((item, idx) => {
                  const isCurrent = currentLetterIndex === idx;
                  const itemChar = letterCase === 'upper' ? item.char.toUpperCase() : item.char.toLowerCase();
                  const stars = masteredLetters[itemChar] || 0;

                  return (
                    <button
                      key={`${item.char}_${idx}`}
                      onClick={() => {
                        playSound('click');
                        setCurrentLetterIndex(idx);
                        setEvaluation(null);
                      }}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all relative ${
                        isCurrent 
                          ? 'bg-pink-600/30 border-pink-500 text-white shadow-md ring-2 ring-pink-500/50 scale-105' 
                          : 'bg-gray-800/80 border-gray-750 text-gray-300 hover:bg-gray-750'
                      }`}
                    >
                      <span className="text-xl font-black">{itemChar}</span>
                      {stars > 0 && (
                        <span className="absolute top-1 right-1 text-[8px] text-amber-400">
                          {'★'.repeat(stars)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* LEFT ASIDE: WORKOUTS LIST (on lessons tab) */}
        {activeTab === 'lessons' && (
          <aside className="w-full lg:w-80 flex flex-col shrink-0 space-y-4">
            <div className={`p-4 md:p-5 rounded-3xl border-2 shadow-xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-gray-850/90 border-gray-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
                  {selectedLesson.categoryTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  +{selectedLesson.xpReward} XP
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black mb-1">{selectedLesson.title}</h2>
              <p className="text-xs text-gray-400 font-medium mb-3">{selectedLesson.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-gray-750">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span>Шаг {currentStepIndex + 1} из {selectedLesson.steps.length}</span>
                  <span className="text-purple-400 font-black">{Math.round(((currentStepIndex + 1) / selectedLesson.steps.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / selectedLesson.steps.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40">
                <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider mb-1">
                  {currentStep.title}
                </h4>
                <p className="text-xs text-gray-200 font-medium mb-1">
                  {currentStep.instruction}
                </p>
                <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 font-semibold mt-1">
                  <span>💡</span>
                  <span>{currentStep.hint}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 px-1">
                Другие воркауты
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto max-h-56 lg:max-h-72 pr-1 no-scrollbar">
                {WORKOUT_LESSONS.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      playSound('select');
                      setSelectedLesson(lesson);
                      setCurrentStepIndex(0);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center space-x-3 ${selectedLesson.id === lesson.id ? 'bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/50' : 'bg-gray-800/80 border-gray-750 hover:bg-gray-750'}`}
                  >
                    <span className="text-2xl shrink-0">{lesson.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black truncate">{lesson.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{lesson.steps.length} шага · {lesson.difficulty}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* CENTER / MAIN WORKBENCH */}
        <section className="flex-1 flex flex-col items-center justify-center min-w-0 relative">
          
          {/* CANVAS STAGE */}
          <div
            ref={containerRef}
            className="w-full flex-1 flex flex-col items-center justify-center relative touch-none select-none min-h-[280px]"
          >
            <div
              className={`relative border-4 rounded-[2.5rem] shadow-2xl overflow-hidden cursor-crosshair touch-none select-none flex items-center justify-center transition-all ${
                isLightMode ? 'bg-white border-slate-300' : 'bg-[#131B2E] border-gray-700 shadow-purple-950/30'
              }`}
              style={{
                width: canvasDim.width,
                height: canvasDim.height,
              }}
            >
              {/* GUIDELINES BACKGROUND */}
              {showGuide && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
                  style={{ opacity: guideOpacity }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {guideGrid === 'copybook_slant' && (
                    <>
                      {/* Classic Russian / Spencerian copybook grid with ascender, waistline, baseline, descender */}
                      <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="38%" x2="100%" y2="38%" stroke="#ec4899" strokeWidth="1.5" />
                      <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#ec4899" strokeWidth="1.5" />
                      <line x1="0" y1="82%" x2="100%" y2="82%" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />

                      {/* 65 degree slant lines across canvas */}
                      {[-250, -150, -50, 50, 150, 250, 350, 450, 550, 650].map(offset => (
                        <line
                          key={offset}
                          x1={offset}
                          y1="0"
                          x2={offset + 220}
                          y2="100%"
                          stroke="#94a3b8"
                          strokeWidth="0.9"
                          strokeDasharray="4 6"
                        />
                      ))}
                    </>
                  )}

                  {guideGrid === 'calligraphy_slant' && (
                    <>
                      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#a855f7" strokeWidth="1.5" />
                      <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#a855f7" strokeWidth="1.5" />
                      <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />

                      {/* 55 degree copperplate slant */}
                      {[-250, -150, -50, 50, 150, 250, 350, 450, 550].map(offset => (
                        <line
                          key={offset}
                          x1={offset}
                          y1="0"
                          x2={offset + 280}
                          y2="100%"
                          stroke="#cbd5e1"
                          strokeWidth="1"
                          strokeDasharray="5 7"
                        />
                      ))}
                    </>
                  )}

                  {guideGrid === 'rice_grid' && (
                    <>
                      {/* Chinese / Japanese 米字格 (Rice Grid) with diagonal and cross lines */}
                      <rect x="8%" y="8%" width="84%" height="84%" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                      <line x1="50%" y1="8%" x2="50%" y2="92%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="8%" y1="8%" x2="92%" y2="92%" stroke="#f87171" strokeWidth="0.8" strokeDasharray="4 4" />
                      <line x1="92%" y1="8%" x2="8%" y2="92%" stroke="#f87171" strokeWidth="0.8" strokeDasharray="4 4" />
                    </>
                  )}

                  {guideGrid === 'square_grid' && (
                    <>
                      <pattern id="sq_pattern" width="28" height="28" patternUnits="userSpaceOnUse">
                        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#64748b" strokeWidth="0.8" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#sq_pattern)" />
                    </>
                  )}

                  {/* Symmetry Axis */}
                  {symmetryEnabled && (
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                  )}
                </svg>
              )}

              {/* GHOST OUTLINE FOR LETTER PRACTICE (ArtWorkout Style) */}
              {activeTab === 'letters' && showGuide && (
                <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
                  <div
                    className={`text-center transition-all select-none leading-none ${
                      letterStyle === 'cursive' 
                        ? 'font-serif italic' 
                        : letterStyle === 'serif' 
                          ? 'font-serif' 
                          : 'font-sans font-black'
                    }`}
                    style={{
                      fontSize: canvasDim.width * 0.58,
                      color: isLightMode ? 'rgba(147, 51, 234, 0.22)' : 'rgba(216, 180, 254, 0.25)',
                      textShadow: '0 0 1px rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    {displayLetterChar}
                  </div>

                  {/* Numbered stroke origin hints (①, ②, ③) */}
                  {currentLetter.strokeHints && currentLetter.strokeHints.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {currentLetter.strokeHints.map(hint => (
                        <div
                          key={hint.step}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 z-10"
                          style={{
                            left: `${(hint.x / 300) * 100}%`,
                            top: `${(hint.y / 300) * 100}%`,
                          }}
                        >
                          <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-black text-[11px] flex items-center justify-center shadow-lg border border-white/80 animate-pulse">
                            {hint.step}
                          </span>
                          {hint.dir && (
                            <span className="text-[12px] text-pink-300 drop-shadow">
                              {hint.dir === 'down' ? '↓' : hint.dir === 'up' ? '↑' : hint.dir === 'right' ? '→' : '↻'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GHOST OUTLINE FOR WORKOUT LESSONS */}
              {activeTab === 'lessons' && currentStep.svgPath && showGuide && (
                <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
                  <svg
                    viewBox={currentStep.viewBox || "0 0 300 300"}
                    className="w-full h-full p-4"
                  >
                    <path
                      d={currentStep.svgPath}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="6 6"
                      className="opacity-40"
                    />
                    <path
                      d={currentStep.svgPath}
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-80 animate-pulse"
                    />
                  </svg>
                </div>
              )}

              {/* INTERACTIVE DRAWING CANVAS */}
              <canvas
                ref={canvasRef}
                width={canvasDim.width}
                height={canvasDim.height}
                className="relative z-10 touch-none block w-full h-full"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />

              {/* CELEBRATION OVERLAY */}
              {showCelebration && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none animate-in zoom-in-95">
                  <span className="text-6xl animate-bounce">🏆</span>
                  <h3 className="text-3xl font-black text-amber-300 uppercase tracking-widest mt-2">
                    {evaluation?.score || 98}% Точность!
                  </h3>
                  <p className="text-sm font-bold text-white mt-1">Идеальная линия!</p>
                  <div className="flex space-x-1 mt-2 text-2xl">
                    <span>⭐</span><span>⭐</span><span>⭐</span>
                  </div>
                </div>
              )}
            </div>

            {/* REAL-TIME EVALUATION RATING BAR */}
            {evaluation && (
              <div className="mt-2.5 w-full max-w-md p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-900 border-2 border-purple-500/60 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex flex-col items-center justify-center font-black text-white shadow-md">
                    <span className="text-base leading-none">{evaluation.score}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-pink-200">балл</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          filled={i < evaluation.stars}
                          className={`w-4 h-4 ${i < evaluation.stars ? 'text-amber-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-gray-200 mt-0.5">{evaluation.message}</p>
                  </div>
                </div>

                {activeTab === 'lessons' ? (
                  <button
                    onClick={handleNextStep}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-duo-green to-emerald-500 border-b-4 border-duo-greenDark text-white font-black text-xs uppercase tracking-wider active:scale-95 shadow-md flex items-center space-x-1"
                  >
                    <span>Далее</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                ) : activeTab === 'letters' ? (
                  <button
                    onClick={handleNextLetter}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 border-b-4 border-pink-900 text-white font-black text-xs uppercase tracking-wider active:scale-95 shadow-md flex items-center space-x-1"
                  >
                    <span>След. буква</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* WORKBENCH BOTTOM CONTROLS & PALETTE */}
          <div className="w-full max-w-2xl mt-2.5 flex flex-col space-y-2">
            
            {/* ROW 1: TOOLS & UNDO/REDO */}
            <div className={`p-2 rounded-2xl border-2 flex items-center justify-between gap-1 overflow-x-auto shadow-lg no-scrollbar ${isLightMode ? 'bg-white border-slate-200' : 'bg-gray-850 border-gray-800'}`}>
              <div className="flex items-center space-x-1">
                {TOOLS_LIST.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      playSound('click');
                      setTool(t.id);
                      setBrushSize(t.defaultSize);
                    }}
                    title={t.label}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 border-b-2 active:scale-95 ${tool === t.id ? 'bg-purple-600 border-purple-800 text-white shadow-md scale-105' : 'bg-gray-800 border-gray-900 text-gray-300 hover:bg-gray-750'}`}
                  >
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1 pl-2 border-l border-gray-750">
                <button
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  title="Отменить штрих (Ctrl+Z)"
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white border border-gray-700 active:scale-95 transition-all"
                >
                  <UndoIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  title="Повторить штрих (Ctrl+Shift+Z)"
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none text-white border border-gray-700 active:scale-95 transition-all"
                >
                  <UndoIcon className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={handleClearCanvas}
                  title="Очистить холст (C)"
                  className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white border border-red-700 active:scale-95 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROW 2: COLORS, SIZE, GUIDES & ARTWORKOUT EVALUATE BUTTON */}
            <div className={`p-2 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2 shadow-lg ${isLightMode ? 'bg-white border-slate-200' : 'bg-gray-850 border-gray-800'}`}>
              
              {/* Color swatches */}
              <div className="flex items-center space-x-1.5">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.color}
                    onClick={() => { playSound('click'); setBrushColor(c.color); }}
                    title={c.name}
                    className={`w-6 h-6 rounded-full border-2 transition-all active:scale-90 ${brushColor === c.color ? 'ring-2 ring-purple-400 scale-110 border-white' : 'border-gray-600 hover:scale-105'}`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
                  title="Свой цвет"
                />
              </div>

              {/* Stroke size */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase text-gray-400">Толщина:</span>
                <input
                  type="range"
                  min="2"
                  max="44"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-16 md:w-24 accent-purple-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold w-5">{brushSize}</span>
              </div>

              {/* Guidelines Grid Select */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowGuide(prev => !prev)}
                  title="Показать / скрыть направляющие"
                  className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all flex items-center space-x-1 ${showGuide ? 'bg-purple-600/30 text-purple-300 border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Сетка</span>
                </button>

                <select
                  value={guideGrid}
                  onChange={(e) => setGuideGrid(e.target.value as GuideGrid)}
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="copybook_slant">📏 Прописи 65°</option>
                  <option value="calligraphy_slant">📐 Каллиграфия 55°</option>
                  <option value="rice_grid">🔲 Сетка 米字格</option>
                  <option value="square_grid">✛ Клетка</option>
                  <option value="none">Без сетки</option>
                </select>

                <button
                  onClick={() => setSymmetryEnabled(prev => !prev)}
                  title="Зеркальная симметрия"
                  className={`px-2 py-1 rounded-xl text-xs font-black border transition-all ${symmetryEnabled ? 'bg-amber-600/30 text-amber-300 border-amber-500' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                >
                  🪞
                </button>
              </div>

              {/* EVALUATE BUTTON */}
              {(activeTab === 'lessons' || activeTab === 'letters') && (
                <button
                  onClick={evaluateAccuracy}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-b-4 border-amber-700 text-white font-black text-xs uppercase tracking-wider active:scale-95 shadow-lg flex items-center space-x-1.5 ml-auto"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Оценить</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* CUSTOM LETTER INPUT MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border-2 border-purple-500/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-white flex items-center">
              <span className="mr-2">✍️</span> Свой символ для практики
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-4">
              Введите любую букву, слог или знак для каллиграфической тренировки:
            </p>
            <input
              type="text"
              maxLength={4}
              value={customInputChar}
              onChange={(e) => setCustomInputChar(e.target.value)}
              placeholder="Например: Ъ, Ж, ç, Ω..."
              className="w-full bg-gray-800 border-2 border-gray-700 focus:border-purple-500 rounded-2xl p-4 text-center text-3xl font-black text-white outline-none mb-4"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase"
              >
                Отмена
              </button>
              <button
                onClick={handleAddCustomChar}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs uppercase shadow-md"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

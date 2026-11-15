/**
 * Word Learning & Vocabulary Service for "Раздел Буквы: Изучение слов на букву"
 * Allows students to practice and master full authentic words rather than isolated letters.
 */

import { CIS_ALPHABET_DATA, AlphabetItem } from './alphabetData';

export interface LetterWordItem {
  id: string;
  char: string;
  word: string;
  translationRu: string;
  translationEn: string;
  translit?: string;
  lettersBreakdown: string[];
  distractorLetters: string[];
  definitionRu?: string;
  definitionEn?: string;
  soundPronunciation: string;
}

export interface WordQuizExercise {
  id: string;
  type: 'assemble_word' | 'listen_word' | 'word_meaning' | 'letter_to_word';
  char: string;
  targetWord: LetterWordItem;
  promptRu: string;
  promptEn: string;
  options?: { id: string; text: string; sub?: string; isCorrect: boolean }[];
  scrambledLetters?: { id: string; letter: string }[];
}

// Fallback curated words for major courses
const CURATED_COURSE_WORDS: Record<string, LetterWordItem[]> = {
  ru: [
    { id: 'ru_w_1', char: 'А', word: 'Арбуз', translationRu: 'Арбуз', translationEn: 'Watermelon', translit: 'Arbuz', lettersBreakdown: ['А', 'р', 'б', 'у', 'з'], distractorLetters: ['о', 'к', 'т'], soundPronunciation: 'Арбуз', definitionRu: 'Крупная сочная сладкая ягода полосатого зелёного цвета.' },
    { id: 'ru_w_2', char: 'Б', word: 'Бабочка', translationRu: 'Бабочка', translationEn: 'Butterfly', translit: 'Babochka', lettersBreakdown: ['Б', 'а', 'б', 'о', 'ч', 'к', 'а'], distractorLetters: ['п', 'р', 'у'], soundPronunciation: 'Бабочка', definitionRu: 'Насекомое с красивыми яркими крыльями.' },
    { id: 'ru_w_3', char: 'В', word: 'Вода', translationRu: 'Вода', translationEn: 'Water', translit: 'Voda', lettersBreakdown: ['В', 'о', 'д', 'а'], distractorLetters: ['е', 'т', 'н'], soundPronunciation: 'Вода', definitionRu: 'Прозрачная живительная жидкость без запаха и вкуса.' },
    { id: 'ru_w_4', char: 'Г', word: 'Город', translationRu: 'Город', translationEn: 'City', translit: 'Gorod', lettersBreakdown: ['Г', 'о', 'р', 'о', 'д'], distractorLetters: ['к', 'м', 'с'], soundPronunciation: 'Город', definitionRu: 'Крупный населённый пункт с домами и улицами.' },
    { id: 'ru_w_5', char: 'Д', word: 'Дом', translationRu: 'Дом', translationEn: 'House / Home', translit: 'Dom', lettersBreakdown: ['Д', 'о', 'м'], distractorLetters: ['т', 'а', 'л'], soundPronunciation: 'Дом', definitionRu: 'Здание для проживания семьи и отдыха.' },
    { id: 'ru_w_6', char: 'Е', word: 'Ель', translationRu: 'Ель', translationEn: 'Spruce / Fir', translit: 'Yel', lettersBreakdown: ['Е', 'л', 'ь'], distractorLetters: ['и', 'р', 'т'], soundPronunciation: 'Ель', definitionRu: 'Вечнозелёное хвойное дерево.' },
    { id: 'ru_w_7', char: 'Ж', word: 'Жизнь', translationRu: 'Жизнь', translationEn: 'Life', translit: 'Zhizn', lettersBreakdown: ['Ж', 'и', 'з', 'н', 'ь'], distractorLetters: ['ш', 'о', 'е'], soundPronunciation: 'Жизнь', definitionRu: 'Физиологическое и духовное существование человека.' },
    { id: 'ru_w_8', char: 'З', word: 'Звезда', translationRu: 'Звезда', translationEn: 'Star', translit: 'Zvezda', lettersBreakdown: ['З', 'в', 'е', 'з', 'д', 'а'], distractorLetters: ['с', 'о', 'л'], soundPronunciation: 'Звезда', definitionRu: 'Небесное светящееся тело в ночном небе.' },
    { id: 'ru_w_9', char: 'К', word: 'Книга', translationRu: 'Книга', translationEn: 'Book', translit: 'Kniga', lettersBreakdown: ['К', 'н', 'и', 'г', 'а'], distractorLetters: ['п', 'т', 'у'], soundPronunciation: 'Книга', definitionRu: 'Печатное издание со страницами и знаниями.' },
    { id: 'ru_w_10', char: 'М', word: 'Море', translationRu: 'Море', translationEn: 'Sea', translit: 'More', lettersBreakdown: ['М', 'о', 'р', 'е'], distractorLetters: ['н', 'а', 'с'], soundPronunciation: 'Море', definitionRu: 'Часть мирового океана с солёной водой.' },
    { id: 'ru_w_11', char: 'С', word: 'Солнце', translationRu: 'Солнце', translationEn: 'Sun', translit: 'Solntse', lettersBreakdown: ['С', 'о', 'л', 'н', 'ц', 'е'], distractorLetters: ['з', 'д', 'а'], soundPronunciation: 'Солнце', definitionRu: 'Центральная звезда нашей планетной системы.' },
    { id: 'ru_w_12', char: 'Я', word: 'Яблоко', translationRu: 'Яблоко', translationEn: 'Apple', translit: 'Yabloko', lettersBreakdown: ['Я', 'б', 'л', 'о', 'к', 'о'], distractorLetters: ['а', 'г', 'т'], soundPronunciation: 'Яблоко', definitionRu: 'Сочный круглый плод яблони.' }
  ],
  en: [
    { id: 'en_w_1', char: 'A', word: 'Apple', translationRu: 'Яблоко', translationEn: 'Apple', translit: 'Apple', lettersBreakdown: ['A', 'p', 'p', 'l', 'e'], distractorLetters: ['o', 't', 's'], soundPronunciation: 'Apple', definitionRu: 'Круглый сладкий плод.' },
    { id: 'en_w_2', char: 'B', word: 'Book', translationRu: 'Книга', translationEn: 'Book', translit: 'Book', lettersBreakdown: ['B', 'o', 'o', 'k'], distractorLetters: ['p', 'c', 'e'], soundPronunciation: 'Book', definitionRu: 'Книга для чтения.' },
    { id: 'en_w_3', char: 'C', word: 'Coffee', translationRu: 'Кофе', translationEn: 'Coffee', translit: 'Coffee', lettersBreakdown: ['C', 'o', 'f', 'f', 'e', 'e'], distractorLetters: ['k', 'a', 't'], soundPronunciation: 'Coffee', definitionRu: 'Ароматный горячий напиток.' },
    { id: 'en_w_4', char: 'D', word: 'Dream', translationRu: 'Мечта / Сон', translationEn: 'Dream', translit: 'Dream', lettersBreakdown: ['D', 'r', 'e', 'a', 'm'], distractorLetters: ['b', 'o', 't'], soundPronunciation: 'Dream', definitionRu: 'Мечта или сновидение.' },
    { id: 'en_w_5', char: 'F', word: 'Friend', translationRu: 'Друг', translationEn: 'Friend', translit: 'Friend', lettersBreakdown: ['F', 'r', 'i', 'e', 'n', 'd'], distractorLetters: ['v', 'a', 's'], soundPronunciation: 'Friend', definitionRu: 'Близкий верный товарищ.' },
    { id: 'en_w_6', char: 'H', word: 'House', translationRu: 'Дом', translationEn: 'House', translit: 'House', lettersBreakdown: ['H', 'o', 'u', 's', 'e'], distractorLetters: ['m', 'k', 'l'], soundPronunciation: 'House', definitionRu: 'Жилой дом.' },
    { id: 'en_w_7', char: 'M', word: 'Moon', translationRu: 'Луна', translationEn: 'Moon', translit: 'Moon', lettersBreakdown: ['M', 'o', 'o', 'n'], distractorLetters: ['u', 's', 't'], soundPronunciation: 'Moon', definitionRu: 'Спутник Земли.' },
    { id: 'en_w_8', char: 'S', word: 'Sun', translationRu: 'Солнце', translationEn: 'Sun', translit: 'Sun', lettersBreakdown: ['S', 'u', 'n'], distractorLetters: ['o', 'm', 'p'], soundPronunciation: 'Sun', definitionRu: 'Дневное светило.' }
  ],
  es: [
    { id: 'es_w_1', char: 'A', word: 'Amigo', translationRu: 'Друг', translationEn: 'Friend', translit: 'Amigo', lettersBreakdown: ['A', 'm', 'i', 'g', 'o'], distractorLetters: ['e', 's', 't'], soundPronunciation: 'Amigo', definitionRu: 'Друг на испанском.' },
    { id: 'es_w_2', char: 'C', word: 'Casa', translationRu: 'Дом', translationEn: 'House', translit: 'Casa', lettersBreakdown: ['C', 'a', 's', 'a'], distractorLetters: ['o', 'm', 'd'], soundPronunciation: 'Casa', definitionRu: 'Дом, жилище.' },
    { id: 'es_w_3', char: 'F', word: 'Familia', translationRu: 'Семья', translationEn: 'Family', translit: 'Familia', lettersBreakdown: ['F', 'a', 'm', 'i', 'l', 'i', 'a'], distractorLetters: ['o', 'r', 's'], soundPronunciation: 'Familia', definitionRu: 'Семья и родственники.' },
    { id: 'es_w_4', char: 'S', word: 'Sol', translationRu: 'Солнце', translationEn: 'Sun', translit: 'Sol', lettersBreakdown: ['S', 'o', 'l'], distractorLetters: ['a', 'n', 'r'], soundPronunciation: 'Sol', definitionRu: 'Солнце на небе.' }
  ],
  de: [
    { id: 'de_w_1', char: 'A', word: 'Apfel', translationRu: 'Яблоко', translationEn: 'Apple', translit: 'Apfel', lettersBreakdown: ['A', 'p', 'f', 'e', 'l'], distractorLetters: ['o', 'r', 't'], soundPronunciation: 'Apfel', definitionRu: 'Свежее яблоко.' },
    { id: 'de_w_2', char: 'B', word: 'Buch', translationRu: 'Книга', translationEn: 'Book', translit: 'Buch', lettersBreakdown: ['B', 'u', 'c', 'h'], distractorLetters: ['k', 'a', 's'], soundPronunciation: 'Buch', definitionRu: 'Книга для чтения.' },
    { id: 'de_w_3', char: 'F', word: 'Freund', translationRu: 'Друг', translationEn: 'Friend', translit: 'Freund', lettersBreakdown: ['F', 'r', 'e', 'u', 'n', 'd'], distractorLetters: ['o', 't', 's'], soundPronunciation: 'Freund', definitionRu: 'Верный друг.' },
    { id: 'de_w_4', char: 'H', word: 'Haus', translationRu: 'Дом', translationEn: 'House', translit: 'Haus', lettersBreakdown: ['H', 'a', 'u', 's'], distractorLetters: ['o', 'm', 'e'], soundPronunciation: 'Haus', definitionRu: 'Уютный дом.' }
  ],
  cv: [
    { id: 'cv_w_1', char: 'А', word: 'Апат', translationRu: 'Еда / Угощение', translationEn: 'Food / Meal', translit: 'Apat', lettersBreakdown: ['А', 'п', 'а', 'т'], distractorLetters: ['о', 'р', 'к'], soundPronunciation: 'Апат', definitionRu: 'Традиционное чувашское угощение.' },
    { id: 'cv_w_2', char: 'Ӑ', word: 'Ӑс', translationRu: 'Ум / Разум', translationEn: 'Mind / Intellect', translit: 'Ăs', lettersBreakdown: ['Ӑ', 'с'], distractorLetters: ['а', 'к', 'т'], soundPronunciation: 'Ӑс', definitionRu: 'Человеческий ум и мудрость.' },
    { id: 'cv_w_3', char: 'Ҫ', word: 'Ҫӑкӑр', translationRu: 'Хлеб', translationEn: 'Bread', translit: 'Çăkăr', lettersBreakdown: ['Ҫ', 'ӑ', 'к', 'ӑ', 'р'], distractorLetters: ['с', 'о', 'т'], soundPronunciation: 'Ҫӑкӑр', definitionRu: 'Ароматный чувашский хлеб.' },
    { id: 'cv_w_4', char: 'Ш', word: 'Шкул', translationRu: 'Школа', translationEn: 'School', translit: 'Shkul', lettersBreakdown: ['Ш', 'к', 'у', 'л'], distractorLetters: ['м', 'а', 'р'], soundPronunciation: 'Шкул', definitionRu: 'Школа для учеников.' },
    { id: 'cv_w_5', char: 'Ю', word: 'Юлташ', translationRu: 'Друг / Товарищ', translationEn: 'Friend', translit: 'Yultash', lettersBreakdown: ['Ю', 'л', 'т', 'а', 'ш'], distractorLetters: ['к', 'м', 'с'], soundPronunciation: 'Юлташ', definitionRu: 'Верный друг и товарищ.' }
  ],
  ar: [
    { id: 'ar_w_1', char: 'أ', word: 'أب', translationRu: 'Отец', translationEn: 'Father', translit: 'Ab', lettersBreakdown: ['أ', 'ب'], distractorLetters: ['ت', 'ن', 'م'], soundPronunciation: 'أب', definitionRu: 'Отец семьи.' },
    { id: 'ar_w_2', char: 'ب', word: 'بيت', translationRu: 'Дом', translationEn: 'House', translit: 'Bayt', lettersBreakdown: ['ب', 'ي', 'ت'], distractorLetters: ['ن', 'ك', 'ل'], soundPronunciation: 'بيت', definitionRu: 'Дом, жилище.' },
    { id: 'ar_w_3', char: 'ك', word: 'كتاب', translationRu: 'Книга', translationEn: 'Book', translit: 'Kitaab', lettersBreakdown: ['ك', 'ت', 'ا', 'ب'], distractorLetters: ['م', 'ر', 'س'], soundPronunciation: 'كتاب', definitionRu: 'Книга для чтения.' },
    { id: 'ar_w_4', char: 'ص', word: 'صديق', translationRu: 'Друг', translationEn: 'Friend', translit: 'Sadeeq', lettersBreakdown: ['ص', 'د', 'ي', 'ق'], distractorLetters: ['س', 'ر', 'م'], soundPronunciation: 'صديق', definitionRu: 'Верный друг.' }
  ]
};

/**
 * Extracts and prepares words for any course, falling back to alphabetData items
 */
export const getCourseLetterWords = (courseId: string): LetterWordItem[] => {
  const cleanId = (courseId || 'ru').toLowerCase();
  
  if (CURATED_COURSE_WORDS[cleanId] && CURATED_COURSE_WORDS[cleanId].length > 0) {
    return CURATED_COURSE_WORDS[cleanId];
  }

  // Extract from CIS_ALPHABET_DATA if available
  const catList = CIS_ALPHABET_DATA[cleanId];
  if (catList && catList.length > 0) {
    const extracted: LetterWordItem[] = [];
    catList.forEach((cat) => {
      cat.items.forEach((it, idx) => {
        if (typeof it !== 'string' && it.word && it.word.trim()) {
          const w = it.word.trim();
          const cleanChars = Array.from(w);
          extracted.push({
            id: `${cleanId}_gen_${idx}`,
            char: it.char,
            word: w,
            translationRu: it.translation || `${it.char} — ${w}`,
            translationEn: it.translation || `${it.char} — ${w}`,
            translit: it.translit || it.name,
            lettersBreakdown: cleanChars,
            distractorLetters: ['а', 'о', 'е', 'т', 'с'],
            soundPronunciation: w,
            definitionRu: `Слово на букву «${it.char}»`
          });
        }
      });
    });
    if (extracted.length > 0) return extracted;
  }

  // Default to Russian / English words
  return CURATED_COURSE_WORDS.ru;
};

/**
 * Generates an interactive Word Quiz from a list of letter-words
 */
export const generateWordExercise = (
  courseId: string,
  targetWord?: LetterWordItem,
  difficultyLevel: 'easy' | 'hard' = 'easy'
): WordQuizExercise => {
  const words = getCourseLetterWords(courseId);
  const candidatePool = difficultyLevel === 'hard'
    ? words.filter(w => w.word.length >= 5)
    : words.filter(w => w.word.length <= 6);
  const effectivePool = candidatePool.length > 0 ? candidatePool : words;
  const selected = targetWord || effectivePool[Math.floor(Math.random() * effectivePool.length)];
  
  // Choose random quiz type: assemble_word, listen_word, word_meaning
  const types: WordQuizExercise['type'][] = ['assemble_word', 'listen_word', 'word_meaning'];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'assemble_word') {
    const letters = [...selected.lettersBreakdown];
    const extraCount = difficultyLevel === 'hard' ? 5 : 2;
    const baseDistractors = selected.distractorLetters || ['о', 'а', 'т', 'е', 'с'];
    const fallbackPool = ['а', 'о', 'е', 'и', 'к', 'м', 'н', 'р', 'с', 'т', 'e', 'a', 'o', 's', 'n', 'r'];
    const combinedDistractors = [...baseDistractors, ...fallbackPool].slice(0, extraCount);
    const pool = [...letters, ...combinedDistractors]
      .map(letter => ({ id: crypto.randomUUID(), letter }))
      .sort(() => Math.random() - 0.5);

    return {
      id: crypto.randomUUID(),
      type: 'assemble_word',
      char: selected.char,
      targetWord: selected,
      promptRu: difficultyLevel === 'hard'
        ? `🔥 Сложный уровень: соберите слово «${selected.word}» (перевод: ${selected.translationRu}):`
        : `🌱 Лёгкий уровень: соберите слово «${selected.word}» по буквам:`,
      promptEn: difficultyLevel === 'hard'
        ? `🔥 Hard level: assemble the word "${selected.word}":`
        : `🌱 Easy level: assemble the word "${selected.word}" from letters:`,
      scrambledLetters: pool
    };
  }

  // Multiple choice options (listen_word or word_meaning)
  const distractorCount = difficultyLevel === 'hard' ? 4 : 2;
  const otherWords = words.filter(w => w.word !== selected.word);
  const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, distractorCount);
  const optionsPool = [selected, ...distractors].sort(() => Math.random() - 0.5);

  return {
    id: crypto.randomUUID(),
    type,
    char: selected.char,
    targetWord: selected,
    promptRu: type === 'listen_word'
      ? (difficultyLevel === 'hard'
          ? '🔥 Сложный уровень: послушайте и выберите точное слово:'
          : '🌱 Лёгкий уровень: послушайте произношение и выберите слово:')
      : `Что означает слово «${selected.word}»?`,
    promptEn: type === 'listen_word'
      ? 'Listen to the audio and select the matching word:'
      : `What does the word "${selected.word}" mean?`,
    options: optionsPool.map(w => ({
      id: w.id,
      text: type === 'word_meaning' ? w.translationRu : w.word,
      sub: difficultyLevel === 'hard' ? undefined : (type === 'word_meaning' ? w.word : w.translationRu),
      isCorrect: w.word === selected.word
    }))
  };
};

/**
 * Klingon Dictionary & pIqaD Script Service
 * Based on PanderMusubi/klingon (tlh / tlh_Latn hunspell & nuspell dictionaries)
 * and hol.kag.org canonical tlhIngan Hol lexicon & sentence player.
 */

export const PIQAD_TRANSLITERATION_MAP: Record<string, string> = {
  tlh: '\uF8E4',
  ch: '\uF8D2',
  gh: '\uF8D5',
  ng: '\uF8DC',
  a: '\uF8D0',
  b: '\uF8D1',
  D: '\uF8D3',
  e: '\uF8D4',
  H: '\uF8D6',
  I: '\uF8D7',
  j: '\uF8D8',
  l: '\uF8D9',
  m: '\uF8DA',
  n: '\uF8DB',
  o: '\uF8DD',
  p: '\uF8DE',
  q: '\uF8DF',
  Q: '\uF8E0',
  r: '\uF8E1',
  S: '\uF8E2',
  t: '\uF8E3',
  u: '\uF8E5',
  v: '\uF8E6',
  w: '\uF8E7',
  y: '\uF8E8',
  "'": '\uF8E9',
  '’': '\uF8E9',
  '0': '\uF8F0',
  '1': '\uF8F1',
  '2': '\uF8F2',
  '3': '\uF8F3',
  '4': '\uF8F4',
  '5': '\uF8F5',
  '6': '\uF8F6',
  '7': '\uF8F7',
  '8': '\uF8F8',
  '9': '\uF8F9',
  ',': '\uF8FD',
  '.': '\uF8FE',
};

const REVERSE_PIQAD_MAP: Record<string, string> = {
  '\uF8E4': 'tlh',
  '\uF8D2': 'ch',
  '\uF8D5': 'gh',
  '\uF8DC': 'ng',
  '\uF8D0': 'a',
  '\uF8D1': 'b',
  '\uF8D3': 'D',
  '\uF8D4': 'e',
  '\uF8D6': 'H',
  '\uF8D7': 'I',
  '\uF8D8': 'j',
  '\uF8D9': 'l',
  '\uF8DA': 'm',
  '\uF8DB': 'n',
  '\uF8DD': 'o',
  '\uF8DE': 'p',
  '\uF8DF': 'q',
  '\uF8E0': 'Q',
  '\uF8E1': 'r',
  '\uF8E2': 'S',
  '\uF8E3': 't',
  '\uF8E5': 'u',
  '\uF8E6': 'v',
  '\uF8E7': 'w',
  '\uF8E8': 'y',
  '\uF8E9': '’',
  '\uF8F0': '0',
  '\uF8F1': '1',
  '\uF8F2': '2',
  '\uF8F3': '3',
  '\uF8F4': '4',
  '\uF8F5': '5',
  '\uF8F6': '6',
  '\uF8F7': '7',
  '\uF8F8': '8',
  '\uF8F9': '9',
  '\uF8FD': ',',
  '\uF8FE': '.',
};

const ORDERED_TOKENS = ['tlh', 'ch', 'gh', 'ng'];

/**
 * Converts tlh_Latn (Klingon Latin orthography) into canonical ConScript pIqaD Unicode (U+F8D0-U+F8FF),
 * matching PanderMusubi/klingon (hunspell -d tlh / /usr/share/dict/klingon).
 */
export const tlhToPIqaD = (latinText: string): string => {
  if (!latinText) return '';
  let result = '';
  let i = 0;
  while (i < latinText.length) {
    let matched = false;
    for (const multi of ORDERED_TOKENS) {
      if (latinText.slice(i, i + multi.length) === multi) {
        result += PIQAD_TRANSLITERATION_MAP[multi];
        i += multi.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = latinText[i];
    if (PIQAD_TRANSLITERATION_MAP[ch]) {
      result += PIQAD_TRANSLITERATION_MAP[ch];
    } else if (PIQAD_TRANSLITERATION_MAP[ch.toLowerCase()] && !['d', 'h', 'i', 'q', 's'].includes(ch.toLowerCase())) {
      result += PIQAD_TRANSLITERATION_MAP[ch.toLowerCase()];
    } else {
      result += ch;
    }
    i += 1;
  }
  return result;
};

/**
 * Converts canonical pIqaD Unicode (U+F8D0-U+F8FF) back to tlh_Latn.
 */
export const pIqaDToTlh = (pIqaDText: string): string => {
  if (!pIqaDText) return '';
  let result = '';
  for (const ch of Array.from(pIqaDText)) {
    result += REVERSE_PIQAD_MAP[ch] ?? ch;
  }
  return result;
};

export const isPIqaDText = (text: string): boolean => /[\uF8D0-\uF8FF]/.test(text || '');

/**
 * Splits a Klingon word into canonical Klingon alphabet phonemes (preserving tlh, ch, gh, ng).
 */
export const splitKlingonPhonemes = (word: string): string[] => {
  const clean = word.trim();
  const tokens: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let matched = false;
    for (const multi of ORDERED_TOKENS) {
      if (clean.slice(i, i + multi.length) === multi) {
        tokens.push(multi);
        i += multi.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = clean[i];
    if (ch !== ' ') tokens.push(ch);
    i += 1;
  }
  return tokens;
};

export interface KlingonLexiconEntry {
  tlhLatn: string;
  pIqaD: string;
  ipa: string;
  ru: string;
  en: string;
  pos: 'noun' | 'verb' | 'phrase' | 'number' | 'pronoun';
}

export const KLINGON_LEXICON: KlingonLexiconEntry[] = [
  { tlhLatn: 'nuqneH', pIqaD: tlhToPIqaD('nuqneH'), ipa: '[nuqʰ.nɛx]', ru: 'Привет! Что тебе нужно?', en: 'Hello! What do you want?', pos: 'phrase' },
  { tlhLatn: 'Qapla’', pIqaD: tlhToPIqaD('Qapla’'), ipa: '[q͡χɑpʰ.lɑʔ]', ru: 'Успех! Удачи!', en: 'Success!', pos: 'phrase' },
  { tlhLatn: 'tlhIngan', pIqaD: tlhToPIqaD('tlhIngan'), ipa: '[t͡ɬʰɪ.ŋɑn]', ru: 'Клингон', en: 'Klingon', pos: 'noun' },
  { tlhLatn: 'tlhIngan Hol', pIqaD: tlhToPIqaD('tlhIngan Hol'), ipa: '[t͡ɬʰɪ.ŋɑn xol]', ru: 'Клингонский язык', en: 'Klingon language', pos: 'phrase' },
  { tlhLatn: 'batlh', pIqaD: tlhToPIqaD('batlh'), ipa: '[bɑt͡ɬʰ]', ru: 'Честь / с честью', en: 'Honor', pos: 'noun' },
  { tlhLatn: 'Duj', pIqaD: tlhToPIqaD('Duj'), ipa: '[ɖud͡ʒ]', ru: 'Корабль / судно', en: 'Ship / vessel', pos: 'noun' },
  { tlhLatn: 'HoD', pIqaD: tlhToPIqaD('HoD'), ipa: '[xoɖ]', ru: 'Капитан', en: 'Captain', pos: 'noun' },
  { tlhLatn: 'SuvwI’', pIqaD: tlhToPIqaD('SuvwI’'), ipa: '[ʂuv.wɪʔ]', ru: 'Воин / боец', en: 'Warrior', pos: 'noun' },
  { tlhLatn: 'HIja’', pIqaD: tlhToPIqaD('HIja’'), ipa: '[xɪ.d͡ʒɑʔ]', ru: 'Да', en: 'Yes', pos: 'phrase' },
  { tlhLatn: 'ghobe’', pIqaD: tlhToPIqaD('ghobe’'), ipa: '[ɣo.bɛʔ]', ru: 'Нет', en: 'No', pos: 'phrase' },
  { tlhLatn: 'qatlho’', pIqaD: tlhToPIqaD('qatlho’'), ipa: '[qʰɑ.t͡ɬʰoʔ]', ru: 'Благодарю тебя', en: 'Thank you', pos: 'phrase' },
  { tlhLatn: 'majQa’', pIqaD: tlhToPIqaD('majQa’'), ipa: '[mɑd͡ʒ.q͡χɑʔ]', ru: 'Отлично! Молодец!', en: 'Well done! Good!', pos: 'phrase' },
  { tlhLatn: 'jIyaj', pIqaD: tlhToPIqaD('jIyaj'), ipa: '[d͡ʒɪ.jɑd͡ʒ]', ru: 'Я понимаю', en: 'I understand', pos: 'verb' },
  { tlhLatn: 'jIyajbe’', pIqaD: tlhToPIqaD('jIyajbe’'), ipa: '[d͡ʒɪ.jɑd͡ʒ.bɛʔ]', ru: 'Я не понимаю', en: 'I do not understand', pos: 'verb' },
  { tlhLatn: 'juH', pIqaD: tlhToPIqaD('juH'), ipa: '[d͡ʒux]', ru: 'Дом / родина', en: 'Home', pos: 'noun' },
  { tlhLatn: 'bIQ', pIqaD: tlhToPIqaD('bIQ'), ipa: '[bɪq͡χ]', ru: 'Вода', en: 'Water', pos: 'noun' },
  { tlhLatn: 'Soj', pIqaD: tlhToPIqaD('Soj'), ipa: '[ʂod͡ʒ]', ru: 'Еда / пища', en: 'Food', pos: 'noun' },
  { tlhLatn: 'paq', pIqaD: tlhToPIqaD('paq'), ipa: '[pʰɑqʰ]', ru: 'Книга', en: 'Book', pos: 'noun' },
  { tlhLatn: 'logh', pIqaD: tlhToPIqaD('logh'), ipa: '[loɣ]', ru: 'Космос', en: 'Space (outer)', pos: 'noun' },
  { tlhLatn: 'targh', pIqaD: tlhToPIqaD('targh'), ipa: '[tʰɑrɣ]', ru: 'Тарг (клингонский зверь)', en: 'Targ (Klingon beast)', pos: 'noun' },
  { tlhLatn: 'jaj', pIqaD: tlhToPIqaD('jaj'), ipa: '[d͡ʒɑd͡ʒ]', ru: 'День', en: 'Day', pos: 'noun' },
  { tlhLatn: 'ram', pIqaD: tlhToPIqaD('ram'), ipa: '[rɑm]', ru: 'Ночь', en: 'Night', pos: 'noun' },
  { tlhLatn: 'ghom', pIqaD: tlhToPIqaD('ghom'), ipa: '[ɣom]', ru: 'Группа / встречаться', en: 'Group / meet', pos: 'noun' },
  { tlhLatn: 'qaH', pIqaD: tlhToPIqaD('qaH'), ipa: '[qʰɑx]', ru: 'Сэр', en: 'Sir', pos: 'noun' },
  { tlhLatn: 'SoH', pIqaD: tlhToPIqaD('SoH'), ipa: '[ʂox]', ru: 'Ты', en: 'You', pos: 'pronoun' },
  { tlhLatn: 'jIH', pIqaD: tlhToPIqaD('jIH'), ipa: '[d͡ʒɪx]', ru: 'Я', en: 'I / me', pos: 'pronoun' },
  { tlhLatn: 'maH', pIqaD: tlhToPIqaD('maH'), ipa: '[mɑx]', ru: 'Мы', en: 'We', pos: 'pronoun' },
  { tlhLatn: 'wa’', pIqaD: tlhToPIqaD('wa’'), ipa: '[wɑʔ]', ru: 'Один (1)', en: 'One (1)', pos: 'number' },
  { tlhLatn: 'cha’', pIqaD: tlhToPIqaD('cha’'), ipa: '[t͡ʃɑʔ]', ru: 'Два (2)', en: 'Two (2)', pos: 'number' },
  { tlhLatn: 'wej', pIqaD: tlhToPIqaD('wej'), ipa: '[wɛd͡ʒ]', ru: 'Три (3)', en: 'Three (3)', pos: 'number' },
  { tlhLatn: 'ngoch', pIqaD: tlhToPIqaD('ngoch'), ipa: '[ŋot͡ʃ]', ru: 'Решение / политика', en: 'Policy / decision', pos: 'noun' },
  { tlhLatn: 'chu’', pIqaD: tlhToPIqaD('chu’'), ipa: '[t͡ʃuʔ]', ru: 'Новый', en: 'New', pos: 'verb' },
  { tlhLatn: 'yaj', pIqaD: tlhToPIqaD('yaj'), ipa: '[jɑd͡ʒ]', ru: 'Понимать', en: 'Understand', pos: 'verb' },
  { tlhLatn: 'nom', pIqaD: tlhToPIqaD('nom'), ipa: '[nom]', ru: 'Быстро', en: 'Fast / quickly', pos: 'verb' },
  { tlhLatn: 'qIt', pIqaD: tlhToPIqaD('qIt'), ipa: '[qʰɪtʰ]', ru: 'Быть возможным', en: 'Be possible', pos: 'verb' },
  { tlhLatn: 'qet', pIqaD: tlhToPIqaD('qet'), ipa: '[qʰɛtʰ]', ru: 'Бежать', en: 'Run', pos: 'verb' },
  { tlhLatn: 'choH', pIqaD: tlhToPIqaD('choH'), ipa: '[t͡ʃox]', ru: 'Менять / изменение', en: 'Change', pos: 'verb' },
  { tlhLatn: 'veS', pIqaD: tlhToPIqaD('veS'), ipa: '[vɛʂ]', ru: 'Война', en: 'War', pos: 'noun' },
];

export interface KlingonSentenceItem {
  tlhLatn: string;
  pIqaD: string;
  ru: string;
  en: string;
  bankRu: string[];
  bankEn: string[];
  level: 'easy' | 'hard';
}

export const KLINGON_SENTENCES: KlingonSentenceItem[] = [
  {
    tlhLatn: 'nuqneH',
    pIqaD: tlhToPIqaD('nuqneH'),
    ru: 'Привет! Что тебе нужно?',
    en: 'Hello! What do you want?',
    bankRu: ['Привет!', 'Что', 'тебе', 'нужно?', 'Спасибо', 'До свидания'],
    bankEn: ['Hello!', 'What', 'do', 'you', 'want?', 'Thanks'],
    level: 'easy'
  },
  {
    tlhLatn: 'tlhIngan Hol Dajatlh’a’?',
    pIqaD: tlhToPIqaD('tlhIngan Hol Dajatlh’a’?'),
    ru: 'Ты говоришь на клингонском языке?',
    en: 'Do you speak Klingon?',
    bankRu: ['Ты', 'говоришь', 'на', 'клингонском', 'языке?', 'английском', 'мы'],
    bankEn: ['Do', 'you', 'speak', 'Klingon?', 'understand', 'read'],
    level: 'easy'
  },
  {
    tlhLatn: 'HIja’, tlhIngan Hol vIjatlh',
    pIqaD: tlhToPIqaD('HIja’, tlhIngan Hol vIjatlh'),
    ru: 'Да, я говорю по-клингонски',
    en: 'Yes, I speak Klingon',
    bankRu: ['Да,', 'я', 'говорю', 'по-клингонски', 'Нет', 'пишу'],
    bankEn: ['Yes,', 'I', 'speak', 'Klingon', 'No', 'write'],
    level: 'easy'
  },
  {
    tlhLatn: 'Qapla’! majQa’!',
    pIqaD: tlhToPIqaD('Qapla’! majQa’!'),
    ru: 'Успех! Отлично!',
    en: 'Success! Well done!',
    bankRu: ['Успех!', 'Отлично!', 'Плохо', 'До встречи'],
    bankEn: ['Success!', 'Well', 'done!', 'Goodbye'],
    level: 'easy'
  },
  {
    tlhLatn: 'qatlho’, HoD',
    pIqaD: tlhToPIqaD('qatlho’, HoD'),
    ru: 'Благодарю тебя, капитан',
    en: 'Thank you, captain',
    bankRu: ['Благодарю', 'тебя,', 'капитан', 'воин', 'привет'],
    bankEn: ['Thank', 'you,', 'captain', 'warrior', 'sir'],
    level: 'easy'
  },
  {
    tlhLatn: 'jIyajbe’, yIja’qa’',
    pIqaD: tlhToPIqaD('jIyajbe’, yIja’qa’'),
    ru: 'Я не понимаю, скажи ещё раз',
    en: 'I do not understand, say it again',
    bankRu: ['Я', 'не', 'понимаю,', 'скажи', 'ещё', 'раз', 'знаю'],
    bankEn: ['I', 'do', 'not', 'understand,', 'say', 'it', 'again'],
    level: 'hard'
  },
  {
    tlhLatn: 'loghDaq leng DujwIj',
    pIqaD: tlhToPIqaD('loghDaq leng DujwIj'),
    ru: 'Мой корабль путешествует в космосе',
    en: 'My ship travels in space',
    bankRu: ['Мой', 'корабль', 'путешествует', 'в', 'космосе', 'доме', 'летит'],
    bankEn: ['My', 'ship', 'travels', 'in', 'space', 'home'],
    level: 'hard'
  },
  {
    tlhLatn: 'bIQ vItlhutlh ’ej Soj vISop',
    pIqaD: tlhToPIqaD('bIQ vItlhutlh ’ej Soj vISop'),
    ru: 'Я пью воду и ем еду',
    en: 'I drink water and eat food',
    bankRu: ['Я', 'пью', 'воду', 'и', 'ем', 'еду', 'чай'],
    bankEn: ['I', 'drink', 'water', 'and', 'eat', 'food'],
    level: 'hard'
  },
  {
    tlhLatn: 'Heghlu’meH QaQ jajvam',
    pIqaD: tlhToPIqaD('Heghlu’meH QaQ jajvam'),
    ru: 'Сегодня хороший день для подвига',
    en: 'Today is a good day to die',
    bankRu: ['Сегодня', 'хороший', 'день', 'для', 'подвига', 'завтра', 'ночь'],
    bankEn: ['Today', 'is', 'a', 'good', 'day', 'to', 'die'],
    level: 'hard'
  },
  {
    tlhLatn: 'batlh bIHeghjaj, SuvwI’',
    pIqaD: tlhToPIqaD('batlh bIHeghjaj, SuvwI’'),
    ru: 'Воин, действуй с честью',
    en: 'Warrior, act with honor',
    bankRu: ['Воин,', 'действуй', 'с', 'честью', 'капитан', 'страхом'],
    bankEn: ['Warrior,', 'act', 'with', 'honor', 'captain'],
    level: 'hard'
  }
];

const KNOWN_WORDS_SET = new Set(
  KLINGON_LEXICON.flatMap(entry => [
    entry.tlhLatn.replace(/[’']/g, "'").toLowerCase(),
    entry.pIqaD,
  ])
);

/**
 * Hunspell/Nuspell-compatible client-side Klingon word validator (tlh_Latn / tlh pIqaD)
 */
export const validateKlingonWord = (word: string, mode: 'tlh_Latn' | 'tlh' = 'tlh_Latn'): boolean => {
  const clean = word.trim();
  if (!clean) return false;
  if (mode === 'tlh') {
    if (KNOWN_WORDS_SET.has(clean)) return true;
    return /^[\uF8D0-\uF8EA\uF8F0-\uF8F9]+$/.test(clean);
  }
  const normalized = clean.replace(/’/g, "'").toLowerCase();
  if (KNOWN_WORDS_SET.has(normalized)) return true;
  // Valid Klingon syllable check (C V (C) with legal consonants)
  return /^(?:tlh|ch|gh|ng|[abDeHIjlmnopqQrStuvwy'])+$/i.test(normalized);
};

/**
 * Service for Dual Arabic Numerals (0 - 99):
 * Western digits on left (e.g. 25) • Eastern Arabic digits on right (e.g. ٢٥)
 * Arabic spelling, transliteration, and Russian translations for all numbers 0-99.
 */

export interface ArabicNumberItem {
  val: number;
  western: string; // "25"
  eastern: string; // "٢٥"
  arabic: string;  // "خَمْسَة وَعِشْرُونَ"
  translit: string;// "Khamsa wa 'Ishrun"
  ru: string;      // "Двадцать пять"
}

const EASTERN_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toEasternArabicStr = (num: number): string => {
  return String(num).split('').map(d => EASTERN_DIGITS[parseInt(d, 10)] || d).join('');
};

const UNITS_AR: { [key: number]: { ar: string; tr: string; ru: string } } = {
  0: { ar: 'صِفْر', tr: 'Sifr', ru: 'Ноль' },
  1: { ar: 'وَاحِد', tr: 'Wahid', ru: 'Один' },
  2: { ar: 'اِثْنَان', tr: 'Ithnan', ru: 'Два' },
  3: { ar: 'ثَلَاثَة', tr: 'Thalatha', ru: 'Три' },
  4: { ar: 'أَرْبَعَة', tr: 'Arba\'a', ru: 'Четыре' },
  5: { ar: 'خَمْسَة', tr: 'Khamsa', ru: 'Пять' },
  6: { ar: 'سِتَّة', tr: 'Sitta', ru: 'Шесть' },
  7: { ar: 'سَبْعَة', tr: 'Sab\'a', ru: 'Семь' },
  8: { ar: 'ثَمَانِيَة', tr: 'Thamaniya', ru: 'Восемь' },
  9: { ar: 'تِسْعَة', tr: 'Tis\'a', ru: 'Девять' },
};

const TEENS_AR: { [key: number]: { ar: string; tr: string; ru: string } } = {
  10: { ar: 'عَشَرَة', tr: '\'Ashara', ru: 'Десять' },
  11: { ar: 'أَحَدَ عَشَر', tr: 'Ahada \'Ashar', ru: 'Одиннадцать' },
  12: { ar: 'اِثْنَا عَشَر', tr: 'Ithna \'Ashar', ru: 'Двенадцать' },
  13: { ar: 'ثَلَاثَةَ عَشَر', tr: 'Thalathata \'Ashar', ru: 'Тринадцать' },
  14: { ar: 'أَرْبَعَةَ عَشَر', tr: 'Arba\'ata \'Ashar', ru: 'Четырнадцать' },
  15: { ar: 'خَمْسَةَ عَشَر', tr: 'Khamsata \'Ashar', ru: 'Пятнадцать' },
  16: { ar: 'سِتَّةَ عَشَر', tr: 'Sittata \'Ashar', ru: 'Шестнадцать' },
  17: { ar: 'سَبْعَةَ عَشَر', tr: 'Sab\'ata \'Ashar', ru: 'Семнадцать' },
  18: { ar: 'ثَمَانِيَةَ عَشَر', tr: 'Thamaniyata \'Ashar', ru: 'Восемнадцать' },
  19: { ar: 'تِسْعَةَ عَشَر', tr: 'Tis\'ata \'Ashar', ru: 'Девятнадцать' },
};

const DECADES_AR: { [key: number]: { ar: string; tr: string; ru: string } } = {
  20: { ar: 'عِشْرُونَ', tr: '\'Ishrun', ru: 'Двадцать' },
  30: { ar: 'ثَلَاثُونَ', tr: 'Thalathun', ru: 'Тридцать' },
  40: { ar: 'أَرْبَعُونَ', tr: 'Arba\'un', ru: 'Сорок' },
  50: { ar: 'خَمْسُونَ', tr: 'Khamsun', ru: 'Пятьдесят' },
  60: { ar: 'سِتُّونَ', tr: 'Sittun', ru: 'Шестьдесят' },
  70: { ar: 'سَبْعُونَ', tr: 'Sab\'un', ru: 'Семьдесят' },
  80: { ar: 'ثَمَانُونَ', tr: 'Thamanun', ru: 'Восемьдесят' },
  90: { ar: 'تِسْعُونَ', tr: 'Tis\'un', ru: 'Девяносто' },
};

const RU_UNITS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

export const getArabicNumberInfo = (n: number): ArabicNumberItem => {
  const val = Math.max(0, Math.min(99, Math.floor(n)));
  const western = String(val);
  const eastern = toEasternArabicStr(val);

  if (val <= 9) {
    const u = UNITS_AR[val];
    return { val, western, eastern, arabic: u.ar, translit: u.tr, ru: u.ru };
  }

  if (val >= 10 && val <= 19) {
    const t = TEENS_AR[val];
    return { val, western, eastern, arabic: t.ar, translit: t.tr, ru: t.ru };
  }

  const tens = Math.floor(val / 10) * 10;
  const units = val % 10;

  if (units === 0) {
    const d = DECADES_AR[tens];
    return { val, western, eastern, arabic: d.ar, translit: d.tr, ru: d.ru };
  }

  const uInfo = UNITS_AR[units];
  const dInfo = DECADES_AR[tens];

  const arabic = `${uInfo.ar} وَ${dInfo.ar}`;
  const translit = `${uInfo.tr} wa ${dInfo.tr}`;
  const ruTens = dInfo.ru.toLowerCase();
  const ruUnit = RU_UNITS[units];
  const ru = `${dInfo.ru} ${ruUnit}`;

  return { val, western, eastern, arabic, translit, ru };
};

export const ALL_ARABIC_NUMBERS_0_99: ArabicNumberItem[] = Array.from({ length: 100 }, (_, i) => getArabicNumberInfo(i));

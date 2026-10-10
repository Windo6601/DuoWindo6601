export interface CountryItem {
  code: string;
  name: string; // English
  flagCode: string;
  translations: Record<string, string>;
}

export const ALL_COUNTRIES: CountryItem[] = [
  {
    code: 'ru',
    name: 'Russia',
    flagCode: 'ru',
    translations: {
      ru: 'Россия',
      en: 'Russia',
      de: 'Russland',
      fr: 'Russie',
      es: 'Rusia',
      ja: 'ロシア',
      zh: '俄罗斯',
      ar: 'روسيا'
    }
  },
  {
    code: 'us',
    name: 'United States',
    flagCode: 'us',
    translations: {
      ru: 'США',
      en: 'United States',
      de: 'Vereinigte Staaten',
      fr: 'États-Unis',
      es: 'Estados Unidos',
      ja: 'アメリカ合衆国',
      zh: '美国',
      ar: 'الولايات المتحدة'
    }
  },
  {
    code: 'de',
    name: 'Germany',
    flagCode: 'de',
    translations: {
      ru: 'Германия',
      en: 'Germany',
      de: 'Deutschland',
      fr: 'Allemagne',
      es: 'Alemania',
      ja: 'ドイツ',
      zh: '德国',
      ar: 'ألمانيا'
    }
  },
  {
    code: 'fr',
    name: 'France',
    flagCode: 'fr',
    translations: {
      ru: 'Франция',
      en: 'France',
      de: 'Frankreich',
      fr: 'France',
      es: 'Francia',
      ja: 'フランス',
      zh: '法国',
      ar: 'فرنسا'
    }
  },
  {
    code: 'es',
    name: 'Spain',
    flagCode: 'es',
    translations: {
      ru: 'Испания',
      en: 'Spain',
      de: 'Spanien',
      fr: 'Espagne',
      es: 'España',
      ja: 'スペイン',
      zh: '西班牙',
      ar: 'إسبانيا'
    }
  },
  {
    code: 'sa',
    name: 'Saudi Arabia',
    flagCode: 'sa',
    translations: {
      ru: 'Саудовская Аравия',
      en: 'Saudi Arabia',
      de: 'Saudi-Arabien',
      fr: 'Arabie saoudite',
      es: 'Arabia Saudita',
      ja: 'サウジアラビア',
      zh: '沙特阿拉伯',
      ar: 'المملكة العربية السعودية'
    }
  },
  {
    code: 'cn',
    name: 'China',
    flagCode: 'cn',
    translations: {
      ru: 'Китай',
      en: 'China',
      de: 'China',
      fr: 'Chine',
      es: 'China',
      ja: '中国',
      zh: '中国',
      ar: 'الصين'
    }
  },
  {
    code: 'jp',
    name: 'Japan',
    flagCode: 'jp',
    translations: {
      ru: 'Япония',
      en: 'Japan',
      de: 'Japan',
      fr: 'Japon',
      es: 'Japón',
      ja: '日本',
      zh: '日本',
      ar: 'اليابان'
    }
  },
  {
    code: 'gb',
    name: 'United Kingdom',
    flagCode: 'gb',
    translations: {
      ru: 'Великобритания',
      en: 'United Kingdom',
      de: 'Vereinigtes Königreich',
      fr: 'Royaume-Uni',
      es: 'Reino Unido',
      ja: 'イギリス',
      zh: '英国',
      ar: 'المملكة المتحدة'
    }
  },
  {
    code: 'kz',
    name: 'Kazakhstan',
    flagCode: 'kz',
    translations: {
      ru: 'Казахстан',
      en: 'Kazakhstan',
      de: 'Kasachstan',
      fr: 'Kazakhstan',
      es: 'Kazajistán',
      ja: 'カザフスタン',
      zh: '哈萨克斯坦',
      ar: 'كازاخستان'
    }
  },
  {
    code: 'by',
    name: 'Belarus',
    flagCode: 'by',
    translations: {
      ru: 'Беларусь',
      en: 'Belarus',
      de: 'Belarus',
      fr: 'Biélorussie',
      es: 'Bielorrusia',
      ja: 'ベラルーシ',
      zh: '白俄罗斯',
      ar: 'بيلاروسيا'
    }
  },
  {
    code: 'uz',
    name: 'Uzbekistan',
    flagCode: 'uz',
    translations: {
      ru: 'Узбекистан',
      en: 'Uzbekistan',
      de: 'Usbekistan',
      fr: 'Ouzbékistan',
      es: 'Uzbekistán',
      ja: 'ウズベキスタン',
      zh: '乌兹别克斯坦',
      ar: 'أوزبكستان'
    }
  },
  {
    code: 'it',
    name: 'Italy',
    flagCode: 'it',
    translations: {
      ru: 'Италия',
      en: 'Italy',
      de: 'Italien',
      fr: 'Italie',
      es: 'Italia',
      ja: 'イタリア',
      zh: '意大利',
      ar: 'إيطاليا'
    }
  },
  {
    code: 'br',
    name: 'Brazil',
    flagCode: 'br',
    translations: {
      ru: 'Бразилия',
      en: 'Brazil',
      de: 'Brasilien',
      fr: 'Brésil',
      es: 'Brasil',
      ja: 'ブラジル',
      zh: '巴西',
      ar: 'البرازيل'
    }
  },
  {
    code: 'tr',
    name: 'Turkey',
    flagCode: 'tr',
    translations: {
      ru: 'Турция',
      en: 'Turkey',
      de: 'Türkei',
      fr: 'Turquie',
      es: 'Turquía',
      ja: 'トルコ',
      zh: '土耳其',
      ar: 'تركيا'
    }
  },
  {
    code: 'kr',
    name: 'South Korea',
    flagCode: 'kr',
    translations: {
      ru: 'Южная Корея',
      en: 'South Korea',
      de: 'Südkorea',
      fr: 'Corée du Sud',
      es: 'Corea del Sur',
      ja: '韓国',
      zh: '韩国',
      ar: 'كوريا الجنوبية'
    }
  },
  {
    code: 'in',
    name: 'India',
    flagCode: 'in',
    translations: {
      ru: 'Индия',
      en: 'India',
      de: 'Indien',
      fr: 'Inde',
      es: 'India',
      ja: 'インド',
      zh: '印度',
      ar: 'الهند'
    }
  },
  {
    code: 'ca',
    name: 'Canada',
    flagCode: 'ca',
    translations: {
      ru: 'Канада',
      en: 'Canada',
      de: 'Kanada',
      fr: 'Canada',
      es: 'Canadá',
      ja: 'カナダ',
      zh: '加拿大',
      ar: 'كندا'
    }
  },
  {
    code: 'mx',
    name: 'Mexico',
    flagCode: 'mx',
    translations: {
      ru: 'Мексика',
      en: 'Mexico',
      de: 'Mexiko',
      fr: 'Mexique',
      es: 'México',
      ja: 'メキシコ',
      zh: '墨西哥',
      ar: 'المكسيك'
    }
  },
  {
    code: 'eg',
    name: 'Egypt',
    flagCode: 'eg',
    translations: {
      ru: 'Египет',
      en: 'Egypt',
      de: 'Ägypten',
      fr: 'Égypte',
      es: 'Egipto',
      ja: 'エジプト',
      zh: '埃及',
      ar: 'مصر'
    }
  },
  {
    code: 'am',
    name: 'Armenia',
    flagCode: 'am',
    translations: {
      ru: 'Армения',
      en: 'Armenia',
      de: 'Armenien',
      fr: 'Arménie',
      es: 'Armenia',
      ja: 'アルメニア',
      zh: '亚美尼亚',
      ar: 'أرمينيا'
    }
  },
  {
    code: 'ge',
    name: 'Georgia',
    flagCode: 'ge',
    translations: {
      ru: 'Грузия',
      en: 'Georgia',
      de: 'Georgien',
      fr: 'Géorgie',
      es: 'Georgia',
      ja: 'ジョージア',
      zh: '格鲁吉亚',
      ar: 'جورجيا'
    }
  },
  {
    code: 'az',
    name: 'Azerbaijan',
    flagCode: 'az',
    translations: {
      ru: 'Азербайджан',
      en: 'Azerbaijan',
      de: 'Aserbaidschan',
      fr: 'Azerbaïdjan',
      es: 'Azerbaiyán',
      ja: 'アゼルバイジャン',
      zh: '阿塞拜疆',
      ar: 'أذربيجان'
    }
  },
  {
    code: 'tj',
    name: 'Tajikistan',
    flagCode: 'tj',
    translations: {
      ru: 'Таджикистан',
      en: 'Tajikistan',
      de: 'Tadschikistan',
      fr: 'Tadjikistan',
      es: 'Tayikistán',
      ja: 'タジキスタン',
      zh: '塔吉克斯坦',
      ar: 'طاجيكستان'
    }
  },
  {
    code: 'kg',
    name: 'Kyrgyzstan',
    flagCode: 'kg',
    translations: {
      ru: 'Кыргызстан',
      en: 'Kyrgyzstan',
      de: 'Kirgisistan',
      fr: 'Kirghizistan',
      es: 'Kirguistán',
      ja: 'キルギス',
      zh: '吉尔吉斯斯坦',
      ar: 'قيرغيزستان'
    }
  },
  {
    code: 'tm',
    name: 'Turkmenistan',
    flagCode: 'tm',
    translations: {
      ru: 'Туркменистан',
      en: 'Turkmenistan',
      de: 'Turkmenistan',
      fr: 'Turkménistan',
      es: 'Turkmenistán',
      ja: 'トルクメニスタン',
      zh: '土库曼斯坦',
      ar: 'تركمانستان'
    }
  },
  {
    code: 'pl',
    name: 'Poland',
    flagCode: 'pl',
    translations: {
      ru: 'Польша',
      en: 'Poland',
      de: 'Polen',
      fr: 'Pologne',
      es: 'Polonia',
      ja: 'ポーランド',
      zh: '波兰',
      ar: 'بولندا'
    }
  },
  {
    code: 'id',
    name: 'Indonesia',
    flagCode: 'id',
    translations: {
      ru: 'Индонезия',
      en: 'Indonesia',
      de: 'Indonesien',
      fr: 'Indonésie',
      es: 'Indonesia',
      ja: 'インドネシア',
      zh: '印度尼西亚',
      ar: 'إندونيسيا'
    }
  },
  {
    code: 'vn',
    name: 'Vietnam',
    flagCode: 'vn',
    translations: {
      ru: 'Вьетнам',
      en: 'Vietnam',
      de: 'Vietnam',
      fr: 'Vietnam',
      es: 'Vietnam',
      ja: 'ベトナム',
      zh: '越南',
      ar: 'فيتنام'
    }
  }
];

/**
 * Returns localized name for a country code or country name.
 */
export function getLocalizedCountryName(codeOrName: string, targetLang: string = 'ru'): string {
  if (!codeOrName) return '';
  const normalized = codeOrName.toLowerCase().trim();
  const found = ALL_COUNTRIES.find(
    c => c.code.toLowerCase() === normalized || 
         c.name.toLowerCase() === normalized || 
         (c.translations['ru'] && c.translations['ru'].toLowerCase() === normalized)
  );

  if (found) {
    return found.translations[targetLang] || found.translations['en'] || found.name;
  }
  return codeOrName;
}

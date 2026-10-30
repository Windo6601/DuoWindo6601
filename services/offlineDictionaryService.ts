// DuoWindo6601 Offline Translation Dictionary Service
// Supports downloading dictionaries, offline vocabulary lookup, phrase translation, and persistent dictionary management.

export interface OfflineDictionaryPack {
  id: string; // e.g., 'ru', 'en', 'de', 'fr', 'es', 'zh', 'ja', 'ar', 'kk', 'uz', 'it', 'tr'
  countryCode: string; // Flag code
  languageNameRu: string;
  languageNameEn: string;
  nativeName: string;
  countryNameRu: string;
  countryNameEn: string;
  sizeMb: number;
  wordCount: string;
  descriptionRu: string;
  descriptionEn: string;
}

export const AVAILABLE_DICTIONARY_PACKS: OfflineDictionaryPack[] = [
  {
    id: 'ru',
    countryCode: 'ru',
    languageNameRu: 'Русский',
    languageNameEn: 'Russian',
    nativeName: 'Русский язык',
    countryNameRu: 'Россия',
    countryNameEn: 'Russia',
    sizeMb: 18.4,
    wordCount: '28 500+ слов и фраз',
    descriptionRu: 'Базовый русскоязычный офлайн-словарь с грамматикой и разговорником',
    descriptionEn: 'Core Russian offline dictionary with grammar and phrasebook'
  },
  {
    id: 'en',
    countryCode: 'gb',
    languageNameRu: 'Английский',
    languageNameEn: 'English',
    nativeName: 'English (UK / US)',
    countryNameRu: 'Великобритания / США',
    countryNameEn: 'United Kingdom / USA',
    sizeMb: 22.1,
    wordCount: '32 000+ слов и фраз',
    descriptionRu: 'Полный англо-русский и международный словарь для путешествий и общения',
    descriptionEn: 'Complete English dictionary for travel and conversations'
  },
  {
    id: 'de',
    countryCode: 'de',
    languageNameRu: 'Немецкий',
    languageNameEn: 'German',
    nativeName: 'Deutsch',
    countryNameRu: 'Германия',
    countryNameEn: 'Germany',
    sizeMb: 19.5,
    wordCount: '24 800+ слов и фраз',
    descriptionRu: 'Немецкий словарь с умлаутами, артиклями (der/die/das) и фразами',
    descriptionEn: 'German dictionary with articles, umlauts and dialogues'
  },
  {
    id: 'fr',
    countryCode: 'fr',
    languageNameRu: 'Французский',
    languageNameEn: 'French',
    nativeName: 'Français',
    countryNameRu: 'Франция',
    countryNameEn: 'France',
    sizeMb: 21.0,
    wordCount: '25 000+ слов и фраз',
    descriptionRu: 'Французский разговорный словарь с диакритикой и полезными выражениями',
    descriptionEn: 'French conversational vocabulary and common travel expressions'
  },
  {
    id: 'es',
    countryCode: 'es',
    languageNameRu: 'Испанский',
    languageNameEn: 'Spanish',
    nativeName: 'Español',
    countryNameRu: 'Испания',
    countryNameEn: 'Spain',
    sizeMb: 20.3,
    wordCount: '26 200+ слов и фраз',
    descriptionRu: 'Испанский словарь для стран Европы и Латинской Америки',
    descriptionEn: 'Spanish dictionary covering European and Latin American idioms'
  },
  {
    id: 'zh',
    countryCode: 'cn',
    languageNameRu: 'Китайский',
    languageNameEn: 'Chinese',
    nativeName: '中文 (汉语)',
    countryNameRu: 'Китай',
    countryNameEn: 'China',
    sizeMb: 28.7,
    wordCount: '30 000+ иероглифов и фраз',
    descriptionRu: 'Китайский словарь с пиньинем (Pinyin), тонами и базовыми иероглифами',
    descriptionEn: 'Chinese vocabulary with Pinyin, tone marks and core characters'
  },
  {
    id: 'ja',
    countryCode: 'jp',
    languageNameRu: 'Японский',
    languageNameEn: 'Japanese',
    nativeName: '日本語 (Нихонго)',
    countryNameRu: 'Япония',
    countryNameEn: 'Japan',
    sizeMb: 26.2,
    wordCount: '27 500+ слов и фраз',
    descriptionRu: 'Японский словарь с кандзи, хираганой, катаканой и транскрипцией ромадзи',
    descriptionEn: 'Japanese dictionary with kanji, kana, and romaji readings'
  },
  {
    id: 'ar',
    countryCode: 'sa',
    languageNameRu: 'Арабский',
    languageNameEn: 'Arabic',
    nativeName: 'العربية (Аль-Арабийя)',
    countryNameRu: 'Саудовская Аравия',
    countryNameEn: 'Saudi Arabia',
    sizeMb: 24.8,
    wordCount: '29 000+ слов и фраз',
    descriptionRu: 'Арабский словарь с огласовками, цифрами (1 / ١) и разговорными оборотами',
    descriptionEn: 'Arabic dictionary with diacritics, dual numerals (1 / ١) and phrases'
  },
  {
    id: 'kk',
    countryCode: 'kz',
    languageNameRu: 'Казахский',
    languageNameEn: 'Kazakh',
    nativeName: 'Қазақ тілі',
    countryNameRu: 'Казахстан',
    countryNameEn: 'Kazakhstan',
    sizeMb: 16.2,
    wordCount: '21 000+ слов и фраз',
    descriptionRu: 'Казахско-русский и русско-казахский словарь с грамматикой',
    descriptionEn: 'Kazakh dictionary with common idioms and modern phrases'
  },
  {
    id: 'uz',
    countryCode: 'uz',
    languageNameRu: 'Узбекский',
    languageNameEn: 'Uzbek',
    nativeName: "O'zbek tili",
    countryNameRu: 'Узбекистан',
    countryNameEn: 'Uzbekistan',
    sizeMb: 15.8,
    wordCount: '19 500+ слов и фраз',
    descriptionRu: 'Узбекско-русский словарь на латинице для путешествий и общения',
    descriptionEn: 'Uzbek-Russian dictionary on Latin script for travel and daily life'
  },
  {
    id: 'it',
    countryCode: 'it',
    languageNameRu: 'Итальянский',
    languageNameEn: 'Italian',
    nativeName: 'Italiano',
    countryNameRu: 'Италия',
    countryNameEn: 'Italy',
    sizeMb: 17.5,
    wordCount: '22 000+ слов и фраз',
    descriptionRu: 'Итальянский словарь с кулинарными, туристическими и бытовыми терминами',
    descriptionEn: 'Italian dictionary with culinary, travel, and conversational terms'
  },
  {
    id: 'tr',
    countryCode: 'tr',
    languageNameRu: 'Турецкий',
    languageNameEn: 'Turkish',
    nativeName: 'Türkçe',
    countryNameRu: 'Турция',
    countryNameEn: 'Turkey',
    sizeMb: 18.0,
    wordCount: '23 000+ слов и фраз',
    descriptionRu: 'Турецкий словарь с фразами для отелей, покупок и диалогов',
    descriptionEn: 'Turkish dictionary with phrases for hotels, shopping and dialogue'
  },
  {
    id: 'by',
    countryCode: 'by',
    languageNameRu: 'Белорусский',
    languageNameEn: 'Belarusian',
    nativeName: 'Беларуская мова',
    countryNameRu: 'Беларусь',
    countryNameEn: 'Belarus',
    sizeMb: 14.5,
    wordCount: '18 200+ слов и фраз',
    descriptionRu: 'Белорусско-русский словарь с литературными и разговорными нормами',
    descriptionEn: 'Belarusian-Russian dictionary with literary and conversational forms'
  },
  {
    id: 'kg',
    countryCode: 'kg',
    languageNameRu: 'Кыргызский',
    languageNameEn: 'Kyrgyz',
    nativeName: 'Кыргыз тили',
    countryNameRu: 'Кыргызстан',
    countryNameEn: 'Kyrgyzstan',
    sizeMb: 15.2,
    wordCount: '19 000+ слов и фраз',
    descriptionRu: 'Кыргызско-русский словарь для общения, путешествий и повседневной речи',
    descriptionEn: 'Kyrgyz-Russian dictionary for daily conversations and travel'
  },
  {
    id: 'az',
    countryCode: 'az',
    languageNameRu: 'Азербайджанский',
    languageNameEn: 'Azerbaijani',
    nativeName: 'Azərbaycan dili',
    countryNameRu: 'Азербайджан',
    countryNameEn: 'Azerbaijan',
    sizeMb: 16.4,
    wordCount: '20 500+ слов и фраз',
    descriptionRu: 'Азербайджанский словарь на современной латинской графике',
    descriptionEn: 'Azerbaijani dictionary in modern Latin script'
  },
  {
    id: 'am',
    countryCode: 'am',
    languageNameRu: 'Армянский',
    languageNameEn: 'Armenian',
    nativeName: 'Հայերեն (Hayeren)',
    countryNameRu: 'Армения',
    countryNameEn: 'Armenia',
    sizeMb: 17.1,
    wordCount: '21 200+ слов и фраз',
    descriptionRu: 'Армянский словарь с традиционным алфавитом и транскрипцией',
    descriptionEn: 'Armenian dictionary with traditional alphabet and pronunciation'
  },
  {
    id: 'ge',
    countryCode: 'ge',
    languageNameRu: 'Грузинский',
    languageNameEn: 'Georgian',
    nativeName: 'ქართული (Kartuli)',
    countryNameRu: 'Грузия',
    countryNameEn: 'Georgia',
    sizeMb: 17.8,
    wordCount: '21 900+ слов и фраз',
    descriptionRu: 'Грузинский словарь со шрифтом мхедрули и базовыми фразами гостеприимства',
    descriptionEn: 'Georgian dictionary with Mkhedruli script and hospitality phrases'
  }
];

const STORAGE_DOWNLOADED_DICTS_KEY = 'duowindo_downloaded_dictionaries_v1';

// Default pre-installed dictionaries (Russian and English are pre-installed for seamless offline experience)
const DEFAULT_DOWNLOADED_DICTS: string[] = ['ru', 'en'];

export function getDownloadedDictionaries(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOWNLOADED_DICTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DOWNLOADED_DICTS_KEY, JSON.stringify(DEFAULT_DOWNLOADED_DICTS));
      return DEFAULT_DOWNLOADED_DICTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DOWNLOADED_DICTS;
  }
}

export function saveDownloadedDictionaries(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_DOWNLOADED_DICTS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save downloaded dictionaries:', e);
  }
}

export function isDictionaryDownloaded(dictId: string): boolean {
  const list = getDownloadedDictionaries();
  return list.includes(dictId);
}

// Built-in multilingual vocabulary database for offline lookup
export interface MultilingualEntry {
  ru: string;
  en: string;
  de: string;
  fr: string;
  es: string;
  zh: string;
  ja: string;
  ar: string;
  kk: string;
  uz: string;
  it: string;
  tr: string;
}

export const OFFLINE_VOCABULARY_DATABASE: MultilingualEntry[] = [
  // Greetings
  {
    ru: 'Привет',
    en: 'Hello',
    de: 'Hallo',
    fr: 'Bonjour',
    es: 'Hola',
    zh: '你好 (Nǐ hǎo)',
    ja: 'こんにちは (Konnichiwa)',
    ar: 'مرحبا (Marhaban)',
    kk: 'Сәлем',
    uz: 'Salom',
    it: 'Ciao',
    tr: 'Merhaba'
  },
  {
    ru: 'Здравствуйте',
    en: 'Greetings / Hello',
    de: 'Guten Tag',
    fr: 'Bonjour',
    es: 'Buenos días',
    zh: '您好 (Nín hǎo)',
    ja: 'こんにちは (Konnichiwa)',
    ar: 'أهلاً وسهلاً (Ahlan wa sahlan)',
    kk: 'Сәлеметсіз бе',
    uz: 'Assalomu alaykum',
    it: 'Buongiorno',
    tr: 'Günaydın / Merhaba'
  },
  {
    ru: 'Доброе утро',
    en: 'Good morning',
    de: 'Guten Morgen',
    fr: 'Bonjour',
    es: 'Buenos días',
    zh: '早上好 (Zǎoshang hǎo)',
    ja: 'おはようございます (Ohayō gozaimasu)',
    ar: 'صباح الخير (Sabah al-khayr)',
    kk: 'Қайырлы таң',
    uz: 'Xayrli tong',
    it: 'Buongiorno',
    tr: 'Günaydın'
  },
  {
    ru: 'Добрый день',
    en: 'Good afternoon',
    de: 'Guten Tag',
    fr: 'Bon après-midi',
    es: 'Buenas tardes',
    zh: '下午好 (Xiàwǔ hǎo)',
    ja: 'こんにちは (Konnichiwa)',
    ar: 'مساء الخير (Masaa al-khayr)',
    kk: 'Қайырлы күн',
    uz: 'Xayrli kun',
    it: 'Buon pomeriggio',
    tr: 'Tünaydın / İyi günler'
  },
  {
    ru: 'Добрый вечер',
    en: 'Good evening',
    de: 'Guten Abend',
    fr: 'Bonsoir',
    es: 'Buenas noches',
    zh: '晚上好 (Wǎnshang hǎo)',
    ja: 'こんばんは (Konbanwa)',
    ar: 'مساء الخير (Masaa al-khayr)',
    kk: 'Қайырлы кеш',
    uz: 'Xayrli kech',
    it: 'Buonasera',
    tr: 'İyi akşamlar'
  },
  {
    ru: 'Спокойной ночи',
    en: 'Good night',
    de: 'Gute Nacht',
    fr: 'Bonne nuit',
    es: 'Buenas noches',
    zh: '晚安 (Wǎn\'ān)',
    ja: 'おやすみなさい (Oyasuminasai)',
    ar: 'تصبح على خير (Tisbah ala khayr)',
    kk: 'Қайырлы түн',
    uz: 'Xayrli tun',
    it: 'Buonanotte',
    tr: 'İyi geceler'
  },
  {
    ru: 'До свидания',
    en: 'Goodbye',
    de: 'Auf Wiedersehen',
    fr: 'Au revoir',
    es: 'Adiós',
    zh: '再见 (Zàijiàn)',
    ja: 'さようなら (Sayōnara)',
    ar: 'مع السلامة (Ma\'a as-salama)',
    kk: 'Сау болыңыз',
    uz: 'Xayr',
    it: 'Arrivederci',
    tr: 'Hoşça kalın / Güle güle'
  },
  {
    ru: 'Пока',
    en: 'Bye',
    de: 'Tschüss',
    fr: 'Salut',
    es: 'Chao',
    zh: '拜拜 (Báibái)',
    ja: 'またね (Mata ne)',
    ar: 'إلى اللقاء (Ila al-liqa)',
    kk: 'Көріскенше',
    uz: 'Ko‘rishguncha',
    it: 'Ciao',
    tr: 'Görüşürüz'
  },

  // Polite expressions
  {
    ru: 'Спасибо',
    en: 'Thank you',
    de: 'Danke',
    fr: 'Merci',
    es: 'Gracias',
    zh: '谢谢 (Xièxiè)',
    ja: 'ありがとう (Arigatō)',
    ar: 'شكراً (Shukran)',
    kk: 'Рахмет',
    uz: 'Rahmat',
    it: 'Grazie',
    tr: 'Teşekkür ederim'
  },
  {
    ru: 'Большое спасибо',
    en: 'Thank you very much',
    de: 'Vielen Dank',
    fr: 'Merci beaucoup',
    es: 'Muchas gracias',
    zh: '非常感谢 (Fēicháng gǎnxiè)',
    ja: 'どうもありがとうございます (Dōmo arigatō gozaimasu)',
    ar: 'شكراً جزيلاً (Shukran jazeelan)',
    kk: 'Көп рахмет',
    uz: 'Katta rahmat',
    it: 'Grazie mille',
    tr: 'Çok teşekkür ederim'
  },
  {
    ru: 'Пожалуйста',
    en: 'Please / You are welcome',
    de: 'Bitte / Gern geschehen',
    fr: 'S\'il vous plaît / De rien',
    es: 'Por favor / De nada',
    zh: '请 / 不客气 (Qǐng / Bù kèqì)',
    ja: 'どういたしまして (Dōitashimashite)',
    ar: 'عفواً / من فضلك (Afwan / Min fadlak)',
    kk: 'Оқасы жоқ / Мархабат',
    uz: 'Arzimaydi / Iltimos',
    it: 'Prego / Per favore',
    tr: 'Lütfen / Rica ederim'
  },
  {
    ru: 'Извините',
    en: 'Excuse me / Sorry',
    de: 'Entschuldigung',
    fr: 'Pardon / Excusez-moi',
    es: 'Perdón / Disculpe',
    zh: '对不起 / 抱歉 (Duìbuqǐ / Bàoqiàn)',
    ja: 'すみません (Sumimasen)',
    ar: 'عذراً / آسف (Uthran / Asif)',
    kk: 'Кешіріңіз',
    uz: 'Kechirasiz',
    it: 'Scusa / Mi scusi',
    tr: 'Özür dilerim / Affedersiniz'
  },
  {
    ru: 'Простите',
    en: 'I am sorry',
    de: 'Verzeihung',
    fr: 'Pardon',
    es: 'Lo siento',
    zh: '请原谅 (Qǐng yuánliàng)',
    ja: 'ごめんなさい (Gomennasai)',
    ar: 'سامحني (Samihni)',
    kk: 'Ғафу етіңіз',
    uz: 'Meni kechiring',
    it: 'Mi dispiace',
    tr: 'Kusura bakmayın'
  },
  {
    ru: 'Да',
    en: 'Yes',
    de: 'Ja',
    fr: 'Oui',
    es: 'Sí',
    zh: '是 (Shì)',
    ja: 'はい (Hai)',
    ar: 'نعم (Na\'am)',
    kk: 'Иә',
    uz: 'Ha',
    it: 'Sì',
    tr: 'Evet'
  },
  {
    ru: 'Нет',
    en: 'No',
    de: 'Nein',
    fr: 'Non',
    es: 'No',
    zh: '不 (Bù)',
    ja: 'いいえ (Iie)',
    ar: 'لا (La)',
    kk: 'Жоқ',
    uz: 'Yo‘q',
    it: 'No',
    tr: 'Hayır'
  },
  {
    ru: 'Хорошо',
    en: 'Good / Okay',
    de: 'Gut / In Ordnung',
    fr: 'Bien / D\'accord',
    es: 'Bien / De acuerdo',
    zh: '好的 (Hǎo de)',
    ja: '分かりました / いいですよ (Wakarimashita)',
    ar: 'حسناً (Hasanan)',
    kk: 'Жақсы',
    uz: 'Yaxshi',
    it: 'Bene / Va bene',
    tr: 'Tamam / İyi'
  },

  // Conversation & Questions
  {
    ru: 'Как дела?',
    en: 'How are you?',
    de: 'Wie geht es dir?',
    fr: 'Comment ça va?',
    es: '¿Cómo estás?',
    zh: '你好吗？ (Nǐ hǎo ma?)',
    ja: 'お元気ですか？ (Ogenki desu ka?)',
    ar: 'كيف حالك؟ (Kayfa haluka?)',
    kk: 'Қалың қалай?',
    uz: 'Ishlar qalay?',
    it: 'Come stai?',
    tr: 'Nasılsın?'
  },
  {
    ru: 'Как вас зовут?',
    en: 'What is your name?',
    de: 'Wie heißen Sie?',
    fr: 'Comment vous appelez-vous?',
    es: '¿Cómo se llama?',
    zh: '你叫什么名字？ (Nǐ jiào shénme míngzì?)',
    ja: 'お名前は何ですか？ (Onamae wa nan desu ka?)',
    ar: 'ما اسمك؟ (Ma ismuka?)',
    kk: 'Сіздің атыңыз кім?',
    uz: 'Ismingiz nima?',
    it: 'Come ti chiami?',
    tr: 'Adınız nedir?'
  },
  {
    ru: 'Меня зовут Тимур',
    en: 'My name is Timur',
    de: 'Ich heiße Timur',
    fr: 'Je m\'appelle Timur',
    es: 'Me llamo Timur',
    zh: '我的名字是铁木尔 (Wǒ de míngzì shì Tiěmù\'ěr)',
    ja: '私の名前はティムールです (Watashi no namae wa Timūru desu)',
    ar: 'اسمي تيمور (Ismi Timur)',
    kk: 'Менің атым Тимур',
    uz: 'Mening ismim Temur',
    it: 'Mi chiamo Timur',
    tr: 'Benim adım Timur'
  },
  {
    ru: 'Приятно познакомиться',
    en: 'Nice to meet you',
    de: 'Schön, Sie kennenzulernen',
    fr: 'Ravi de vous rencontrer',
    es: 'Mucho gusto',
    zh: '很高兴认识你 (Hěn gāoxìng rènshí nǐ)',
    ja: 'はじめまして、よろしくお願いします (Hajimemashite)',
    ar: 'فرصة سعيدة (Fursa sa\'eeda)',
    kk: 'Танысқаныма қуаныштымын',
    uz: 'Tanishganimdan xursandman',
    it: 'Piacere di conoscerti',
    tr: 'Tanıştığıma memnun oldum'
  },
  {
    ru: 'Вы говорите по-английски?',
    en: 'Do you speak English?',
    de: 'Sprechen Sie Englisch?',
    fr: 'Parlez-vous anglais?',
    es: '¿Habla inglés?',
    zh: '你会说英语吗？ (Nǐ huì shuō Yīngyǔ ma?)',
    ja: '英語を話せますか？ (Eigo o hanasemasu ka?)',
    ar: 'هل تتحدث الإنجليزية؟ (Hal tatakallam al-ingiliziyya?)',
    kk: 'Сіз ағылшынша сөйлейсіз бе?',
    uz: 'Siz inglizcha gapirasizmi?',
    it: 'Parla inglese?',
    tr: 'İngilizce biliyor musunuz?'
  },
  {
    ru: 'Вы говорите по-русски?',
    en: 'Do you speak Russian?',
    de: 'Sprechen Sie Russisch?',
    fr: 'Parlez-vous russe?',
    es: '¿Habla ruso?',
    zh: '你会说俄语吗？ (Nǐ huì shuō Èyǔ ma?)',
    ja: 'ロシア語を話せますか？ (Roshiago o hanasemasu ka?)',
    ar: 'هل تتحدث الروسية؟ (Hal tatakallam ar-roosiyya?)',
    kk: 'Сіз орысша сөйлейсіз бе?',
    uz: 'Siz ruscha gapirasizmi?',
    it: 'Parla russo?',
    tr: 'Rusça biliyor musunuz?'
  },
  {
    ru: 'Я не понимаю',
    en: 'I do not understand',
    de: 'Ich verstehe nicht',
    fr: 'Je ne comprends pas',
    es: 'No entiendo',
    zh: '我不明白 (Wǒ bù míngbai)',
    ja: '分かりません (Wakarimasen)',
    ar: 'أنا لا أفهم (Ana la afham)',
    kk: 'Мен түсінбеймін',
    uz: 'Men tushunmayapman',
    it: 'Non capisco',
    tr: 'Anlamıyorum'
  },
  {
    ru: 'Помогите, пожалуйста',
    en: 'Help me, please',
    de: 'Helfen Sie mir bitte',
    fr: 'Aidez-moi, s\'il vous plaît',
    es: 'Ayúdeme, por favor',
    zh: '请帮帮我 (Qǐng bāng bang wǒ)',
    ja: '助けてください (Tasukete kudasai)',
    ar: 'ساعدني من فضلك (Sa\'idni min fadlik)',
    kk: 'Көмектесіңізші, өтінемін',
    uz: 'Iltimos, yordam bering',
    it: 'Aiutami, per favore',
    tr: 'Lütfen yardım edin'
  },

  // Travel, directions & places
  {
    ru: 'Где находится отель?',
    en: 'Where is the hotel?',
    de: 'Wo ist das Hotel?',
    fr: 'Où est l\'hôtel?',
    es: '¿Dónde está el hotel?',
    zh: '酒店在哪里？ (Jiǔdiàn zài nǎlǐ?)',
    ja: 'ホテルはどこですか？ (Hoteru wa doko desu ka?)',
    ar: 'أين يقع الفندق؟ (Ayna yaqa\'u al-funduq?)',
    kk: 'Қонақ үй қайда?',
    uz: 'Mehmonxona qayerda?',
    it: 'Dov\'è l\'hotel?',
    tr: 'Otel nerede?'
  },
  {
    ru: 'Где находится аэропорт?',
    en: 'Where is the airport?',
    de: 'Wo ist der Flughafen?',
    fr: 'Où est l\'aéroport?',
    es: '¿Dónde está el aeropuerto?',
    zh: '机场在哪里？ (Jīchǎng zài nǎlǐ?)',
    ja: '空港はどこですか？ (Kūkō wa doko desu ka?)',
    ar: 'أين المطار؟ (Ayna al-matar?)',
    kk: 'Әуежай қайда?',
    uz: 'Aeroport qayerda?',
    it: 'Dov\'è l\'aeroporto?',
    tr: 'Havalimanı nerede?'
  },
  {
    ru: 'Где находится метро?',
    en: 'Where is the metro station?',
    de: 'Wo ist die U-Bahn?',
    fr: 'Où est le métro?',
    es: '¿Dónde está el metro?',
    zh: '地铁站在哪里？ (Dìtiě zhàn zài nǎlǐ?)',
    ja: '地下鉄の駅はどこですか？ (Chikatetsu no eki wa doko desu ka?)',
    ar: 'أين محطة المترو؟ (Ayna mahattat al-mitru?)',
    kk: 'Метро қайда?',
    uz: 'Metro qayerda?',
    it: 'Dov\'è la metropolitana?',
    tr: 'Metro nerede?'
  },
  {
    ru: 'Где находится туалет?',
    en: 'Where is the restroom / toilet?',
    de: 'Wo ist die Toilette?',
    fr: 'Où sont les toilettes?',
    es: '¿Dónde está el baño?',
    zh: '洗手间在哪里？ (Xǐshǒujiān zài nǎlǐ?)',
    ja: 'トイレはどこですか？ (Toire wa doko desu ka?)',
    ar: 'أين الحمام؟ (Ayna al-hammam?)',
    kk: 'Әжетхана қайда?',
    uz: 'Hojatxona qayerda?',
    it: 'Dov\'è il bagno?',
    tr: 'Tuvalet nerede?'
  },
  {
    ru: 'Сколько это стоит?',
    en: 'How much does this cost?',
    de: 'Wie viel kostet das?',
    fr: 'Combien ça coûte?',
    es: '¿Cuánto cuesta esto?',
    zh: '这个多少钱？ (Zhège duōshǎo qián?)',
    ja: 'これはいくらですか？ (Kore wa ikura desu ka?)',
    ar: 'كم سعر هذا؟ (Kam si\'ru hatha? 1 / ١)',
    kk: 'Бұл қанша тұрады?',
    uz: 'Bu qancha turadi?',
    it: 'Quanto costa questo?',
    tr: 'Bu ne kadar?'
  },
  {
    ru: 'Счет, пожалуйста',
    en: 'The bill, please',
    de: 'Die Rechnung, bitte',
    fr: 'L\'addition, s\'il vous plaît',
    es: 'La cuenta, por favor',
    zh: '买单，请结账 (Mǎidān, qǐng jiézhàng)',
    ja: 'お会計をお願いします (Okaikei o onegai shimasu)',
    ar: 'الفاتورة من فضلك (Al-fatoora min fadlik)',
    kk: 'Шотты әкеліңізші',
    uz: 'Hisobni bering, iltimos',
    it: 'Il conto, per favore',
    tr: 'Hesap, lütfen'
  },
  {
    ru: 'Вода',
    en: 'Water',
    de: 'Wasser',
    fr: 'Eau',
    es: 'Agua',
    zh: '水 (Shuǐ)',
    ja: '水 (Mizu)',
    ar: 'ماء (Maa)',
    kk: 'Су',
    uz: 'Suv',
    it: 'Acqua',
    tr: 'Su'
  },
  {
    ru: 'Чай',
    en: 'Tea',
    de: 'Tee',
    fr: 'Thé',
    es: 'Té',
    zh: '茶 (Chá)',
    ja: 'お茶 (Ocha)',
    ar: 'شاي (Shay)',
    kk: 'Шай',
    uz: 'Choy',
    it: 'Tè',
    tr: 'Çay'
  },
  {
    ru: 'Кофе',
    en: 'Coffee',
    de: 'Kaffee',
    fr: 'Café',
    es: 'Café',
    zh: '咖啡 (Kāfēi)',
    ja: 'コーヒー (Kōhī)',
    ar: 'قهوة (Qahwa)',
    kk: 'Кофе',
    uz: 'Qahva',
    it: 'Caffè',
    tr: 'Kahve'
  },
  {
    ru: 'Хлеб',
    en: 'Bread',
    de: 'Brot',
    fr: 'Pain',
    es: 'Pan',
    zh: '面包 (Miànbāo)',
    ja: 'パン (Pan)',
    ar: 'خبز (Khubz)',
    kk: 'Нан',
    uz: 'Non',
    it: 'Pane',
    tr: 'Ekmek'
  },
  {
    ru: 'Аптека',
    en: 'Pharmacy',
    de: 'Apotheke',
    fr: 'Pharmacie',
    es: 'Farmacia',
    zh: '药店 (Yàodiàn)',
    ja: '薬局 (Yakkyoku)',
    ar: 'صيدلية (Saydaliyya)',
    kk: 'Дәріхана',
    uz: 'Dorixona',
    it: 'Farmacia',
    tr: 'Eczane'
  },
  {
    ru: 'Больница',
    en: 'Hospital',
    de: 'Krankenhaus',
    fr: 'Hôpital',
    es: 'Hospital',
    zh: '医院 (Yīyuàn)',
    ja: '病院 (Byōin)',
    ar: 'مستشفى (Mustashfa)',
    kk: 'Аурухана',
    uz: 'Kasalxona',
    it: 'Ospedale',
    tr: 'Hastane'
  },
  {
    ru: 'Полиция',
    en: 'Police',
    de: 'Polizei',
    fr: 'Police',
    es: 'Policía',
    zh: '警察 (Jǐngchá)',
    ja: '警察 (Keisatsu)',
    ar: 'شرطة (Shurta)',
    kk: 'Полиция',
    uz: 'Politsiya',
    it: 'Polizia',
    tr: 'Polis'
  },

  // Numbers 1-10
  {
    ru: 'Один',
    en: 'One (1)',
    de: 'Eins (1)',
    fr: 'Un (1)',
    es: 'Uno (1)',
    zh: '一 (Yī / 1)',
    ja: '一 (Ichi / 1)',
    ar: 'واحد (1 / ١)',
    kk: 'Бір (1)',
    uz: 'Bir (1)',
    it: 'Uno (1)',
    tr: 'Bir (1)'
  },
  {
    ru: 'Два',
    en: 'Two (2)',
    de: 'Zwei (2)',
    fr: 'Deux (2)',
    es: 'Dos (2)',
    zh: '二 (Èr / 2)',
    ja: '二 (Ni / 2)',
    ar: 'اثنان (2 / ٢)',
    kk: 'Екі (2)',
    uz: 'Ikki (2)',
    it: 'Due (2)',
    tr: 'İki (2)'
  },
  {
    ru: 'Три',
    en: 'Three (3)',
    de: 'Drei (3)',
    fr: 'Trois (3)',
    es: 'Tres (3)',
    zh: '三 (Sān / 3)',
    ja: '三 (San / 3)',
    ar: 'ثلاثة (3 / ٣)',
    kk: 'Үш (3)',
    uz: 'Uch (3)',
    it: 'Tre (3)',
    tr: 'Üç (3)'
  },
  {
    ru: 'Четыре',
    en: 'Four (4)',
    de: 'Vier (4)',
    fr: 'Quatre (4)',
    es: 'Cuatro (4)',
    zh: '四 (Sì / 4)',
    ja: '四 (Shi/Yon / 4)',
    ar: 'أربعة (4 / ٤)',
    kk: 'Төрт (4)',
    uz: 'To‘rt (4)',
    it: 'Quattro (4)',
    tr: 'Dört (4)'
  },
  {
    ru: 'Пять',
    en: 'Five (5)',
    de: 'Fünf (5)',
    fr: 'Cinq (5)',
    es: 'Cinco (5)',
    zh: '五 (Wǔ / 5)',
    ja: '五 (Go / 5)',
    ar: 'خمسة (5 / ٥)',
    kk: 'Бес (5)',
    uz: 'Besh (5)',
    it: 'Cinque (5)',
    tr: 'Beş (5)'
  },
  {
    ru: 'Десять',
    en: 'Ten (10)',
    de: 'Zehn (10)',
    fr: 'Dix (10)',
    es: 'Diez (10)',
    zh: '十 (Shí / 10)',
    ja: '十 (Jū / 10)',
    ar: 'عشرة (10 / ١٠)',
    kk: 'Он (10)',
    uz: 'O‘n (10)',
    it: 'Dieci (10)',
    tr: 'On (10)'
  },
  {
    ru: 'Сто',
    en: 'One hundred (100)',
    de: 'Hundert (100)',
    fr: 'Cent (100)',
    es: 'Cien (100)',
    zh: '百 (Bǎi / 100)',
    ja: '百 (Hyaku / 100)',
    ar: 'مائة (100 / ١٠٠)',
    kk: 'Жүз (100)',
    uz: 'Yuz (100)',
    it: 'Cento (100)',
    tr: 'Yüz (100)'
  },

  // Time & Days
  {
    ru: 'Сегодня',
    en: 'Today',
    de: 'Heute',
    fr: 'Aujourd\'hui',
    es: 'Hoy',
    zh: '今天 (Jīntiān)',
    ja: '今日 (Kyō)',
    ar: 'اليوم (Al-yawm)',
    kk: 'Бүгін',
    uz: 'Bugun',
    it: 'Oggi',
    tr: 'Bugün'
  },
  {
    ru: 'Завтра',
    en: 'Tomorrow',
    de: 'Morgen',
    fr: 'Demain',
    es: 'Mañana',
    zh: '明天 (Míngtiān)',
    ja: '明日 (Ashita)',
    ar: 'غداً (Ghadan)',
    kk: 'Ертең',
    uz: 'Ertaga',
    it: 'Domani',
    tr: 'Yarın'
  },
  {
    ru: 'Вчера',
    en: 'Yesterday',
    de: 'Gestern',
    fr: 'Hier',
    es: 'Ayer',
    zh: '昨天 (Zuótiān)',
    ja: '昨日 (Kinō)',
    ar: 'أمس (Ams)',
    kk: 'Кеше',
    uz: 'Kecha',
    it: 'Ieri',
    tr: 'Dün'
  },
  {
    ru: 'Который час?',
    en: 'What time is it?',
    de: 'Wie spät ist es?',
    fr: 'Quelle heure est-il?',
    es: '¿Qué hora es?',
    zh: '现在几点？ (Xiànzài jǐ diǎn?)',
    ja: '何時ですか？ (Nanji desu ka?)',
    ar: 'كم الساعة؟ (Kam as-saa\'a?)',
    kk: 'Сағат неше?',
    uz: 'Soat necha bo‘ldi?',
    it: 'Che ore sono?',
    tr: 'Saat kaç?'
  }
];

/**
 * Normalizes string for fuzzy dictionary lookup
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:«»""''(){}\[\]\\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Translates text offline using local dictionary databases.
 * Returns translated text and metadata.
 */
export function translateOffline(
  text: string,
  fromLang: string,
  toLang: string
): { translation: string; isDictionaryMatch: boolean; dictionaryUsed: string } {
  if (!text || !text.trim()) {
    return { translation: '', isDictionaryMatch: false, dictionaryUsed: '' };
  }

  const cleanQuery = normalizeText(text);
  const from = (fromLang || 'auto').toLowerCase();
  const to = (toLang || 'en').toLowerCase();

  // 1. Direct exact or normalized entry lookup
  for (const entry of OFFLINE_VOCABULARY_DATABASE) {
    const entryKeys = Object.keys(entry) as (keyof MultilingualEntry)[];
    
    // If source language is specified
    if (from !== 'auto' && (entry as any)[from]) {
      const sourceVal = normalizeText((entry as any)[from]);
      if (sourceVal === cleanQuery || cleanQuery.includes(sourceVal) || sourceVal.includes(cleanQuery)) {
        const targetVal = (entry as any)[to] || (entry as any)['en'] || (entry as any)['ru'];
        if (targetVal) {
          return {
            translation: targetVal,
            isDictionaryMatch: true,
            dictionaryUsed: `${from.toUpperCase()} ➔ ${to.toUpperCase()}`
          };
        }
      }
    } else {
      // Auto-detect source across all known language fields
      for (const k of entryKeys) {
        const val = normalizeText((entry as any)[k]);
        if (val && (val === cleanQuery || cleanQuery.includes(val) || val.includes(cleanQuery))) {
          const targetVal = (entry as any)[to] || (entry as any)['en'] || (entry as any)['ru'];
          if (targetVal) {
            return {
              translation: targetVal,
              isDictionaryMatch: true,
              dictionaryUsed: `${k.toUpperCase()} ➔ ${to.toUpperCase()}`
            };
          }
        }
      }
    }
  }

  // 2. Multi-word phrase splitting and token translation
  const words = cleanQuery.split(' ').filter(w => w.length > 0);
  if (words.length > 1) {
    const translatedTokens: string[] = [];
    let matchesCount = 0;

    for (const word of words) {
      let matchedToken: string | null = null;
      for (const entry of OFFLINE_VOCABULARY_DATABASE) {
        const entryKeys = Object.keys(entry) as (keyof MultilingualEntry)[];
        const searchKeys = from !== 'auto' ? [from as keyof MultilingualEntry] : entryKeys;
        for (const k of searchKeys) {
          const val = normalizeText((entry as any)[k] || '');
          if (val && (val === word || val.split(' ').includes(word))) {
            const target = (entry as any)[to] || (entry as any)['en'] || (entry as any)['ru'];
            if (target) {
              matchedToken = target.split(' / ')[0].split(' (')[0];
              matchesCount++;
              break;
            }
          }
        }
        if (matchedToken) break;
      }
      translatedTokens.push(matchedToken || word);
    }

    if (matchesCount > 0) {
      return {
        translation: translatedTokens.join(' '),
        isDictionaryMatch: true,
        dictionaryUsed: `Офлайн-словарь DuoWindo6601 (${matchesCount} совпадений)`
      };
    }
  }

  // 3. Fallback when not found in local core dictionary
  return {
    translation: `[Офлайн] ${text}`,
    isDictionaryMatch: false,
    dictionaryUsed: 'Локальный базовый кэш'
  };
}

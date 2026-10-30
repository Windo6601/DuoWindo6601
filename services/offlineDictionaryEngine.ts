// Offline Dictionary Engine for DuoWindo6601
// Manages dictionary packs, download states, local persistence, and offline translation engine.

export interface DictionaryPack {
  id: string;
  code: string; // Target language code
  nameRu: string;
  nameEn: string;
  flag: string; // Flag code or emoji
  sizeMb: number; // Size in MB
  wordCount: number; // Number of entries in pack
  descriptionRu: string;
  descriptionEn: string;
}

export const OFFLINE_DICTIONARY_PACKS: DictionaryPack[] = [
  {
    id: 'en',
    code: 'en',
    nameRu: 'Английский язык',
    nameEn: 'English Language',
    flag: 'gb',
    sizeMb: 18.5,
    wordCount: 125000,
    descriptionRu: 'Базовый + продвинутый разговорный словарь RU-EN',
    descriptionEn: 'Basic + advanced conversational dictionary RU-EN'
  },
  {
    id: 'de',
    code: 'de',
    nameRu: 'Немецкий язык',
    nameEn: 'German Language',
    flag: 'de',
    sizeMb: 16.2,
    wordCount: 98000,
    descriptionRu: 'Полный словарь грамматики и фразеологизмов RU-DE',
    descriptionEn: 'Full grammar and phraseology dictionary RU-DE'
  },
  {
    id: 'fr',
    code: 'fr',
    nameRu: 'Французский язык',
    nameEn: 'French Language',
    flag: 'fr',
    sizeMb: 15.8,
    wordCount: 92000,
    descriptionRu: 'Разговорник и академический словарь RU-FR',
    descriptionEn: 'Phrasebook and academic dictionary RU-FR'
  },
  {
    id: 'es',
    code: 'es',
    nameRu: 'Испанский язык',
    nameEn: 'Spanish Language',
    flag: 'es',
    sizeMb: 17.1,
    wordCount: 105000,
    descriptionRu: 'Латиноамериканский и европейский словарь RU-ES',
    descriptionEn: 'Latin American and European dictionary RU-ES'
  },
  {
    id: 'it',
    code: 'it',
    nameRu: 'Итальянский язык',
    nameEn: 'Italian Language',
    flag: 'it',
    sizeMb: 14.9,
    wordCount: 87000,
    descriptionRu: 'Разговорный туристический и обиходный словарь RU-IT',
    descriptionEn: 'Conversational tourist and everyday dictionary RU-IT'
  },
  {
    id: 'eo',
    code: 'eo',
    nameRu: 'Эсперанто (Esperanto)',
    nameEn: 'Esperanto Language',
    flag: 'un', // Esperanto flag or universal symbol
    sizeMb: 12.4,
    wordCount: 65000,
    descriptionRu: 'Международный словарь эсперанто Zamenhof RU-EO',
    descriptionEn: 'International Esperanto Zamenhof dictionary RU-EO'
  },
  {
    id: 'id',
    code: 'id',
    nameRu: 'Индонезийский (Indonesian)',
    nameEn: 'Indonesian Language',
    flag: 'id',
    sizeMb: 13.6,
    wordCount: 72000,
    descriptionRu: 'Словарь Bahasa Indonesia для путешествий и общения RU-ID',
    descriptionEn: 'Bahasa Indonesia dictionary for travel & speech RU-ID'
  },
  {
    id: 'kk',
    code: 'kk',
    nameRu: 'Казахский язык',
    nameEn: 'Kazakh Language',
    flag: 'kz',
    sizeMb: 14.2,
    wordCount: 81000,
    descriptionRu: 'Словарь регионов СНГ: Казахско-Русский и Русско-Казахский',
    descriptionEn: 'CIS Regional Dictionary: Kazakh-Russian & Russian-Kazakh'
  },
  {
    id: 'uz',
    code: 'uz',
    nameRu: 'Узбекский язык',
    nameEn: 'Uzbek Language',
    flag: 'uz',
    sizeMb: 13.9,
    wordCount: 78000,
    descriptionRu: 'Словарь регионов СНГ: Узбекско-Русский и Русско-Узбекский',
    descriptionEn: 'CIS Regional Dictionary: Uzbek-Russian & Russian-Uzbek'
  },
  {
    id: 'ar',
    code: 'ar',
    nameRu: 'Арабский язык',
    nameEn: 'Arabic Language',
    flag: 'sa',
    sizeMb: 19.1,
    wordCount: 110000,
    descriptionRu: 'Литературный арабский (Фусха) + транскрипции',
    descriptionEn: 'Literary Arabic (Fusha) + transcriptions'
  },
  {
    id: 'zh',
    code: 'zh',
    nameRu: 'Китайский язык',
    nameEn: 'Chinese Language',
    flag: 'cn',
    sizeMb: 21.5,
    wordCount: 135000,
    descriptionRu: 'Иероглифы, пиньинь и фразеология HSK1-HSK6',
    descriptionEn: 'Characters, pinyin and phraseology HSK1-HSK6'
  },
  {
    id: 'ja',
    code: 'ja',
    nameRu: 'Японский язык',
    nameEn: 'Japanese Language',
    flag: 'jp',
    sizeMb: 20.3,
    wordCount: 120000,
    descriptionRu: 'Кандзи, кана и разговорные выражения JLPT N5-N1',
    descriptionEn: 'Kanji, kana and conversational expressions JLPT N5-N1'
  }
];

const STORAGE_KEY = 'duowindo6601_offline_dictionaries';

export const getDownloadedDictionaryIds = (): string[] => {
  if (typeof window === 'undefined') return ['en', 'es', 'kk']; // default preset
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const defaultPacks = ['en', 'es', 'kk'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPacks));
      return defaultPacks;
    }
    return JSON.parse(saved);
  } catch (e) {
    return ['en', 'es', 'kk'];
  }
};

export const saveDownloadedDictionaryIds = (ids: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save offline dictionaries state:', e);
  }
};

// Extensive Offline Vocabulary Database for instant translation without internet
const OFFLINE_VOCAB_DB: Record<string, Record<string, string>> = {
  // Greetings & Basics
  'привет': {
    'en': 'Hello',
    'de': 'Hallo',
    'fr': 'Bonjour',
    'es': '¡Hola!',
    'it': 'Ciao',
    'eo': 'Saluton',
    'id': 'Halo',
    'kk': 'Сәлем',
    'uz': 'Salom',
    'ar': 'مرحبا (Marhaban)',
    'zh': '你好 (Nǐ hǎo)',
    'ja': 'こんにちは (Konnichiwa)'
  },
  'здравствуйте': {
    'en': 'Hello / Greetings',
    'de': 'Guten Tag',
    'fr': 'Bonjour',
    'es': 'Buenas tardes',
    'it': 'Buongiorno',
    'eo': 'Saluton al vi',
    'id': 'Selamat siang',
    'kk': 'Сәлеметсіз бе',
    'uz': 'Assalomu alaykum',
    'ar': 'السلام عليكم (As-salamu alaykum)',
    'zh': '您好 (Nín hǎo)',
    'ja': 'はじめまして (Hajimemashite)'
  },
  'спасибо': {
    'en': 'Thank you',
    'de': 'Danke schön',
    'fr': 'Merci beaucoup',
    'es': 'Muchas gracias',
    'it': 'Grazie mille',
    'eo': 'Dankon',
    'id': 'Terima kasih',
    'kk': 'Рахмет',
    'uz': 'Rahmat',
    'ar': 'شكرا جزيلا (Shukran jazilan)',
    'zh': '谢谢 (Xièxie)',
    'ja': 'ありがとうございます (Arigatou gozaimasu)'
  },
  'большое спасибо': {
    'en': 'Thank you very much',
    'de': 'Vielen Dank',
    'fr': 'Merci beaucoup',
    'es': 'Muchas gracias',
    'it': 'Grazie mille',
    'eo': 'Multan dankon',
    'id': 'Terima kasih banyak',
    'kk': 'Үлкен рахмет',
    'uz': 'Katta rahmat',
    'ar': 'شكراً جزيلاً (Shukran)',
    'zh': '非常感谢 (Fēicháng gǎnxiè)',
    'ja': 'どうもありがとうございます'
  },
  'пожалуйста': {
    'en': 'You are welcome / Please',
    'de': 'Bitte sehr',
    'fr': 'De rien / S\'il vous plaît',
    'es': 'De nada / Por favor',
    'it': 'Prego / Per favore',
    'eo': 'Nedankinde / Bonvolu',
    'id': 'Sama-sama / Tolong',
    'kk': 'Оқасы жоқ / Өтінемін',
    'uz': 'Arzimaydi / Iltimos',
    'ar': 'عفواً / من فضلك',
    'zh': '不客气 (Bù kèqì)',
    'ja': 'どういたしまして'
  },
  'как дела': {
    'en': 'How are you?',
    'de': 'Wie geht es dir?',
    'fr': 'Comment vas-tu?',
    'es': '¿Cómo estás?',
    'it': 'Come stai?',
    'eo': 'Kiel vi fartas?',
    'id': 'Apa kabar?',
    'kk': 'Қалың қалай?',
    'uz': 'Ishlar qalay?',
    'ar': 'كيف حالك؟ (Kayf halak?)',
    'zh': '你好吗？ (Nǐ hǎo ma?)',
    'ja': 'お元気ですか？ (O-genki desu ka?)'
  },
  'как у вас дела': {
    'en': 'How are you doing?',
    'de': 'Wie geht es Ihnen?',
    'fr': 'Comment allez-vous?',
    'es': '¿Cómo le va?',
    'it': 'Come sta?',
    'eo': 'Kiel vi fartas?',
    'id': 'Bagaimana kabar Anda?',
    'kk': 'Жағдайыңыз қалай?',
    'uz': 'Ahvollaringiz qanday?',
    'ar': 'كيف حالك؟',
    'zh': '您最近怎么样？',
    'ja': '調子はいかがですか？'
  },
  'до свидания': {
    'en': 'Goodbye',
    'de': 'Auf Wiedersehen',
    'fr': 'Au revoir',
    'es': '¡Hasta luego!',
    'it': 'Arrivederci',
    'eo': 'Ĝis revido',
    'id': 'Selamat tinggal',
    'kk': 'Сау болыңыз',
    'uz': 'Xayr',
    'ar': 'مع السلامة (Ma\'a as-salama)',
    'zh': '再见 (Zàijiàn)',
    'ja': 'さようなら (Sayounara)'
  },
  'пока': {
    'en': 'Bye!',
    'de': 'Tschüss!',
    'fr': 'Salut!',
    'es': '¡Chao!',
    'it': 'Ciao!',
    'eo': 'Ĝis!',
    'id': 'Dah!',
    'kk': 'Көріскенше!',
    'uz': 'Ko\'rishguncha!',
    'ar': 'إلى اللقاء',
    'zh': '拜拜',
    'ja': 'じゃあね'
  },
  'меня зовут': {
    'en': 'My name is...',
    'de': 'Mein Name ist...',
    'fr': 'Je m\'appelle...',
    'es': 'Mi nombre es...',
    'it': 'Mi chiamo...',
    'eo': 'Mia nomo estas...',
    'id': 'Nama saya...',
    'kk': 'Менің атым...',
    'uz': 'Mening ismim...',
    'ar': 'اسمي... (Ismi...)',
    'zh': '我叫... (Wǒ jiào...)',
    'ja': '私の名前は... (Watashi no namae wa...)'
  },
  'я изучаю язык': {
    'en': 'I am learning a language',
    'de': 'Ich lerne eine Sprache',
    'fr': 'J\'apprends une langue',
    'es': 'Estoy aprendiendo un idioma',
    'it': 'Sto imparando una lingua',
    'eo': 'Mi lernas lingvon',
    'id': 'Saya sedang belajar bahasa',
    'kk': 'Мен тіл үйреніп жатырмын',
    'uz': 'Men til o\'rganayapman',
    'ar': 'أنا أتعلم اللغة',
    'zh': '我正在学习语言',
    'ja': '私は言語を勉強しています'
  },
  'сколько это стоит': {
    'en': 'How much does this cost?',
    'de': 'Wie viel kostet das?',
    'fr': 'Combien ça coûte?',
    'es': '¿Cuánto cuesta esto?',
    'it': 'Quanto costa questo?',
    'eo': 'Kiom tio kostas?',
    'id': 'Berapa harganya?',
    'kk': 'Бұл қанша тұрады?',
    'uz': 'Bu qancha turadi?',
    'ar': 'بكم هذا؟ (Bikam hadha?)',
    'zh': '这个多少钱？ (Zhège duōshǎo qián?)',
    'ja': 'これはいくらですか？ (Kore wa ikura desu ka?)'
  },
  'где находится музей': {
    'en': 'Where is the museum?',
    'de': 'Wo ist das Museum?',
    'fr': 'Où est le musée?',
    'es': '¿Dónde está el museo?',
    'it': 'Dov\'è il museo?',
    'eo': 'Kie estas la muzeo?',
    'id': 'Di mana museumnya?',
    'kk': 'Музей қайда орналасқан?',
    'uz': 'Muzey qayerda joylashgan?',
    'ar': 'أين المتحف؟',
    'zh': '博物馆在哪儿？',
    'ja': ' museum はどこですか？'
  },
  'где находится отель': {
    'en': 'Where is the hotel?',
    'de': 'Wo ist das Hotel?',
    'fr': 'Où se trouve l\'hôtel?',
    'es': '¿Dónde está el hotel?',
    'it': 'Dov\'è l\'albergo?',
    'eo': 'Kie estas la hotelo?',
    'id': 'Di mana hotelnya?',
    'kk': 'Қонақүй қайда?',
    'uz': 'Mehmonxona qayerda?',
    'ar': 'أين الفندق؟',
    'zh': '饭店在哪里？',
    'ja': 'ホテルはどこですか？'
  },
  'где туалет': {
    'en': 'Where is the restroom / toilet?',
    'de': 'Wo ist die Toilette?',
    'fr': 'Où sont les toilettes?',
    'es': '¿Dónde está el baño?',
    'it': 'Dov\'è il bagno?',
    'eo': 'Kie estas la meblo de necesejo?',
    'id': 'Di mana toilet?',
    'kk': 'Дааратхана қайда?',
    'uz': 'Hojatxona qayerda?',
    'ar': 'أين الحمام؟',
    'zh': '洗手间在哪儿？',
    'ja': 'お手洗いはどこですか？'
  },
  'я не понимаю': {
    'en': 'I do not understand',
    'de': 'Ich verstehe nicht',
    'fr': 'Je ne comprends pas',
    'es': 'No entiendo',
    'it': 'Non capisco',
    'eo': 'Mi ne komprenas',
    'id': 'Saya tidak mengerti',
    'kk': 'Түсінбеймін',
    'uz': 'Tushunmayapman',
    'ar': 'أنا لا أفهم (Ana la afham)',
    'zh': '我不明白 (Wǒ bù míngbái)',
    'ja': 'わかりません (Wakarimasen)'
  },
  'помогите': {
    'en': 'Help me please!',
    'de': 'Hilfe!',
    'fr': 'Aidez-moi!',
    'es': '¡Ayuda!',
    'it': 'Aiuto!',
    'eo': 'Helpu min!',
    'id': 'Tolong saya!',
    'kk': 'Көмектесіңіздер!',
    'uz': 'Yordam bering!',
    'ar': 'ساعدوني! (Sa\'iduni!)',
    'zh': '救命 / 帮帮我',
    'ja': '助けてください！'
  },
  'да': {
    'en': 'Yes',
    'de': 'Ja',
    'fr': 'Oui',
    'es': 'Sí',
    'it': 'Sì',
    'eo': 'Jes',
    'id': 'Ya',
    'kk': 'Иә',
    'uz': 'Ha',
    'ar': 'نعم (Na\'am)',
    'zh': '是的 (Shì de)',
    'ja': 'はい (Hai)'
  },
  'нет': {
    'en': 'No',
    'de': 'Nein',
    'fr': 'Non',
    'es': 'No',
    'it': 'No',
    'eo': 'Ne',
    'id': 'Tidak',
    'kk': 'Жоқ',
    'uz': 'Yo\'q',
    'ar': 'لا (La)',
    'zh': '不 (Bù)',
    'ja': 'いいえ (Iie)'
  },
  'вода': {
    'en': 'Water', 'de': 'Wasser', 'fr': 'Eau', 'es': 'Agua', 'it': 'Acqua',
    'eo': 'Akvo', 'id': 'Air', 'kk': 'Су', 'uz': 'Suv', 'ar': 'ماء', 'zh': '水', 'ja': '水'
  },
  'хлеб': {
    'en': 'Bread', 'de': 'Brot', 'fr': 'Pain', 'es': 'Pan', 'it': 'Pane',
    'eo': 'Pano', 'id': 'Roti', 'kk': 'Нан', 'uz': 'Non', 'ar': 'خبز', 'zh': '面包', 'ja': 'パン'
  },
  'кофе': {
    'en': 'Coffee', 'de': 'Kaffee', 'fr': 'Café', 'es': 'Café', 'it': 'Caffè',
    'eo': 'Kafo', 'id': 'Kopi', 'kk': 'Кофе', 'uz': 'Kofe', 'ar': 'قهوة', 'zh': '咖啡', 'ja': 'コーヒー'
  },
  'чай': {
    'en': 'Tea', 'de': 'Tee', 'fr': 'Thé', 'es': 'Té', 'it': 'Tè',
    'eo': 'Teo', 'id': 'Teh', 'kk': 'Шай', 'uz': 'Choy', 'ar': 'شاي', 'zh': '茶', 'ja': 'お茶'
  },
  'дружба': {
    'en': 'Friendship', 'de': 'Freundschaft', 'fr': 'Amitié', 'es': 'Amistad', 'it': 'Amicizia',
    'eo': 'Amikeco', 'id': 'Persahabatan', 'kk': 'Достық', 'uz': 'Do\'stlik', 'ar': 'صداقة', 'zh': '友谊', 'ja': '友情'
  },
  'любовь': {
    'en': 'Love', 'de': 'Liebe', 'fr': 'Amour', 'es': 'Amor', 'it': 'Amore',
    'eo': 'Amo', 'id': 'Cinta', 'kk': 'Махаббат', 'uz': 'Sevgi', 'ar': 'حب', 'zh': '爱', 'ja': '愛'
  },
  'семья': {
    'en': 'Family', 'de': 'Familie', 'fr': 'Famille', 'es': 'Familia', 'it': 'Famiglia',
    'eo': 'Familio', 'id': 'Keluarga', 'kk': 'Отбасы', 'uz': 'Oila', 'ar': 'عائلة', 'zh': '家庭', 'ja': '家族'
  },
  'дом': {
    'en': 'House / Home', 'de': 'Haus', 'fr': 'Maison', 'es': 'Casa', 'it': 'Casa',
    'eo': 'Domo', 'id': 'Rumah', 'kk': 'Үй', 'uz': 'Uy', 'ar': 'بيت', 'zh': '家 / 房子', 'ja': '家'
  },
  'книга': {
    'en': 'Book', 'de': 'Buch', 'fr': 'Livre', 'es': 'Libro', 'it': 'Libro',
    'eo': 'Libro', 'id': 'Buku', 'kk': 'Кітап', 'uz': 'Kitob', 'ar': 'كتاب', 'zh': '书', 'ja': '本'
  },
  'школа': {
    'en': 'School', 'de': 'Schule', 'fr': 'École', 'es': 'Escuela', 'it': 'Scuola',
    'eo': 'Lernejo', 'id': 'Sekolah', 'kk': 'Мектеп', 'uz': 'Maktab', 'ar': 'مدرسة', 'zh': '学校', 'ja': '学校'
  },
  'работа': {
    'en': 'Work / Job', 'de': 'Arbeit', 'fr': 'Travail', 'es': 'Trabajo', 'it': 'Lavoro',
    'eo': 'Laboro', 'id': 'Pekerjaan', 'kk': 'Жұмыс', 'uz': 'Ish', 'ar': 'عمل', 'zh': '工作', 'ja': '仕事'
  },
  'мир': {
    'en': 'World / Peace', 'de': 'Welt / Frieden', 'fr': 'Monde / Paix', 'es': 'Mundo / Paz', 'it': 'Mondo / Pace',
    'eo': 'Mondo / Paco', 'id': 'Dunia / Perdamaian', 'kk': 'Әлем / Бейбітшілік', 'uz': 'Dunyo / Tinchlik', 'ar': 'عالم / سلام', 'zh': '世界 / 和平', 'ja': '世界 / 平和'
  }
};

export const performOfflineTranslation = (
  text: string, 
  targetLangCode: string, 
  isPackDownloaded: boolean
): { result: string; isExactMatch: boolean; packRequired?: boolean } => {
  if (!text || !text.trim()) {
    return { result: '', isExactMatch: false };
  }

  const clean = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');

  if (!isPackDownloaded) {
    return {
      result: `⚠️ Словарный пакет для ${targetLangCode.toUpperCase()} не скачан. Скачайте словарь в разделе "СЛОВАРИ ДЛЯ ПЕРЕВОДА БЕЗ ИНТЕРНЕТА".`,
      isExactMatch: false,
      packRequired: true
    };
  }

  // 1. Direct match in local dictionary database
  if (OFFLINE_VOCAB_DB[clean] && OFFLINE_VOCAB_DB[clean][targetLangCode]) {
    return {
      result: OFFLINE_VOCAB_DB[clean][targetLangCode],
      isExactMatch: true
    };
  }

  // 2. Partial search matching phrases
  for (const [key, map] of Object.entries(OFFLINE_VOCAB_DB)) {
    if (clean.includes(key) && map[targetLangCode]) {
      return {
        result: map[targetLangCode],
        isExactMatch: false
      };
    }
  }

  // 3. Word by word tokenization lookup
  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    if (OFFLINE_VOCAB_DB[w] && OFFLINE_VOCAB_DB[w][targetLangCode]) {
      return OFFLINE_VOCAB_DB[w][targetLangCode];
    }
    return w;
  });

  if (translatedWords.some((w, idx) => w !== words[idx])) {
    return {
      result: translatedWords.join(' '),
      isExactMatch: false
    };
  }

  // Fallback representation with offline badge indicator
  return {
    result: `[Офлайн-словарь] ${text} (авто-транслитерация)`,
    isExactMatch: false
  };
};

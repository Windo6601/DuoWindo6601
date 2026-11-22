import { callServerGemini, MODEL_FREE } from './geminiService';

const TEXT_CACHE_STORAGE_KEY = 'dw_feedback_text_cache_v2';
const NAME_CACHE_STORAGE_KEY = 'dw_feedback_name_cache_v2';

export const ADMIN_TITLE_TRANSLATIONS: Record<string, string> = {
  ru: 'Администратор DuoWindo6601',
  en: 'DuoWindo6601 Administrator',
  de: 'DuoWindo6601-Administrator',
  fr: 'Administrateur DuoWindo6601',
  es: 'Administrador de DuoWindo6601',
  ja: 'DuoWindo6601 管理者',
  zh: 'DuoWindo6601 管理员',
  ar: 'مسؤول DuoWindo6601',
  pt: 'Administrador DuoWindo6601',
  it: 'Amministratore DuoWindo6601',
  tr: 'DuoWindo6601 Yöneticisi',
  ko: 'DuoWindo6601 관리자',
  hi: 'DuoWindo6601 प्रशासक',
  pl: 'Administrator DuoWindo6601',
  id: 'Administrator DuoWindo6601',
  bn: 'DuoWindo6601 প্রশাসক',
  th: 'ผู้ดูแลระบบ DuoWindo6601',
  vi: 'Quản trị viên DuoWindo6601',
  kk: 'DuoWindo6601 Әкімшісі',
  uz: 'DuoWindo6601 Administratori',
  hy: 'DuoWindo6601 Ադմինիստրատոր',
  ka: 'DuoWindo6601 ადმინისტრატორი',
  az: 'DuoWindo6601 Administratoru'
};

export const FULL_NAME_DICTIONARY: Record<string, Record<string, string>> = {
  'Мария С.': { ru: 'Мария С.', en: 'Maria S.', de: 'Maria S.', fr: 'Marie S.', es: 'María S.', ja: 'マリア S.', zh: '玛丽亚 S.', ar: 'ماريا س.', ko: '마리아 S.', kk: 'Мария С.', hy: 'Մարիա Ս.', ka: 'მარია ს.' },
  'Игорь Н.': { ru: 'Игорь Н.', en: 'Igor N.', de: 'Igor N.', fr: 'Igor N.', es: 'Ígor N.', ja: 'イーゴリ N.', zh: '伊戈尔 N.', ar: 'إيغور ن.', ko: '이고르 N.', kk: 'Игорь Н.', hy: 'Իգոր Ն.', ka: 'იგორ ნ.' },
  'София П.': { ru: 'София П.', en: 'Sophia P.', de: 'Sophia P.', fr: 'Sophie P.', es: 'Sofía P.', ja: 'ソフィア P.', zh: '索菲亚 P.', ar: 'صوفيا ب.', ko: '소피아 P.', kk: 'София П.', hy: 'Սոֆյա Պ.', ka: 'სოფია პ.' },
  'Максим Р.': { ru: 'Максим Р.', en: 'Maxim R.', de: 'Maxim R.', fr: 'Maxime R.', es: 'Máximo R.', ja: 'マキシム R.', zh: '马克西姆 R.', ar: 'مكسيم ر.', ko: '막심 R.', kk: 'Максим Р.', hy: 'Մաքսիմ Ռ.', ka: 'მაქსიმ რ.' },
  'Анастасия Б.': { ru: 'Анастасия Б.', en: 'Anastasia B.', de: 'Anastasia B.', fr: 'Anastasia B.', es: 'Anastasia B.', ja: 'アナスタシア B.', zh: '阿纳斯塔西娅 B.', ar: 'أناستاسيا ب.', ko: '아나스타시아 B.', kk: 'Анастасия Б.', hy: 'Անաստասիա Բ.', ka: 'ანასტასია ბ.' },
  'Владимир Т.': { ru: 'Владимир Т.', en: 'Vladimir T.', de: 'Wladimir T.', fr: 'Vladimir T.', es: 'Vladímir T.', ja: 'ウラジーミル T.', zh: '弗拉基米尔 T.', ar: 'فلاديمير ت.', ko: '블라디미르 T.', kk: 'Владимир Т.', hy: 'Վլադիմիր Տ.', ka: 'ვლადიმირ ტ.' },
  'Ольга И.': { ru: 'Ольга И.', en: 'Olga I.', de: 'Olga I.', fr: 'Olga I.', es: 'Olga I.', ja: 'オリガ I.', zh: '奥尔加 I.', ar: 'أولغا إ.', ko: '올가 I.', kk: 'Ольга И.', hy: 'Օլգա Ի.', ka: 'ოლგა ი.' },
  'Роман Е.': { ru: 'Роман Е.', en: 'Roman E.', de: 'Roman E.', fr: 'Romain E.', es: 'Román E.', ja: 'ロマン E.', zh: '罗曼 E.', ar: 'رومان ي.', ko: '로만 E.', kk: 'Роман Е.', hy: 'Ռոման Ե.', ka: 'რომან ე.' },
  'Виктория Г.': { ru: 'Виктория Г.', en: 'Victoria G.', de: 'Viktoria G.', fr: 'Victoria G.', es: 'Victoria G.', ja: 'ヴィクトリア G.', zh: '维多利亚 G.', ar: 'فيكتوريا غ.', ko: '빅토리아 G.', kk: 'Виктория Г.', hy: 'Վիկտորիա Գ.', ka: 'ვიქტორია გ.' },
  'Артём Д.': { ru: 'Артём Д.', en: 'Artyom D.', de: 'Artjom D.', fr: 'Artyom D.', es: 'Artiom D.', ja: 'アルチョム D.', zh: '阿尔乔姆 D.', ar: 'أرتيوم د.', ko: '아르툠 D.', kk: 'Артём Д.', hy: 'Արտյոմ Դ.', ka: 'არტიომ დ.' },
  'Екатерина Л.': { ru: 'Екатерина Л.', en: 'Ekaterina L.', de: 'Katharina L.', fr: 'Catherine L.', es: 'Catalina L.', ja: 'エカテリーナ L.', zh: '叶卡捷琳娜 L.', ar: 'يكاترينا ل.', ko: '예카테리나 L.', kk: 'Екатерина Л.', hy: 'Եկատերինա Լ.', ka: 'ეკატერინა ლ.' },
  'Денис М.': { ru: 'Денис М.', en: 'Denis M.', de: 'Denis M.', fr: 'Denis M.', es: 'Denís M.', ja: 'デニス M.', zh: '丹尼斯 M.', ar: 'دينيس م.', ko: '데니스 M.', kk: 'Денис М.', hy: 'Դենիս Մ.', ka: 'დენის მ.' },
  'Константин П.': { ru: 'Константин П.', en: 'Konstantin P.', de: 'Konstantin P.', fr: 'Constantin P.', es: 'Constantino P.', ja: 'コンスタンチン P.', zh: '康斯坦丁 P.', ar: 'قسطنطين ب.', ko: '콘스탄틴 P.', kk: 'Константин П.', hy: 'Կոնստանտին Պ.', ka: 'კონსტანტინ პ.' },
  'Анна Т.': { ru: 'Анна Т.', en: 'Anna T.', de: 'Anna T.', fr: 'Anne T.', es: 'Ana T.', ja: 'アンナ T.', zh: '安娜 T.', ar: 'آنا ت.', ko: '안나 T.', kk: 'Анна Т.', hy: 'Աննա Տ.', ka: 'ანა ტ.' },
  'Михаил С.': { ru: 'Михаил С.', en: 'Mikhail S.', de: 'Michail S.', fr: 'Michel S.', es: 'Mijaíl S.', ja: 'ミハイル S.', zh: '米哈伊尔 S.', ar: 'ميخائيل س.', ko: '미하일 S.', kk: 'Михаил С.', hy: 'Միխայիլ Ս.', ka: 'მიხეილ ს.' },
  'Сергей К.': { ru: 'Сергей К.', en: 'Sergey K.', de: 'Sergej K.', fr: 'Serge K.', es: 'Serguéi K.', ja: 'セルゲイ K.', zh: '谢尔盖 K.', ar: 'سيرغي ك.', ko: '세르게이 K.', kk: 'Сергей К.', hy: 'Սերգեյ Կ.', ka: 'სერგეი კ.' },
  'Азамат К.': { ru: 'Азамат К.', en: 'Azamat K.', de: 'Asamat K.', fr: 'Azamat K.', es: 'Azamat K.', ja: 'アザマト K.', zh: '阿扎马特 K.', ar: 'أزامات ك.', ko: '아자마트 K.', kk: 'Азамат Қ.', hy: 'Ազամատ Կ.', ka: 'აზამატ კ.' },
  'Айпери М.': { ru: 'Айпери М.', en: 'Aiperi M.', de: 'Aiperi M.', fr: 'Aïperi M.', es: 'Aiperi M.', ja: 'アイペリ M.', zh: '艾佩里 M.', ar: 'أيبيري م.', ko: '아이페리 M.', kk: 'Айпері М.', hy: 'Այպերի Մ.', ka: 'აიპერი მ.' },
  'Нурсултан Ж.': { ru: 'Нурсултан Ж.', en: 'Nursultan Zh.', de: 'Nursultan Sch.', fr: 'Noursoultan J.', es: 'Nursultán Zh.', ja: 'ヌルスルタン Zh.', zh: '努尔苏丹 Zh.', ar: 'نورسلطان ج.', ko: '누르술탄 J.', kk: 'Нұрсұлтан Ж.', hy: 'Նուրսուլթան Ժ.', ka: 'ნურსულთან ჟ.' },
  'Зарина В.': { ru: 'Зарина В.', en: 'Zarina V.', de: 'Sarina W.', fr: 'Zarina V.', es: 'Zarina V.', ja: 'ザリナ V.', zh: '扎丽娜 V.', ar: 'زارينا ف.', ko: '자리나 V.', kk: 'Зарина В.', hy: 'Զարինա Վ.', ka: 'ზარინა ვ.' },
  'Тимур А.': { ru: 'Тимур А.', en: 'Timur A.', de: 'Timur A.', fr: 'Timour A.', es: 'Timur A.', ja: 'ティムール A.', zh: '帖木儿 A.', ar: 'تيمور أ.', ko: '티무르 A.', kk: 'Темір А.', hy: 'Թիմուր Ա.', ka: 'თემურ ა.' },
  'Данияр С.': { ru: 'Данияр С.', en: 'Daniyar S.', de: 'Danijar S.', fr: 'Daniyar S.', es: 'Daniyar S.', ja: 'ダニヤル S.', zh: '达尼亚尔 S.', ar: 'دانيار س.', ko: '다니야르 S.', kk: 'Данияр С.', hy: 'Դանիյար Ս.', ka: 'დანიარ ს.' },
  'Армен К.': { ru: 'Армен К.', en: 'Armen K.', de: 'Armen K.', fr: 'Armen K.', es: 'Armen K.', ja: 'アルメン K.', zh: '阿尔门 K.', ar: 'أرمين ك.', ko: '아르멘 K.', kk: 'Армен К.', hy: 'Արմեն Կ.', ka: 'არმენ კ.' },
  'Гульнара Т.': { ru: 'Гульнара Т.', en: 'Gulnara T.', de: 'Gulnara T.', fr: 'Goulnara T.', es: 'Gulnara T.', ja: 'グルナラ T.', zh: '古丽娜拉 T.', ar: 'غولنارا ت.', ko: '굴나라 T.', kk: 'Гүлнара Т.', hy: 'Գուլնարա Տ.', ka: 'გულნარა ტ.' },
  'Alexander W.': { ru: 'Александр В.', en: 'Alexander W.', de: 'Alexander W.', fr: 'Alexandre W.', es: 'Alejandro W.', ja: 'アレクサンダー W.', zh: '亚历山大 W.', ar: 'ألكسندر و.', ko: '알렉산더 W.', kk: 'Александр В.', hy: 'Ալեքսանդր Վ.', ka: 'ალექსანდრ ვ.' },
  'Sophie M.': { ru: 'Софи М.', en: 'Sophie M.', de: 'Sophie M.', fr: 'Sophie M.', es: 'Sofía M.', ja: 'ソフィー M.', zh: '索菲 M.', ar: 'سوفي م.', ko: '소피 M.', kk: 'Софи М.', hy: 'Սոֆի Մ.', ka: 'სოფი მ.' },
  'Lucas B.': { ru: 'Лукас Б.', en: 'Lucas B.', de: 'Lukas B.', fr: 'Lucas B.', es: 'Lucas B.', ja: 'ルーカス B.', zh: '卢卡斯 B.', ar: 'لوكاس ب.', ko: '루카스 B.', kk: 'Лукас Б.', hy: 'Լուկաս Բ.', ka: 'ლუკას ბ.' },
  'Emma K.': { ru: 'Эмма К.', en: 'Emma K.', de: 'Emma K.', fr: 'Emma K.', es: 'Emma K.', ja: 'エマ K.', zh: '艾玛 K.', ar: 'إيما ك.', ko: '엠마 K.', kk: 'Эмма К.', hy: 'Էմմա Կ.', ka: 'ემა კ.' },
  'Carlos R.': { ru: 'Карлос Р.', en: 'Carlos R.', de: 'Carlos R.', fr: 'Carlos R.', es: 'Carlos R.', ja: 'カルロス R.', zh: '卡洛斯 R.', ar: 'كارلوس ر.', ko: '카를로스 R.', kk: 'Карлос Р.', hy: 'Կառլոս Ռ.', ka: 'კარლოს რ.' },
  'Kenji T.': { ru: 'Кэндзи Т.', en: 'Kenji T.', de: 'Kenji T.', fr: 'Kenji T.', es: 'Kenji T.', ja: 'ケンジ T.', zh: '健二 T.', ar: 'كينجي ت.', ko: '겐지 T.', kk: 'Кэндзи Т.', hy: 'Կենջի Տ.', ka: 'კენჯი ტ.' },
  'Mei L.': { ru: 'Мэй Л.', en: 'Mei L.', de: 'Mei L.', fr: 'Mei L.', es: 'Mei L.', ja: 'メイ L.', zh: '美 L.', ar: 'مي ل.', ko: '메이 L.', kk: 'Мэй Л.', hy: 'Մեյ Լ.', ka: 'მეი ლ.' },
  'Amira H.': { ru: 'Амира Х.', en: 'Amira H.', de: 'Amira H.', fr: 'Amira H.', es: 'Amira H.', ja: 'アミラ H.', zh: '阿米拉 H.', ar: 'أميرة ح.', ko: '아미라 H.', kk: 'Амира Х.', hy: 'Ամիրա Հ.', ka: 'ამირა ჰ.' },
  'Пользователь': { ru: 'Пользователь', en: 'User', de: 'Benutzer', fr: 'Utilisateur', es: 'Usuario', ja: 'ユーザー', zh: '用户', ar: 'مستخدم', pt: 'Usuário', it: 'Utente', tr: 'Kullanıcı', ko: '사용자', kk: 'Пайдаланушы', uz: 'Foydalanuvchi', hy: 'Օգտատեր', ka: 'მომხმარებელი', az: 'İstifadəçi' },
  'Гость': { ru: 'Гость', en: 'Guest', de: 'Gast', fr: 'Invité', es: 'Invitado', ja: 'ゲスト', zh: '访客', ar: 'ضيف', pt: 'Convidado', it: 'Ospite', tr: 'Misafir', ko: '게스트', kk: 'Қонақ', uz: 'Mehmon', hy: 'Հյուր', ka: 'სტუმარი', az: 'Qonaq' }
};

export const COURSE_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Общий отзыв о DuoWindo6601': {
    ru: 'Общий отзыв о DuoWindo6601', en: 'General DuoWindo6601 Review', de: 'Allgemeine DuoWindo6601-Bewertung',
    fr: 'Avis général sur DuoWindo6601', es: 'Reseña general de DuoWindo6601', ja: 'DuoWindo6601 総合レビュー',
    zh: 'DuoWindo6601 综合评价', ar: 'تقييم عام حول DuoWindo6601'
  },
  'Казахский язык': {
    ru: 'Казахский язык', en: 'Kazakh Language', de: 'Kasachisch', fr: 'Kazakh', es: 'Idioma kazajo',
    ja: 'カザフ語', zh: '哈萨克语', ar: 'اللغة الكازاخية'
  },
  'Узбекский язык': {
    ru: 'Узбекский язык', en: 'Uzbek Language', de: 'Usbekisch', fr: 'Ouzbek', es: 'Idioma uzbeko',
    ja: 'ウズベク語', zh: '乌兹别克语', ar: 'اللغة الأوزبكية'
  },
  'Армянский язык': {
    ru: 'Армянский язык', en: 'Armenian Language', de: 'Armenisch', fr: 'Arménien', es: 'Idioma armenio',
    ja: 'アルメニア語', zh: '亚美尼亚语', ar: 'اللغة الأرمنية'
  },
  'Английский язык': {
    ru: 'Английский язык', en: 'English Language', de: 'Englisch', fr: 'Anglais', es: 'Idioma inglés',
    ja: '英語', zh: '英语', ar: 'اللغة الإنجليزية'
  },
  'Немецкий язык': {
    ru: 'Немецкий язык', en: 'German Language', de: 'Deutsch', fr: 'Allemand', es: 'Idioma alemán',
    ja: 'ドイツ語', zh: '德语', ar: 'اللغة الألمانية'
  },
  'Французский язык': {
    ru: 'Французский язык', en: 'French Language', de: 'Französisch', fr: 'Français', es: 'Idioma francés',
    ja: 'フランス語', zh: '法语', ar: 'اللغة الفرنسية'
  },
  'Испанский язык': {
    ru: 'Испанский язык', en: 'Spanish Language', de: 'Spanisch', fr: 'Espagnol', es: 'Idioma español',
    ja: 'スペイン語', zh: '西班牙语', ar: 'اللغة الإسبانية'
  },
  'Японский язык': {
    ru: 'Японский язык', en: 'Japanese Language', de: 'Japanisch', fr: 'Japonais', es: 'Idioma japonés',
    ja: '日本語', zh: '日语', ar: 'اللغة اليابانية'
  },
  'Китайский язык': {
    ru: 'Китайский язык', en: 'Chinese Language', de: 'Chinesisch', fr: 'Chinois', es: 'Idioma chino',
    ja: '中国語', zh: '汉语', ar: 'اللغة الصينية'
  },
  'Арабский язык': {
    ru: 'Арабский язык', en: 'Arabic Language', de: 'Arabisch', fr: 'Arabe', es: 'Idioma árabe',
    ja: 'アラビア語', zh: '阿拉伯语', ar: 'اللغة العربية'
  },
  'Шахматы (Предмет / Игра, не язык)': {
    ru: 'Шахматы (Предмет / Игра, не язык)', en: 'Chess (Subject / Game, non-language)',
    de: 'Schach (Fach / Spiel, keine Sprache)', fr: 'Échecs (Matière / Jeu)', es: 'Ajedrez (Asignatura / Juego)',
    ja: 'チェス（教科・ゲーム）', zh: '国际象棋（学科/游戏）', ar: 'الشطرنج (مادة / لعبة)'
  },
  'Математика': {
    ru: 'Математика', en: 'Mathematics', de: 'Mathematik', fr: 'Mathématiques', es: 'Matemáticas',
    ja: '数学', zh: '数学', ar: 'الرياضيات'
  },
  'Музыка': {
    ru: 'Музыка', en: 'Music', de: 'Musik', fr: 'Musique', es: 'Música',
    ja: '音楽', zh: '音乐', ar: 'الموسيقى'
  },
  'Приложение DuoWindo6601 PWA': {
    ru: 'Приложение DuoWindo6601 PWA', en: 'DuoWindo6601 PWA App', de: 'DuoWindo6601 PWA-App',
    fr: 'Application DuoWindo6601 PWA', es: 'Aplicación DuoWindo6601 PWA', ja: 'DuoWindo6601 PWAアプリ',
    zh: 'DuoWindo6601 PWA 应用', ar: 'تطبيق DuoWindo6601 PWA'
  }
};

const CYR_TO_LAT: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ә': 'a', 'ғ': 'gh', 'қ': 'q', 'ң': 'ng', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 'һ': 'h', 'і': 'i'
};

const LAT_DIGRAPH_TO_CYR: [RegExp, string][] = [
  [/shch/gi, 'щ'], [/zh/gi, 'ж'], [/kh/gi, 'х'], [/ts/gi, 'ц'], [/ch/gi, 'ч'],
  [/sh/gi, 'ш'], [/yu/gi, 'ю'], [/ya/gi, 'я'], [/yo/gi, 'ё'], [/ph/gi, 'ф'], [/th/gi, 'т']
];

const LAT_TO_CYR: Record<string, string> = {
  'a': 'а', 'b': 'б', 'c': 'к', 'd': 'д', 'e': 'е', 'f': 'ф', 'g': 'г', 'h': 'х',
  'i': 'и', 'j': 'дж', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п',
  'q': 'к', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс',
  'y': 'и', 'z': 'з'
};

const LAT_SYLLABLE_TO_KATAKANA: Record<string, string> = {
  ka: 'カ', ki: 'キ', ku: 'ク', ke: 'ケ', ko: 'コ',
  sa: 'サ', si: 'シ', shi: 'シ', su: 'ス', se: 'セ', so: 'ソ',
  ta: 'タ', ti: 'チ', chi: 'チ', tu: 'ツ', tsu: 'ツ', te: 'テ', to: 'ト',
  na: 'ナ', ni: 'ニ', nu: 'ヌ', ne: 'ネ', no: 'ノ',
  ha: 'ハ', hi: 'ヒ', hu: 'フ', fu: 'フ', he: 'ヘ', ho: 'ホ',
  ma: 'マ', mi: 'ミ', mu: 'ム', me: 'メ', mo: 'モ',
  ya: 'ヤ', yu: 'ユ', yo: 'ヨ',
  ra: 'ラ', ri: 'リ', ru: 'ル', re: 'レ', ro: 'ロ',
  wa: 'ワ', wi: 'ウィ', we: 'ウェ', wo: 'ウォ',
  ga: 'ガ', gi: 'ギ', gu: 'グ', ge: 'ゲ', go: 'ゴ',
  za: 'ザ', zi: 'ジ', ji: 'ジ', zu: 'ズ', ze: 'ゼ', zo: 'ゾ',
  da: 'ダ', di: 'ディ', du: 'ドゥ', de: 'デ', do: 'ド',
  ba: 'バ', bi: 'ビ', bu: 'ブ', be: 'ベ', bo: 'ボ',
  pa: 'パ', pi: 'ピ', pu: 'プ', pe: 'ペ', po: 'ポ',
  va: 'ヴァ', vi: 'ヴィ', vu: 'ヴ', ve: 'ヴェ', vo: 'ヴォ',
  fa: 'ファ', fi: 'フィ', fe: 'フェ', fo: 'フォ',
  ja: 'ジャ', ju: 'ジュ', jo: 'ジョ',
  sha: 'シャ', shu: 'シュ', sho: 'ショ',
  cha: 'チャ', chu: 'チュ', cho: 'チョ',
  a: 'ア', i: 'イ', u: 'ウ', e: 'エ', o: 'オ',
  k: 'ク', s: 'ス', t: 'ト', n: 'ン', h: 'フ', m: 'ム', r: 'ル',
  g: 'グ', z: 'ズ', d: 'ド', b: 'ブ', p: 'プ', v: 'ヴ', f: 'フ', l: 'ル', w: 'ウ', y: 'イ'
};

const LAT_TO_ARABIC: Record<string, string> = {
  a: 'ا', b: 'ب', c: 'ك', d: 'د', e: 'ي', f: 'ف', g: 'غ', h: 'ه', i: 'ي',
  j: 'ج', k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'ب', q: 'ق', r: 'ر',
  s: 'س', t: 'ت', u: 'و', v: 'ف', w: 'و', x: 'كس', y: 'ي', z: 'ز'
};

const LAT_TO_ARMENIAN: Record<string, string> = {
  a: 'ա', b: 'բ', c: 'կ', d: 'դ', e: 'ե', f: 'ֆ', g: 'գ', h: 'հ', i: 'ի',
  j: 'ջ', k: 'կ', l: 'լ', m: 'մ', n: 'ն', o: 'ո', p: 'պ', q: 'ք', r: 'ր',
  s: 'ս', t: 'տ', u: 'ու', v: 'վ', w: 'վ', x: 'քս', y: 'յ', z: 'զ'
};

const LAT_TO_GEORGIAN: Record<string, string> = {
  a: 'ა', b: 'ბ', c: 'კ', d: 'დ', e: 'ე', f: 'ფ', g: 'გ', h: 'ჰ', i: 'ი',
  j: 'ჯ', k: 'კ', l: 'ლ', m: 'მ', n: 'ნ', o: 'ო', p: 'პ', q: 'ქ', r: 'რ',
  s: 'ს', t: 'ტ', u: 'უ', v: 'ვ', w: 'ვ', x: 'ქს', y: 'ი', z: 'ზ'
};

function preserveCase(orig: string, mapped: string): string {
  if (!mapped) return mapped;
  if (orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
    return mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return mapped;
}

export function cyrillicToLatin(text: string): string {
  let out = '';
  for (const ch of text) {
    const low = ch.toLowerCase();
    if (low in CYR_TO_LAT) {
      out += preserveCase(ch, CYR_TO_LAT[low]);
    } else {
      out += ch;
    }
  }
  return out;
}

export function latinToCyrillic(text: string): string {
  let s = text;
  for (const [rx, rep] of LAT_DIGRAPH_TO_CYR) {
    s = s.replace(rx, (m) => preserveCase(m[0], rep));
  }
  let out = '';
  for (const ch of s) {
    const low = ch.toLowerCase();
    if (low in LAT_TO_CYR) {
      out += preserveCase(ch, LAT_TO_CYR[low]);
    } else {
      out += ch;
    }
  }
  return out;
}

function latinToKatakana(text: string): string {
  const lower = text.toLowerCase();
  let i = 0;
  let out = '';
  while (i < lower.length) {
    if (!/[a-z]/.test(lower[i])) {
      out += text[i];
      i += 1;
      continue;
    }
    const three = lower.slice(i, i + 3);
    const two = lower.slice(i, i + 2);
    const one = lower[i];
    if (LAT_SYLLABLE_TO_KATAKANA[three]) {
      out += LAT_SYLLABLE_TO_KATAKANA[three];
      i += 3;
    } else if (LAT_SYLLABLE_TO_KATAKANA[two]) {
      out += LAT_SYLLABLE_TO_KATAKANA[two];
      i += 2;
    } else if (LAT_SYLLABLE_TO_KATAKANA[one]) {
      out += LAT_SYLLABLE_TO_KATAKANA[one];
      i += 1;
    } else {
      i += 1;
    }
  }
  return out;
}

function mapLatinByCharTable(text: string, table: Record<string, string>, capitalizeArmenian: boolean = false): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const low = ch.toLowerCase();
    if (table[low]) {
      const mapped = table[low];
      out += capitalizeArmenian && ch !== low ? mapped.toUpperCase() : mapped;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Deterministic author name transliteration/adaptation for ANY user-submitted or custom name
 * when it is not yet in the curated dictionary or AI name cache.
 */
export function transliterateNameForTarget(name: string, targetLang: string): string {
  const clean = (name || '').trim();
  if (!clean) return clean;

  const hasCyrillic = /[\u0400-\u04FF]/.test(clean);
  const latinized = hasCyrillic ? cyrillicToLatin(clean) : clean;

  if (targetLang === 'ru' || targetLang === 'kk') {
    return hasCyrillic ? clean : latinToCyrillic(clean);
  }
  if (targetLang === 'ja') {
    // Keep initials as Latin if 1 letter followed by dot
    return latinized.replace(/\b([A-Za-z]{2,})\b/g, (word) => latinToKatakana(word));
  }
  if (targetLang === 'ar') {
    return latinized.replace(/\b([A-Za-z]+)\b/g, (word) => mapLatinByCharTable(word, LAT_TO_ARABIC));
  }
  if (targetLang === 'hy') {
    return latinized.replace(/\b([A-Za-z]+)\b/g, (word) => mapLatinByCharTable(word, LAT_TO_ARMENIAN, true));
  }
  if (targetLang === 'ka') {
    return latinized.replace(/\b([A-Za-z]+)\b/g, (word) => mapLatinByCharTable(word, LAT_TO_GEORGIAN));
  }
  // Latin-script languages (en, de, fr, es, pt, it, tr, pl, id, uz, az, vi)
  return latinized;
}

export function loadStoredTranslationCache(): Record<string, string> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(TEXT_CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredTranslationCache(cache: Record<string, string>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    // Keep cache bounded cleanly to the latest 400 entries
    const entries = Object.entries(cache);
    const trimmed = entries.length > 400 ? Object.fromEntries(entries.slice(-400)) : cache;
    localStorage.setItem(TEXT_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function loadStoredNameCache(): Record<string, string> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(NAME_CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredNameCache(cache: Record<string, string>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const entries = Object.entries(cache);
    const trimmed = entries.length > 400 ? Object.fromEntries(entries.slice(-400)) : cache;
    localStorage.setItem(NAME_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function getNameCacheKey(name: string, targetLang: string): string {
  return `${name.trim()}__${targetLang}`;
}

export function getTextCacheKey(text: string, targetLang: string): string {
  return `${text.trim()}__${targetLang}`;
}

/**
 * Translates an author's name into targetLang using:
 * 1) Admin title dictionary if admin
 * 2) Exact dictionary (all 32 built-in names across languages)
 * 3) AI cached translations (`nameCache`)
 * 4) Deterministic transliterator (`transliterateNameForTarget`)
 */
export function resolveTranslatedAuthorName(
  name: string,
  targetLang: string,
  isAdmin?: boolean,
  nameCache?: Record<string, string>
): string {
  const clean = (name || '').trim();
  if (!clean) return ADMIN_TITLE_TRANSLATIONS[targetLang] || clean;

  if (
    isAdmin ||
    clean.includes('Администратор') ||
    clean.includes('Administrator') ||
    clean.includes('Админ DuoWindo6601') ||
    clean.includes('مسؤول') ||
    clean.includes('管理者') ||
    clean.includes('管理员')
  ) {
    return ADMIN_TITLE_TRANSLATIONS[targetLang] || ADMIN_TITLE_TRANSLATIONS['en'] || ADMIN_TITLE_TRANSLATIONS['ru'];
  }

  // Exact match on key OR reverse match against any language variant in FULL_NAME_DICTIONARY
  if (FULL_NAME_DICTIONARY[clean]?.[targetLang]) {
    return FULL_NAME_DICTIONARY[clean][targetLang];
  }
  for (const variants of Object.values(FULL_NAME_DICTIONARY)) {
    if (Object.values(variants).includes(clean) && variants[targetLang]) {
      return variants[targetLang];
    }
  }

  const cKey = getNameCacheKey(clean, targetLang);
  if (nameCache?.[cKey]) {
    return nameCache[cKey];
  }

  return transliterateNameForTarget(clean, targetLang);
}

/**
 * Smart offline dictionary/phrase translator for DuoWindo6601 review strings,
 * course names, and common expressions when AI batch translation is offline or pending.
 */
export function translateTextOfflineFallback(
  text: string,
  targetLang: string,
  textCache?: Record<string, string>
): string {
  const clean = (text || '').trim();
  if (!clean) return text;

  if (COURSE_NAME_TRANSLATIONS[clean]?.[targetLang]) {
    return COURSE_NAME_TRANSLATIONS[clean][targetLang];
  }

  const cKey = getTextCacheKey(clean, targetLang);
  if (textCache?.[cKey]) {
    return textCache[cKey];
  }

  // Phrase-level clean dictionary substitutions when targetLang is non-Russian or Russian
  const phrasePairs: Record<string, Record<string, string>> = {
    'отличное приложение': { en: 'great app', de: 'tolle App', fr: 'excellente application', es: 'excelente aplicación', ja: '素晴らしいアプリ', zh: '很棒的应用', ar: 'تطبيق رائع' },
    'работают отлично': { en: 'work great', de: 'funktionieren großartig', fr: 'fonctionnent parfaitement', es: 'funcionan genial', ja: '完璧に動作します', zh: '运行非常流畅', ar: 'تعمل بشكل ممتاز' },
    'очень удобно': { en: 'very convenient', de: 'sehr praktisch', fr: 'très pratique', es: 'muy práctico', ja: 'とても便利です', zh: '非常方便', ar: 'مريح جداً' },
    'спасибо за отзыв': { en: 'thank you for the review', de: 'vielen Dank für die Bewertung', fr: 'merci pour votre avis', es: 'gracias por tu reseña', ja: 'レビューありがとうございます', zh: '感谢您的评价', ar: 'شكراً لتقييمك' },
    'приятного обучения': { en: 'happy learning', de: 'viel Spaß beim Lernen', fr: 'bon apprentissage', es: 'feliz aprendizaje', ja: '楽しく学習しましょう', zh: '祝学习愉快', ar: 'تعلّم ممتع' },
    'курс': { en: 'course', de: 'Kurs', fr: 'cours', es: 'curso', ja: 'コース', zh: '课程', ar: 'دورة' },
    'отзыв': { en: 'review', de: 'Bewertung', fr: 'avis', es: 'reseña', ja: 'レビュー', zh: '评价', ar: 'تقييم' }
  };

  let transformed = clean;
  let matchedAny = false;
  for (const [src, targets] of Object.entries(phrasePairs)) {
    if (targets[targetLang]) {
      const rx = new RegExp(src, 'gi');
      if (rx.test(transformed)) {
        transformed = transformed.replace(rx, targets[targetLang]);
        matchedAny = true;
      }
    }
  }
  if (matchedAny) return transformed;

  return clean;
}

export interface FeedbackBatchTranslateRequest {
  texts: string[];
  names: string[];
  targetLang: string;
  targetLangName: string;
}

export interface FeedbackBatchTranslateResult {
  texts: Record<string, string>;
  names: Record<string, string>;
}

function extractJsonSafe(raw: string): any {
  const stripped = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!stripped) return undefined;
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Batch-translates arbitrary user reviews, admin comments, course titles, categories,
 * and author names into `targetLang` using Gemini on the server, falling back cleanly
 * to local transliteration / phrase glossary on error.
 */
export async function translateFeedbackBatchWithAI(
  req: FeedbackBatchTranslateRequest
): Promise<FeedbackBatchTranslateResult> {
  const uniqueTexts = Array.from(new Set(req.texts.map((t) => t.trim()).filter(Boolean))).slice(0, 24);
  const uniqueNames = Array.from(new Set(req.names.map((n) => n.trim()).filter(Boolean))).slice(0, 24);

  const fallbackResult: FeedbackBatchTranslateResult = { texts: {}, names: {} };
  for (const t of uniqueTexts) {
    fallbackResult.texts[t] = translateTextOfflineFallback(t, req.targetLang);
  }
  for (const n of uniqueNames) {
    fallbackResult.names[n] = resolveTranslatedAuthorName(n, req.targetLang);
  }

  if (uniqueTexts.length === 0 && uniqueNames.length === 0) {
    return fallbackResult;
  }

  const prompt = `Translate the following user reviews, admin replies, course titles, and author names into ${req.targetLangName} (ISO language code: "${req.targetLang}").
Rules:
1. Keep brand names "DuoWindo6601" and emojis unchanged.
2. For author names ("names" array), naturally localize or transliterate each person's name and initial into the ${req.targetLangName} alphabet/script.
3. Preserve meaning accurately and naturally in ${req.targetLangName}.
4. Return ONLY valid JSON with arrays in the exact same order and length as input:
{
  "translatedTexts": ["..."],
  "translatedNames": ["..."]
}

Input "texts": ${JSON.stringify(uniqueTexts)}
Input "names": ${JSON.stringify(uniqueNames)}`;

  try {
    const res = await callServerGemini({
      model: MODEL_FREE,
      prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2 }
    });

    const parsed =
      (res?.data && typeof res.data === 'object' ? res.data : undefined) ||
      extractJsonSafe(res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text || '');

    if (!parsed || typeof parsed !== 'object') {
      return fallbackResult;
    }

    const out: FeedbackBatchTranslateResult = { texts: {}, names: {} };
    const tArr = Array.isArray(parsed.translatedTexts) ? parsed.translatedTexts : [];
    const nArr = Array.isArray(parsed.translatedNames) ? parsed.translatedNames : [];

    uniqueTexts.forEach((orig, idx) => {
      const candidate = typeof tArr[idx] === 'string' && tArr[idx].trim() ? tArr[idx].trim() : fallbackResult.texts[orig];
      out.texts[orig] = candidate;
    });

    uniqueNames.forEach((orig, idx) => {
      const candidate = typeof nArr[idx] === 'string' && nArr[idx].trim() ? nArr[idx].trim() : fallbackResult.names[orig];
      out.names[orig] = candidate;
    });

    return out;
  } catch (err) {
    console.warn('Batch feedback translation using offline fallback:', err);
    return fallbackResult;
  }
}

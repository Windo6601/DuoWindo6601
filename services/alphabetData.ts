export interface AlphabetItem {
  char: string;
  name: string;
  sound: string;
  word?: string;
  translation?: string;
  category?: string;
  tips?: string;
  translit?: string;
}

export interface AlphabetCategory {
  title: string;
  description?: string;
  script?: 'cyrillic' | 'latin' | 'arabic' | 'georgian' | 'armenian' | 'special';
  items: (string | AlphabetItem)[];
}

export const CIS_ALPHABET_DATA: Record<string, AlphabetCategory[]> = {
  // 0. Russian / Русский
  'ru': [
    {
      title: 'Русская кириллица (33)',
      description: 'Полный русский алфавит (Кириллица)',
      script: 'cyrillic',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Арбуз', translation: 'Watermelon / Арбуз', translit: 'A' },
        { char: 'Б', name: 'бэ', sound: '[b]', word: 'Бабочка', translation: 'Butterfly / Бабочка', translit: 'B' },
        { char: 'В', name: 'вэ', sound: '[v]', word: 'Вода', translation: 'Water / Вода', translit: 'V' },
        { char: 'Г', name: 'гэ', sound: '[ɡ]', word: 'Город', translation: 'City / Город', translit: 'G' },
        { char: 'Д', name: 'дэ', sound: '[d]', word: 'Дом', translation: 'House / Дом', translit: 'D' },
        { char: 'Е', name: 'е', sound: '[je]/[e]', word: 'Ель', translation: 'Spruce / Ель', translit: 'E' },
        { char: 'Ё', name: 'ё', sound: '[jo]', word: 'Ёжик', translation: 'Hedgehog / Ёжик', translit: 'Yo' },
        { char: 'Ж', name: 'жэ', sound: '[ʐ]', word: 'Жизнь', translation: 'Life / Жизнь', translit: 'Zh' },
        { char: 'З', name: 'зэ', sound: '[z]', word: 'Звезда', translation: 'Star / Звезда', translit: 'Z' },
        { char: 'И', name: 'и', sound: '[i]', word: 'Игра', translation: 'Game / Игра', translit: 'I' },
        { char: 'Й', name: 'и краткое', sound: '[j]', word: 'Йогурт', translation: 'Yogurt / Йогурт', translit: 'Y' },
        { char: 'К', name: 'ка', sound: '[k]', word: 'Книга', translation: 'Book / Книга', translit: 'K' },
        { char: 'Л', name: 'эль', sound: '[l]', word: 'Луна', translation: 'Moon / Луна', translit: 'L' },
        { char: 'М', name: 'эм', sound: '[m]', word: 'Море', translation: 'Sea / Море', translit: 'M' },
        { char: 'Н', name: 'эн', sound: '[n]', word: 'Небо', translation: 'Sky / Небо', translit: 'N' },
        { char: 'О', name: 'о', sound: '[o]', word: 'Озеро', translation: 'Lake / Озеро', translit: 'O' },
        { char: 'П', name: 'пэ', sound: '[p]', word: 'Поезд', translation: 'Train / Поезд', translit: 'P' },
        { char: 'Р', name: 'эр', sound: '[r]', word: 'Река', translation: 'River / Река', translit: 'R' },
        { char: 'С', name: 'эс', sound: '[s]', word: 'Солнце', translation: 'Sun / Солнце', translit: 'S' },
        { char: 'Т', name: 'тэ', sound: '[t]', word: 'Тигр', translation: 'Tiger / Тигр', translit: 'T' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Утро', translation: 'Morning / Утро', translit: 'U' },
        { char: 'Ф', name: 'эф', sound: '[f]', word: 'Флаг', translation: 'Flag / Флаг', translit: 'F' },
        { char: 'Х', name: 'ха', sound: '[x]', word: 'Хлеб', translation: 'Bread / Хлеб', translit: 'Kh' },
        { char: 'Ц', name: 'цэ', sound: '[ts]', word: 'Цветок', translation: 'Flower / Цветок', translit: 'Ts' },
        { char: 'Ч', name: 'че', sound: '[tɕ]', word: 'Чай', translation: 'Tea / Чай', translit: 'Ch' },
        { char: 'Ш', name: 'ша', sound: '[ʂ]', word: 'Школа', translation: 'School / Школа', translit: 'Sh' },
        { char: 'Щ', name: 'ща', sound: '[ɕː]', word: 'Щит', translation: 'Shield / Щит', translit: 'Shch' },
        { char: 'Ъ', name: 'твёрдый знак', sound: '[-]', word: 'Подъезд', translation: 'Entrance / Подъезд', translit: 'ʺ' },
        { char: 'Ы', name: 'ы', sound: '[ɨ]', word: 'Мышь', translation: 'Mouse / Мышь', translit: 'Y' },
        { char: 'Ь', name: 'мягкий знак', sound: '[-]', word: 'День', translation: 'Day / День', translit: 'ʹ' },
        { char: 'Э', name: 'э', sound: '[ɛ]', word: 'Экран', translation: 'Screen / Экран', translit: 'E' },
        { char: 'Ю', name: 'ю', sound: '[ju]', word: 'Юг', translation: 'South / Юг', translit: 'Yu' },
        { char: 'Я', name: 'я', sound: '[ja]', word: 'Яблоко', translation: 'Apple / Яблоко', translit: 'Ya' }
      ]
    },
    {
      title: 'Латинская транслитерация (BGN / ISO)',
      description: 'Russian Latin Transliteration for international learners',
      script: 'latin',
      items: [
        { char: 'A', name: 'A (А)', sound: '[a]', word: 'Arbuz', translation: 'Watermelon / Арбуз' },
        { char: 'B', name: 'B (Б)', sound: '[b]', word: 'Babochka', translation: 'Butterfly / Бабочка' },
        { char: 'V', name: 'V (В)', sound: '[v]', word: 'Voda', translation: 'Water / Вода' },
        { char: 'G', name: 'G (Г)', sound: '[ɡ]', word: 'Gorod', translation: 'City / Город' },
        { char: 'D', name: 'D (Д)', sound: '[d]', word: 'Dom', translation: 'House / Дом' },
        { char: 'E', name: 'E (Е)', sound: '[je]/[e]', word: 'El', translation: 'Spruce / Ель' },
        { char: 'Yo', name: 'Yo (Ё)', sound: '[jo]', word: 'Yozhik', translation: 'Hedgehog / Ёжик' },
        { char: 'Zh', name: 'Zh (Ж)', sound: '[ʐ]', word: 'Zhizn', translation: 'Life / Жизнь' },
        { char: 'Z', name: 'Z (З)', sound: '[z]', word: 'Zvezda', translation: 'Star / Звезда' },
        { char: 'I', name: 'I (И)', sound: '[i]', word: 'Igra', translation: 'Game / Игра' },
        { char: 'Y', name: 'Y (Й/Ы)', sound: '[j]/[ɨ]', word: 'Yogurt', translation: 'Yogurt / Йогурт' },
        { char: 'K', name: 'K (К)', sound: '[k]', word: 'Kniga', translation: 'Book / Книга' },
        { char: 'L', name: 'L (Л)', sound: '[l]', word: 'Luna', translation: 'Moon / Луна' },
        { char: 'M', name: 'M (М)', sound: '[m]', word: 'More', translation: 'Sea / Море' },
        { char: 'N', name: 'N (Н)', sound: '[n]', word: 'Nebo', translation: 'Sky / Небо' },
        { char: 'O', name: 'O (О)', sound: '[o]', word: 'Ozero', translation: 'Lake / Озеро' },
        { char: 'P', name: 'P (П)', sound: '[p]', word: 'Poezd', translation: 'Train / Поезд' },
        { char: 'R', name: 'R (Р)', sound: '[r]', word: 'Reka', translation: 'River / Река' },
        { char: 'S', name: 'S (С)', sound: '[s]', word: 'Solntse', translation: 'Sun / Солнце' },
        { char: 'T', name: 'T (Т)', sound: '[t]', word: 'Tigr', translation: 'Tiger / Тигр' },
        { char: 'U', name: 'U (У)', sound: '[u]', word: 'Utro', translation: 'Morning / Утро' },
        { char: 'F', name: 'F (Ф)', sound: '[f]', word: 'Flag', translation: 'Flag / Флаг' },
        { char: 'Kh', name: 'Kh (Х)', sound: '[x]', word: 'Khleb', translation: 'Bread / Хлеб' },
        { char: 'Ts', name: 'Ts (Ц)', sound: '[ts]', word: 'Tsvetok', translation: 'Flower / Цветок' },
        { char: 'Ch', name: 'Ch (Ч)', sound: '[tɕ]', word: 'Chay', translation: 'Tea / Чай' },
        { char: 'Sh', name: 'Sh (Ш)', sound: '[ʂ]', word: 'Shkola', translation: 'School / Школа' },
        { char: 'Shch', name: 'Shch (Щ)', sound: '[ɕː]', word: 'Shchit', translation: 'Shield / Щит' },
        { char: 'Yu', name: 'Yu (Ю)', sound: '[ju]', word: 'Yug', translation: 'South / Юг' },
        { char: 'Ya', name: 'Ya (Я)', sound: '[ja]', word: 'Yabloko', translation: 'Apple / Яблоко' }
      ]
    }
  ],

  // 1. Belarusian / Белорусский
  'be': [
    {
      title: 'Увесь алфавіт (32)',
      description: 'Беларускі алфавіт на аснове кірыліцы',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Арэлі', translation: 'Качели', tips: 'Две наклонные линии и горизонтальная перемычка' },
        { char: 'Б', name: 'бэ', sound: '[b]', word: 'Бульба', translation: 'Картофель', tips: 'Вертикальная черта, верхний хвостик и нижний полукруг' },
        { char: 'В', name: 'вэ', sound: '[v]', word: 'Возера', translation: 'Озеро', tips: 'Вертикаль и два правых полукруга' },
        { char: 'Г', name: 'гэ', sound: '[ɣ] (мягкое г)', word: 'Гара', translation: 'Гора', tips: 'Вертикальная стойка и верхняя перекладина' },
        { char: 'Д', name: 'дэ', sound: '[d]', word: 'Дрэва', translation: 'Дерево', tips: 'Трапеция на ножках' },
        { char: 'Е', name: 'е', sound: '[je]', word: 'Ежа', translation: 'Еда', tips: 'Вертикаль и три горизонтальные полосы' },
        { char: 'Ё', name: 'ё', sound: '[jo]', word: 'Ёлка', translation: 'Ёлка', tips: 'Буква Е с двумя точками сверху' },
        { char: 'Ж', name: 'жэ', sound: '[ʐ]', word: 'Жыццё', translation: 'Жизнь', tips: 'Крест с вертикалью и боковыми дугами' },
        { char: 'З', name: 'зэ', sound: '[z]', word: 'Зорка', translation: 'Звезда', tips: 'Два округлых правых изгиба' },
        { char: 'І', name: 'і', sound: '[i]', word: 'Ірыс', translation: 'Ирис', tips: 'Прямая вертикальная линия (вместо русской И)' },
        { char: 'Й', name: 'і нескладовае', sound: '[j]', word: 'Йод', translation: 'Йод', tips: 'Буква И с дужкой-краткой' },
        { char: 'К', name: 'ка', sound: '[k]', word: 'Кот', translation: 'Кот', tips: 'Вертикаль и правый угол' },
        { char: 'Л', name: 'эл', sound: '[l]', word: 'Лес', translation: 'Лес', tips: 'Плавный шалашик' },
        { char: 'М', name: 'эм', sound: '[m]', word: 'Мова', translation: 'Язык', tips: 'Две вертикали и центральный угол' },
        { char: 'Н', name: 'эн', sound: '[n]', word: 'Неба', translation: 'Небо', tips: 'Две стойки и горизонталь посредине' },
        { char: 'О', name: 'о', sound: '[o]', word: 'Восень', translation: 'Осень', tips: 'Плавный замкнутый овал' },
        { char: 'П', name: 'пэ', sound: '[p]', word: 'Песня', translation: 'Песня', tips: 'П-образная арка' },
        { char: 'Р', name: 'эр', sound: '[r]', word: 'Радзіма', translation: 'Родина', tips: 'Вертикаль и верхний полукруг' },
        { char: 'С', name: 'эс', sound: '[s]', word: 'Сонца', translation: 'Солнце', tips: 'Округлый левый полумесяц' },
        { char: 'Т', name: 'тэ', sound: '[t]', word: 'Тата', translation: 'Папа', tips: 'Горизонтальная крыша и центральная стойка' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Урок', translation: 'Урок', tips: 'Левая короткая и правая длинная диагонали' },
        { char: 'Ў', name: 'у нескладовае', sound: '[w] (как в wow)', word: 'Ўчора', translation: 'Вчера', tips: 'Буква У со специальной дужкой сверху' },
        { char: 'Ф', name: 'эф', sound: '[f]', word: 'Фарба', translation: 'Краска', tips: 'Вертикаль и два симметричных овала' },
        { char: 'Х', name: 'ха', sound: '[x]', word: 'Хлеб', translation: 'Хлеб', tips: 'Две пересекающиеся диагонали' },
        { char: 'Ц', name: 'цэ', sound: '[ts]', word: 'Цягнік', translation: 'Поезд', tips: 'Буква П с нижним правым хвостиком' },
        { char: 'Ч', name: 'чэ', sound: '[tʃ]', word: 'Чалавек', translation: 'Человек', tips: 'Верхняя чашечка и правая ножка' },
        { char: 'Ш', name: 'ша', sound: '[ʂ]', word: 'Школа', translation: 'Школа', tips: 'Три вертикали на горизонтальном основании' },
        { char: 'Ы', name: 'ы', sound: '[ɨ]', word: 'Мы', translation: 'Мы', tips: 'Мягкий знак и отдельная палочка справа' },
        { char: 'Ь', name: 'мяккі знак', sound: '[-] (смягчение)', word: 'Дзень', translation: 'День', tips: 'Вертикаль и нижний полукруг' },
        { char: 'Э', name: 'э', sound: '[ɛ]', word: 'Эпоха', translation: 'Эпоха', tips: 'Обратный полумесяц с язычком' },
        { char: 'Ю', name: 'ю', sound: '[ju]', word: 'Юнацтва', translation: 'Юность', tips: 'Вертикаль, перемычка и овал' },
        { char: 'Я', name: 'я', sound: '[ja]', word: 'Яблык', translation: 'Яблоко', tips: 'Зеркальная буква Р с наклонной ножкой' }
      ]
    },
    {
      title: 'Асаблівыя літары і спалучэнні',
      description: 'Унікальныя літары беларускай мовы',
      items: [
        { char: 'Ў', name: 'у нескладовае', sound: '[w]', word: 'Кахаў', translation: 'Любил', tips: 'Главный графический символ белорусского языка' },
        { char: 'І', name: 'і дзесяцярычнае', sound: '[i]', word: 'Краіна', translation: 'Страна', tips: 'Пишется как латинская I' },
        { char: 'ДЖ', name: 'дыграф дж', sound: '[dʐ]', word: 'Джала', translation: 'Жало', tips: 'Слитный неделимый звук' },
        { char: 'ДЗ', name: 'дыграф дз', sound: '[dz]', word: 'Дзень', translation: 'День', tips: 'Звонкий мягкий звук' },
        { char: '’', name: 'апостраф', sound: '[разделитель]', word: 'Сям’я', translation: 'Семья', tips: 'Верхняя запятая' }
      ]
    }
  ],

  // 2. Ukrainian / Украинский
  'uk': [
    {
      title: 'Українська абетка (33)',
      description: 'Повний склад українського алфавіту',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Автобус', translation: 'Автобус' },
        { char: 'Б', name: 'бе', sound: '[b]', word: 'Бджола', translation: 'Пчела' },
        { char: 'В', name: 'ве', sound: '[v]', word: 'Воля', translation: 'Свобода' },
        { char: 'Г', name: 'ге', sound: '[ɦ] (гортанное)', word: 'Голос', translation: 'Голос' },
        { char: 'Ґ', name: 'ґе', sound: '[ɡ] (твердое г)', word: 'Ґанок', translation: 'Крыльцо', tips: 'Буква Г с верхним загнутым рожком' },
        { char: 'Д', name: 'де', sound: '[d]', word: 'Дім', translation: 'Дом' },
        { char: 'Е', name: 'е', sound: '[e]', word: 'Епоха', translation: 'Эпоха' },
        { char: 'Є', name: 'є', sound: '[je]', word: 'Єдність', translation: 'Единство', tips: 'Округлая дуга с горизонтальным язычком' },
        { char: 'Ж', name: 'же', sound: '[ʒ]', word: 'Життя', translation: 'Жизнь' },
        { char: 'З', name: 'зе', sound: '[z]', word: 'Земля', translation: 'Земля' },
        { char: 'И', name: 'и', sound: '[ɪ] (твердое и)', word: 'Книга', translation: 'Книга' },
        { char: 'І', name: 'і', sound: '[i]', word: 'Іскра', translation: 'Искра', tips: 'Вертикальная палочка' },
        { char: 'Ї', name: 'ї', sound: '[ji]', word: 'Їжак', translation: 'Ёж', tips: 'Буква І с двумя точками сверху' },
        { char: 'Й', name: 'йот', sound: '[j]', word: 'Йогурт', translation: 'Йогурт' },
        { char: 'К', name: 'ка', sound: '[k]', word: 'Калина', translation: 'Калина' },
        { char: 'Л', name: 'ел', sound: '[l]', word: 'Любов', translation: 'Любовь' },
        { char: 'М', name: 'ем', sound: '[m]', word: 'Мама', translation: 'Мама' },
        { char: 'Н', name: 'ен', sound: '[n]', word: 'Небо', translation: 'Небо' },
        { char: 'О', name: 'о', sound: '[o]', word: 'Озеро', translation: 'Озеро' },
        { char: 'П', name: 'пе', sound: '[p]', word: 'Пісня', translation: 'Песня' },
        { char: 'Р', name: 'ер', sound: '[r]', word: 'Радість', translation: 'Радость' },
        { char: 'С', name: 'ес', sound: '[s]', word: 'Сонце', translation: 'Солнце' },
        { char: 'Т', name: 'те', sound: '[t]', word: 'Тепло', translation: 'Тепло' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Усмішка', translation: 'Улыбка' },
        { char: 'Ф', name: 'еф', sound: '[f]', word: 'Фарба', translation: 'Краска' },
        { char: 'Х', name: 'ха', sound: '[x]', word: 'Хліб', translation: 'Хлеб' },
        { char: 'Ц', name: 'це', sound: '[ts]', word: 'Цукор', translation: 'Сахар' },
        { char: 'Ч', name: 'че', sound: '[tʃ]', word: 'Чай', translation: 'Чай' },
        { char: 'Ш', name: 'ша', sound: '[ʃ]', word: 'Шлях', translation: 'Путь' },
        { char: 'Щ', name: 'ща', sound: '[ʃtʃ]', word: 'Щастя', translation: 'Счастье' },
        { char: 'Ь', name: 'м’який знак', sound: '[-]', word: 'Кінь', translation: 'Конь' },
        { char: 'Ю', name: 'ю', sound: '[ju]', word: 'Юнак', translation: 'Юноша' },
        { char: 'Я', name: 'я', sound: '[ja]', word: 'Яблуко', translation: 'Яблоко' }
      ]
    },
    {
      title: 'Особливі літери (Ґ, Є, І, Ї)',
      description: 'Унікальні літери української графіки',
      items: [
        { char: 'Ґ', name: 'ґе', sound: '[ɡ]', word: 'Ґрунт', translation: 'Почва', tips: 'Символ твердого звука Г' },
        { char: 'Є', name: 'є', sound: '[je]', word: 'Єнот', translation: 'Енот', tips: 'Смягчает предыдущую или звучит как [йэ]' },
        { char: 'І', name: 'і', sound: '[i]', word: 'Історія', translation: 'История', tips: 'Аналог чистого звука [и]' },
        { char: 'Ї', name: 'ї', sound: '[ji]', word: 'Україна', translation: 'Украина', tips: 'Всегда передает два звука [йі]' }
      ]
    }
  ],

  // 3. Moldavian / Молдавский
  'mo': [
    {
      title: 'Alfabetul Român / Moldovenesc (31)',
      description: 'Латинская графика с диакритическими знаками',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Apă', translation: 'Вода' },
        { char: 'Ă', name: 'ă', sound: '[ə] (средний гласный)', word: 'Măr', translation: 'Яблоко', tips: 'Буква A с дужкой-краткой сверху' },
        { char: 'Â', name: 'â din a', sound: '[ɨ] (как Ы)', word: 'România', translation: 'Румыния', tips: 'Буква A с циркумфлексом (крышечкой)' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Bun', translation: 'Хороший' },
        { char: 'C', name: 'ce', sound: '[k]/[tʃ]', word: 'Casă', translation: 'Дом' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Dor', translation: 'Тоска / Желание' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Elev', translation: 'Ученик' },
        { char: 'F', name: 'fe', sound: '[f]', word: 'Floare', translation: 'Цветок' },
        { char: 'G', name: 'ge', sound: '[ɡ]/[dʒ]', word: 'Gură', translation: 'Рот' },
        { char: 'H', name: 'ha', sound: '[h]', word: 'Horă', translation: 'Хоровод' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Inimă', translation: 'Сердце' },
        { char: 'Î', name: 'î din i', sound: '[ɨ] (как Ы)', word: 'Înger', translation: 'Ангел', tips: 'Буква I с крышечкой' },
        { char: 'J', name: 'je', sound: '[ʒ]', word: 'Joc', translation: 'Игра' },
        { char: 'K', name: 'ka', sound: '[k]', word: 'Kilogram', translation: 'Килограмм' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Lună', translation: 'Луна / Месяц' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Mamă', translation: 'Мама' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Noapte', translation: 'Ночь' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Om', translation: 'Человек' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Pâine', translation: 'Хлеб' },
        { char: 'R', name: 'er', sound: '[r]', word: 'Râu', translation: 'Река' },
        { char: 'S', name: 'es', sound: '[s]', word: 'Soare', translation: 'Солнце' },
        { char: 'Ș', name: 'șe', sound: '[ʃ] (Ш)', word: 'Școală', translation: 'Школа', tips: 'Буква S с запятой снизу' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Tată', translation: 'Отец' },
        { char: 'Ț', name: 'țe', sound: '[ts] (Ц)', word: 'Țară', translation: 'Страна', tips: 'Буква T с запятой снизу' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Ureche', translation: 'Ухо' },
        { char: 'V', name: 've', sound: '[v]', word: 'Viață', translation: 'Жизнь' },
        { char: 'Z', name: 'zet', sound: '[z]', word: 'Ziuă', translation: 'День' }
      ]
    },
    {
      title: 'Кириллическая традиция',
      description: 'Традиционные молдавские буквы кириллицы',
      items: [
        { char: 'Ӂ', name: 'джэ', sound: '[dʒ]', word: 'Ӂинӂир', translation: 'Имбирь', tips: 'Буква Ж с краткой' },
        { char: 'Ы', name: 'ы', sound: '[ɨ]', word: 'Кынд', translation: 'Когда' },
        { char: 'Э', name: 'э', sound: '[ə]', word: 'Мэр', translation: 'Яблоко' }
      ]
    }
  ],

  // 4. Lithuanian / Литовский
  'lt': [
    {
      title: 'Lietuvių abėcėlė (32)',
      description: 'Литовский алфавит с уникальными носовыми и гачеками',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Ačiū', translation: 'Спасибо' },
        { char: 'Ą', name: 'a nosinė', sound: '[aː] (долгий)', word: 'Ąžuolas', translation: 'Дуб', tips: 'Буква A с хвостиком (огонеком) снизу' },
        { char: 'B', name: 'bė', sound: '[b]', word: 'Brolis', translation: 'Брат' },
        { char: 'C', name: 'cė', sound: '[ts]', word: 'Cukrus', translation: 'Сахар' },
        { char: 'Č', name: 'čė', sound: '[tʃ]', word: 'Čia', translation: 'Здесь', tips: 'Буква C с птичкой (гачеком)' },
        { char: 'D', name: 'dė', sound: '[d]', word: 'Diena', translation: 'День' },
        { char: 'E', name: 'e', sound: '[ɛ]', word: 'Ežeras', translation: 'Озеро' },
        { char: 'Ę', name: 'e nosinė', sound: '[eː]', word: 'Katę', translation: 'Кошку', tips: 'Буква E с хвостиком снизу' },
        { char: 'Ė', name: 'ė', sound: '[eː] (закрытый)', word: 'Tėvas', translation: 'Отец', tips: 'Буква E с точкой сверху' },
        { char: 'F', name: 'ef', sound: '[f]', word: 'Filmas', translation: 'Фильм' },
        { char: 'G', name: 'gė', sound: '[ɡ]', word: 'Geras', translation: 'Хороший' },
        { char: 'H', name: 'ha', sound: '[ɣ]', word: 'Herojus', translation: 'Герой' },
        { char: 'I', name: 'i trumpoji', sound: '[ɪ]', word: 'Ir', translation: 'И' },
        { char: 'Į', name: 'i nosinė', sound: '[iː]', word: 'Įstoti', translation: 'Поступить', tips: 'Буква I с хвостиком снизу' },
        { char: 'Y', name: 'i ilgoji', sound: '[iː]', word: 'Yra', translation: 'Есть / Имеется' },
        { char: 'J', name: 'jot', sound: '[j]', word: 'Jūra', translation: 'Море' },
        { char: 'K', name: 'ka', sound: '[k]', word: 'Knyga', translation: 'Книга' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Labas', translation: 'Привет' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Meduolis', translation: 'Пряник' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Namas', translation: 'Дом' },
        { char: 'O', name: 'o', sound: '[oː]', word: 'Oras', translation: 'Погода / Воздух' },
        { char: 'P', name: 'pė', sound: '[p]', word: 'Pienas', translation: 'Молоко' },
        { char: 'R', name: 'er', sound: '[r]', word: 'Rytas', translation: 'Утро' },
        { char: 'S', name: 'es', sound: '[s]', word: 'Saulė', translation: 'Солнце' },
        { char: 'Š', name: 'šė', sound: '[ʃ]', word: 'Šuo', translation: 'Собака', tips: 'Буква S с птичкой (гачеком)' },
        { char: 'T', name: 'tė', sound: '[t]', word: 'Taip', translation: 'Да' },
        { char: 'U', name: 'u trumpoji', sound: '[ʊ]', word: 'Ugnis', translation: 'Огонь' },
        { char: 'Ų', name: 'u nosinė', sound: '[uː]', word: 'Siųsti', translation: 'Отправлять', tips: 'Буква U с хвостиком снизу' },
        { char: 'Ū', name: 'u ilgoji', sound: '[uː]', word: 'Ūkis', translation: 'Ферма', tips: 'Буква U с макроном (чертой)' },
        { char: 'V', name: 'vė', sound: '[v]', word: 'Vanduo', translation: 'Вода' },
        { char: 'Z', name: 'zet', sound: '[z]', word: 'Zylė', translation: 'Синица' },
        { char: 'Ž', name: 'žė', sound: '[ʒ]', word: 'Žemė', translation: 'Земля', tips: 'Буква Z с птичкой (гачеком)' }
      ]
    }
  ],

  // 5. Latvian / Латышский
  'lv': [
    {
      title: 'Latviešu alfabēts (33)',
      description: 'Латышский алфавит с долготами и мягкими согласными',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Acs', translation: 'Глаз' },
        { char: 'Ā', name: 'garais ā', sound: '[aː]', word: 'Ābols', translation: 'Яблоко', tips: 'Буква A с макроном' },
        { char: 'B', name: 'bē', sound: '[b]', word: 'Brālis', translation: 'Брат' },
        { char: 'C', name: 'cē', sound: '[ts]', word: 'Cilvēks', translation: 'Человек' },
        { char: 'Č', name: 'čē', sound: '[tʃ]', word: 'Četri', translation: 'Четыре', tips: 'Буква C с птичкой' },
        { char: 'D', name: 'dē', sound: '[d]', word: 'Draugs', translation: 'Друг' },
        { char: 'E', name: 'e', sound: '[e]/[æ]', word: 'Ezis', translation: 'Ёж' },
        { char: 'Ē', name: 'garais ē', sound: '[eː]/[æː]', word: 'Ēka', translation: 'Здание', tips: 'Буква E с макроном' },
        { char: 'F', name: 'ef', sound: '[f]', word: 'Foto', translation: 'Фото' },
        { char: 'G', name: 'gā', sound: '[ɡ]', word: 'Galds', translation: 'Стол' },
        { char: 'Ģ', name: 'mīkstinātais ģē', sound: '[ɟ]', word: 'Ģimene', translation: 'Семья', tips: 'Буква G с седилью сверху' },
        { char: 'H', name: 'hā', sound: '[x]', word: 'Hokejs', translation: 'Хоккей' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Ir', translation: 'Есть / Является' },
        { char: 'Ī', name: 'garais ī', sound: '[iː]', word: 'Īss', translation: 'Короткий', tips: 'Буква I с макроном' },
        { char: 'J', name: 'jē', sound: '[j]', word: 'Jūra', translation: 'Море' },
        { char: 'K', name: 'kā', sound: '[k]', word: 'Kaķis', translation: 'Кот' },
        { char: 'Ķ', name: 'mīkstinātais ķē', sound: '[c]', word: 'Ķirsis', translation: 'Вишня', tips: 'Буква K с седилью снизу' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Logs', translation: 'Окно' },
        { char: 'Ļ', name: 'mīkstinātais eļ', sound: '[ʎ]', word: 'Ļoti', translation: 'Очень', tips: 'Буква L с седилью снизу' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Māja', translation: 'Дом' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Nakts', translation: 'Ночь' },
        { char: 'Ņ', name: 'mīkstinātais eņ', sound: '[ɲ]', word: 'Ņemt', translation: 'Брать', tips: 'Буква N с седилью снизу' },
        { char: 'O', name: 'o', sound: '[uɔ]/[oː]', word: 'Ozols', translation: 'Дуб' },
        { char: 'P', name: 'pē', sound: '[p]', word: 'Piens', translation: 'Молоко' },
        { char: 'R', name: 'er', sound: '[r]', word: 'Roka', translation: 'Рука' },
        { char: 'S', name: 'es', sound: '[s]', word: 'Saule', translation: 'Солнце' },
        { char: 'Š', name: 'eš', sound: '[ʃ]', word: 'Šodien', translation: 'Сегодня', tips: 'Буква S с птичкой' },
        { char: 'T', name: 'tē', sound: '[t]', word: 'Tēvs', translation: 'Отец' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Upe', translation: 'Река' },
        { char: 'Ū', name: 'garais ū', sound: '[uː]', word: 'Ūdens', translation: 'Вода', tips: 'Буква U с макроном' },
        { char: 'V', name: 'vē', sound: '[v]', word: 'Vējš', translation: 'Ветер' },
        { char: 'Z', name: 'zē', sound: '[z]', word: 'Zvaigzne', translation: 'Звезда' },
        { char: 'Ž', name: 'žē', sound: '[ʒ]', word: 'Žirafe', translation: 'Жираф', tips: 'Буква Z с птичкой' }
      ]
    }
  ],

  // 6. Estonian / Эстонский
  'et': [
    {
      title: 'Eesti tähestik (27)',
      description: 'Эстонский алфавит с уникальными гласными Õ, Ä, Ö, Ü',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Aeg', translation: 'Время' },
        { char: 'B', name: 'bee', sound: '[b̥]', word: 'Buss', translation: 'Автобус' },
        { char: 'D', name: 'dee', sound: '[d̥]', word: 'Draakon', translation: 'Дракон' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Ema', translation: 'Мама' },
        { char: 'F', name: 'eff', sound: '[f]', word: 'Film', translation: 'Фильм' },
        { char: 'G', name: 'gee', sound: '[ɡ̊]', word: 'Garaaž', translation: 'Гараж' },
        { char: 'H', name: 'haa', sound: '[h]', word: 'Hea', translation: 'Хороший' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Ilus', translation: 'Красивый' },
        { char: 'J', name: 'jott', sound: '[j]', word: 'Järv', translation: 'Озеро' },
        { char: 'K', name: 'kaa', sound: '[k]', word: 'Kass', translation: 'Кот' },
        { char: 'L', name: 'ell', sound: '[l]', word: 'Linn', translation: 'Город' },
        { char: 'M', name: 'emm', sound: '[m]', word: 'Maa', translation: 'Земля / Страна' },
        { char: 'N', name: 'enn', sound: '[n]', word: 'Naine', translation: 'Женщина' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Oma', translation: 'Свой' },
        { char: 'P', name: 'pee', sound: '[p]', word: 'Päike', translation: 'Солнце' },
        { char: 'R', name: 'err', sound: '[r]', word: 'Raha', translation: 'Деньги' },
        { char: 'S', name: 'ess', sound: '[s]', word: 'Sõber', translation: 'Друг' },
        { char: 'Š', name: 'šaa', sound: '[ʃ]', word: 'Šokolaad', translation: 'Шоколад', tips: 'Буква S с птичкой' },
        { char: 'Z', name: 'tsett', sound: '[ts]', word: 'Zebra', translation: 'Зебра' },
        { char: 'Ž', name: 'žee', sound: '[ʒ]', word: 'Žanr', translation: 'Жанр', tips: 'Буква Z с птичкой' },
        { char: 'T', name: 'tee', sound: '[t]', word: 'Tere', translation: 'Привет' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Uus', translation: 'Новый' },
        { char: 'V', name: 'vee', sound: '[v]', word: 'Vesi', translation: 'Вода' },
        { char: 'Õ', name: 'õõ', sound: '[ɤ] (средний неогубленный)', word: 'Õun', translation: 'Яблоко', tips: 'Буква O с тильдой сверху' },
        { char: 'Ä', name: 'ää', sound: '[æ]', word: 'Äitäh', translation: 'Спасибо', tips: 'Буква A с умлаутом' },
        { char: 'Ö', name: 'öö', sound: '[ø]', word: 'Öö', translation: 'Ночь', tips: 'Буква O с умлаутом' },
        { char: 'Ü', name: 'üü', sound: '[y]', word: 'Üks', translation: 'Один', tips: 'Буква U с умлаутом' }
      ]
    }
  ],

  // 7. Georgian / Грузинский
  'ka': [
    {
      title: 'ქართული ანბანი (Мхедрули - 33)',
      description: 'Уникальная древняя грузинская каллиграфическая графика',
      items: [
        { char: 'ა', name: 'ани', sound: '[a]', word: 'მზე', translation: 'Солнце', tips: 'Округлый завиток слева направо' },
        { char: 'ბ', name: 'бани', sound: '[b]', word: 'ბავშვი', translation: 'Ребёнок', tips: 'Верхняя дуга с нижним хвостиком' },
        { char: 'გ', name: 'гани', sound: '[ɡ]', word: 'გზა', translation: 'Дорога', tips: 'Волнообразный штрих' },
        { char: 'დ', name: 'дони', sound: '[d]', word: 'დედა', translation: 'Мама', tips: 'Двойная округлая форма' },
        { char: 'ე', name: 'эни', sound: '[e]', word: 'ენა', translation: 'Язык', tips: 'Плавный крючок' },
        { char: 'ვ', name: 'вини', sound: '[v]', word: 'ვარდი', translation: 'Роза' },
        { char: 'ზ', name: 'зени', sound: '[z]', word: 'ზღვა', translation: 'Море' },
        { char: 'თ', name: 'тани', sound: '[tʰ] (с придыханием)', word: 'თვალი', translation: 'Глаз' },
        { char: 'ი', name: 'ини', sound: '[i]', word: 'ია', translation: 'Фиалка' },
        { char: 'კ', name: 'кани', sound: '[kʼ] (абруптив)', word: 'კაცი', translation: 'Мужчина' },
        { char: 'ლ', name: 'ласи', sound: '[l]', word: 'ლამაზი', translation: 'Красивый' },
        { char: 'მ', name: 'мани', sound: '[m]', word: 'მამა', translation: 'Папа' },
        { char: 'ნ', name: 'нари', sound: '[n]', word: 'ნავი', translation: 'Лодка' },
        { char: 'ო', name: 'они', sound: '[o]', word: 'ოჯახი', translation: 'Семья' },
        { char: 'პ', name: 'пари', sound: '[pʼ] (абруптив)', word: 'პური', translation: 'Хлеб' },
        { char: 'ჟ', name: 'жани', sound: '[ʒ]', word: 'ჟოლო', translation: 'Малина' },
        { char: 'რ', name: 'рае', sound: '[r]', word: 'რკინა', translation: 'Железо' },
        { char: 'ს', name: 'сани', sound: '[s]', word: 'სახლი', translation: 'Дом' },
        { char: 'ტ', name: 'тари', sound: '[tʼ] (абруптив)', word: 'ტყე', translation: 'Лес' },
        { char: 'უ', name: 'уни', sound: '[u]', word: 'უნივერსიტეტი', translation: 'Университет' },
        { char: 'ფ', name: 'пари', sound: '[pʰ] (с придыханием)', word: 'ფული', translation: 'Деньги' },
        { char: 'ქ', name: 'кани', sound: '[kʰ] (с придыханием)', word: 'ქარი', translation: 'Ветер' },
        { char: 'ღ', name: 'гани', sound: '[ɣ] (гортанное)', word: 'ღვინო', translation: 'Вино' },
        { char: 'ყ', name: 'кари', sound: '[qʼ] (глубокий абруптив)', word: 'ყავა', translation: 'Кофе' },
        { char: 'შ', name: 'шини', sound: '[ʃ]', word: 'შვილი', translation: 'Сын / Дитя' },
        { char: 'ჩ', name: 'чини', sound: '[tʃʰ]', word: 'ჩай', translation: 'Чай' },
        { char: 'ც', name: 'цани', sound: '[tsʰ]', word: 'ცა', translation: 'Небо' },
        { char: 'ძ', name: 'дзили', sound: '[dz]', word: 'ძმა', translation: 'Брат' },
        { char: 'წ', name: 'цили', sound: '[tsʼ] (абруптив)', word: 'წყალი', translation: 'Вода' },
        { char: 'ჭ', name: 'чари', sound: '[tʃʼ] (абруптив)', word: 'ჭიშკარი', translation: 'Ворота' },
        { char: 'ხ', name: 'хани', sound: '[x]', word: 'ხელი', translation: 'Рука' },
        { char: 'ჯ', name: 'джани', sound: '[dʒ]', word: 'ჯვარი', translation: 'Крест' },
        { char: 'ჰ', name: 'хае', sound: '[h]', word: 'ჰაერი', translation: 'Воздух' }
      ]
    }
  ],

  // 8. Armenian / Армянский
  'hy': [
    {
      title: 'Հայոց այբուբեն (Алфавит Маштоца - 39)',
      description: 'Создан святым Месропом Маштоцем в 405 году',
      items: [
        { char: 'Ա', name: 'айб', sound: '[a]', word: 'Արև', translation: 'Солнце' },
        { char: 'Բ', name: 'бен', sound: '[b]', word: 'Բարև', translation: 'Привет' },
        { char: 'Գ', name: 'гим', sound: '[ɡ]', word: 'Գիրք', translation: 'Книга' },
        { char: 'Դ', name: 'да', sound: '[d]', word: 'Դուռ', translation: 'Дверь' },
        { char: 'Ե', name: 'еч', sound: '[jɛ]/[ɛ]', word: 'Երկինք', translation: 'Небо' },
        { char: 'Զ', name: 'за', sound: '[z]', word: 'Զանգ', translation: 'Колокол' },
        { char: 'Է', name: 'э', sound: '[ɛ]', word: 'Էջ', translation: 'Страница' },
        { char: 'Ը', name: 'эт', sound: '[ə]', word: 'Ընկեր', translation: 'Друг' },
        { char: 'Թ', name: 'то', sound: '[tʰ]', word: 'Թռչուն', translation: 'Птица' },
        { char: 'Ժ', name: 'же', sound: '[ʒ]', word: 'Ժամ', translation: 'Час' },
        { char: 'Ի', name: 'ини', sound: '[i]', word: 'Իմաստ', translation: 'Смысл' },
        { char: 'Լ', name: 'льюн', sound: '[l]', word: 'Լույս', translation: 'Свет' },
        { char: 'Խ', name: 'хе', sound: '[x]', word: 'Խաղաղություն', translation: 'Мир' },
        { char: 'Ծ', name: 'тса', sound: '[tsʼ]', word: 'Ծաղիկ', translation: 'Цветок' },
        { char: 'Կ', name: 'кен', sound: '[kʼ]', word: 'Կրակ', translation: 'Огонь' },
        { char: 'Հ', name: 'хо', sound: '[h]', word: 'Հաց', translation: 'Хлеб' },
        { char: 'Ձ', name: 'дза', sound: '[dz]', word: 'Ձյուն', translation: 'Снег' },
        { char: 'Ղ', name: 'гат', sound: '[ʁ]', word: 'Ղեկ', translation: 'Руль' },
        { char: 'Ճ', name: 'че', sound: '[tʃʼ]', word: 'Ճանապարհ', translation: 'Дорога' },
        { char: 'Մ', name: 'мен', sound: '[m]', word: 'Մայր', translation: 'Мать' },
        { char: 'Յ', name: 'хи', sound: '[j]', word: 'Յուղ', translation: 'Масло' },
        { char: 'Ն', name: 'ну', sound: '[n]', word: 'Նուռ', translation: 'Гранат' },
        { char: 'Շ', name: 'ша', sound: '[ʃ]', word: 'Շուն', translation: 'Собака' },
        { char: 'Ո', name: 'во', sound: '[vɔ]/[ɔ]', word: 'Որդի', translation: 'Сын' },
        { char: 'Չ', name: 'ча', sound: '[tʃʰ]', word: 'Չորս', translation: 'Четыре' },
        { char: 'Պ', name: 'пе', sound: '[pʼ]', word: 'Պար', translation: 'Танец' },
        { char: 'Ջ', name: 'дже', sound: '[dʒ]', word: 'Ջուր', translation: 'Вода' },
        { char: 'Ռ', name: 'ра', sound: '[r]', word: 'Ռումբ', translation: 'Бомба' },
        { char: 'Ս', name: 'се', sound: '[s]', word: 'Սեր', translation: 'Любовь' },
        { char: 'Վ', name: 'вев', sound: '[v]', word: 'Վարդ', translation: 'Роза' },
        { char: 'Տ', name: 'тюн', sound: '[tʼ]', word: 'Տուն', translation: 'Дом' },
        { char: 'Ր', name: 'ре', sound: '[ɾ]', word: 'Րոպե', translation: 'Минута' },
        { char: 'Ց', name: 'цо', sound: '[tsʰ]', word: 'Ցորեն', translation: 'Пшеница' },
        { char: 'Ւ', name: 'хьюн', sound: '[v]', word: 'Նավ', translation: 'Корабль' },
        { char: 'Փ', name: 'пьюр', sound: '[pʰ]', word: 'Փողոց', translation: 'Улица' },
        { char: 'Ք', name: 'ке', sound: '[kʰ]', word: 'Քաղաք', translation: 'Город' },
        { char: 'և', name: 'ев', sound: '[jɛv]', word: 'Եվ', translation: 'И' },
        { char: 'Օ', name: 'о', sound: '[o]', word: 'Օր', translation: 'День' },
        { char: 'Ֆ', name: 'фе', sound: '[f]', word: 'Ֆուտբոլ', translation: 'Футбол' }
      ]
    }
  ],

  // 9. Azerbaijani / Азербайджанский
  'az': [
    {
      title: 'Azərbaycan əlifbası (32)',
      description: 'Азербайджанская латиница с особыми символами',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Ana', translation: 'Мама' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Bahar', translation: 'Весна' },
        { char: 'C', name: 'ce', sound: '[dʒ]', word: 'Cavab', translation: 'Ответ' },
        { char: 'Ç', name: 'çe', sound: '[tʃ]', word: 'Çörək', translation: 'Хлеб', tips: 'Буква C с седилью' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Dost', translation: 'Друг' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Ev', translation: 'Дом' },
        { char: 'Ə', name: 'ə', sound: '[æ] (широкий э)', word: 'Əziz', translation: 'Дорогой / Милый', tips: 'Перевернутая буква e - символ языка' },
        { char: 'F', name: 'fe', sound: '[f]', word: 'Fikir', translation: 'Мысль' },
        { char: 'G', name: 'ge', sound: '[ɟ]', word: 'Gözəl', translation: 'Красивый' },
        { char: 'Ğ', name: 'ğe', sound: '[ɣ]', word: 'Dağ', translation: 'Гора', tips: 'Буква G с дужкой' },
        { char: 'H', name: 'he', sound: '[h]', word: 'Həyat', translation: 'Жизнь' },
        { char: 'X', name: 'xe', sound: '[x]', word: 'Xalq', translation: 'Народ' },
        { char: 'I', name: 'ı', sound: '[ɯ] (как Ы)', word: 'Işıq', translation: 'Свет', tips: 'I без точки' },
        { char: 'İ', name: 'i', sound: '[i]', word: 'İş', translation: 'Работа', tips: 'I с точкой' },
        { char: 'J', name: 'je', sound: '[ʒ]', word: 'Jurnal', translation: 'Журнал' },
        { char: 'K', name: 'ke', sound: '[c]/[k]', word: 'Kitab', translation: 'Книга' },
        { char: 'Q', name: 'qe', sound: '[ɡ]/[ɢ]', word: 'Qardaş', translation: 'Брат' },
        { char: 'L', name: 'le', sound: '[l]', word: 'Lalə', translation: 'Тюльпан' },
        { char: 'M', name: 'me', sound: '[m]', word: 'Məktəb', translation: 'Школа' },
        { char: 'N', name: 'ne', sound: '[n]', word: 'Nəğmə', translation: 'Песня' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Oğul', translation: 'Сын' },
        { char: 'Ö', name: 'ö', sound: '[ø]', word: 'Ölkə', translation: 'Страна', tips: 'Буква O с умлаутом' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Pul', translation: 'Деньги' },
        { char: 'R', name: 're', sound: '[r]', word: 'Rəng', translation: 'Цвет' },
        { char: 'S', name: 'se', sound: '[s]', word: 'Salam', translation: 'Привет' },
        { char: 'Ş', name: 'şe', sound: '[ʃ]', word: 'Şəhər', translation: 'Город', tips: 'Буква S с седилью' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Torpaq', translation: 'Земля' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Uşaq', translation: 'Ребёнок' },
        { char: 'Ü', name: 'ü', sound: '[y]', word: 'Ürək', translation: 'Сердце', tips: 'Буква U с умлаутом' },
        { char: 'V', name: 've', sound: '[v]', word: 'Vətən', translation: 'Родина' },
        { char: 'Y', name: 'ye', sound: '[j]', word: 'Yol', translation: 'Дорога' },
        { char: 'Z', name: 'ze', sound: '[z]', word: 'Zaman', translation: 'Время' }
      ]
    }
  ],

  // 10. Kazakh / Казахский
  'kk': [
    {
      title: 'Қазақ кириллицасы (42)',
      description: 'Казахский алфавит с 9 специфическими буквами',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Алма', translation: 'Яблоко' },
        { char: 'Ә', name: 'ә', sound: '[æ] (мягкий а)', word: 'Әке', translation: 'Отец', tips: 'Буква А с соединенной верхней дугой' },
        { char: 'Б', name: 'бэ', sound: '[b]', word: 'Бала', translation: 'Ребёнок' },
        { char: 'В', name: 'вэ', sound: '[v]', word: 'Вагон', translation: 'Вагон' },
        { char: 'Г', name: 'гэ', sound: '[ɡ]', word: 'Гүл', translation: 'Цветок' },
        { char: 'Ғ', name: 'ға', sound: '[ʁ] (глубокий г)', word: 'Ғарыш', translation: 'Космос', tips: 'Буква Г с горизонтальной черточкой' },
        { char: 'Д', name: 'дэ', sound: '[d]', word: 'Дала', translation: 'Степь' },
        { char: 'Е', name: 'е', sound: '[jɛ]/[ɛ]', word: 'Ел', translation: 'Страна' },
        { char: 'Ё', name: 'ё', sound: '[jo]', word: 'Ёлка', translation: 'Ёлка' },
        { char: 'Ж', name: 'же', sound: '[ʒ]', word: 'Жер', translation: 'Земля' },
        { char: 'З', name: 'зе', sound: '[z]', word: 'Заман', translation: 'Время' },
        { char: 'И', name: 'и', sound: '[ɪj]', word: 'Ит', translation: 'Собака' },
        { char: 'Й', name: 'қысқа й', sound: '[j]', word: 'Ай', translation: 'Луна' },
        { char: 'К', name: 'ка', sound: '[k]', word: 'Көл', translation: 'Озеро' },
        { char: 'Қ', name: 'қа', sound: '[q] (твердый к)', word: 'Қазақ', translation: 'Казах', tips: 'Буква К с нижним правым хвостиком' },
        { char: 'Л', name: 'эл', sound: '[l]', word: 'Лашын', translation: 'Сокол' },
        { char: 'М', name: 'эм', sound: '[m]', word: 'Мектеп', translation: 'Школа' },
        { char: 'Н', name: 'эн', sound: '[n]', word: 'Нан', translation: 'Хлеб' },
        { char: 'Ң', name: 'эң', sound: '[ŋ] (носовой н)', word: 'Таң', translation: 'Утро', tips: 'Буква Н с нижним правым хвостиком' },
        { char: 'О', name: 'о', sound: '[o]', word: 'Отан', translation: 'Родина' },
        { char: 'Ө', name: 'ө', sound: '[ø] (мягкий о)', word: 'Өмір', translation: 'Жизнь', tips: 'О перечеркнутое' },
        { char: 'П', name: 'пэ', sound: '[p]', word: 'Піл', translation: 'Слон' },
        { char: 'Р', name: 'эр', sound: '[r]', word: 'Рахмет', translation: 'Спасибо' },
        { char: 'С', name: 'эс', sound: '[s]', word: 'Сәлем', translation: 'Привет' },
        { char: 'Т', name: 'тэ', sound: '[t]', word: 'Тау', translation: 'Гора' },
        { char: 'У', name: 'у', sound: '[w]/[u]', word: 'Уақыт', translation: 'Время' },
        { char: 'Ұ', name: 'ұ', sound: '[ʊ] (твердый у)', word: 'Ұлы', translation: 'Великий', tips: 'Буква Ү перечеркнутая' },
        { char: 'Ү', name: 'ү', sound: '[y] (мягкий у)', word: 'Үй', translation: 'Дом', tips: 'Прямая буква У' },
        { char: 'Ф', name: 'эф', sound: '[f]', word: 'Футбол', translation: 'Футбол' },
        { char: 'Х', name: 'ха', sound: '[x]', word: 'Хат', translation: 'Письмо' },
        { char: 'Һ', name: 'һа', sound: '[h] (мягкий выдох)', word: 'Гауһар', translation: 'Бриллиант', tips: 'Буква похожая на латинскую h' },
        { char: 'Ц', name: 'цэ', sound: '[ts]', word: 'Цирк', translation: 'Цирк' },
        { char: 'Ч', name: 'че', sound: '[tʃ]', word: 'Чек', translation: 'Чек' },
        { char: 'Ш', name: 'ша', sound: '[ʃ]', word: 'Шай', translation: 'Чай' },
        { char: 'Щ', name: 'ща', sound: '[ʃtʃ]', word: 'Ащы', translation: 'Горький' },
        { char: 'Ъ', name: 'жуандық белгі', sound: '[-]', word: 'Съезд', translation: 'Съезд' },
        { char: 'Ы', name: 'ы', sound: '[ɯ] (твердый ы)', word: 'Ыдыс', translation: 'Посуда' },
        { char: 'І', name: 'і', sound: '[ɪ] (мягкий і)', word: 'Іні', translation: 'Младший брат', tips: 'Буква I' },
        { char: 'Ь', name: 'жіңішкелік белгі', sound: '[-]', word: 'Лагерь', translation: 'Лагерь' },
        { char: 'Э', name: 'э', sound: '[e]', word: 'Экран', translation: 'Экран' },
        { char: 'Ю', name: 'ю', sound: '[ju]', word: 'Аю', translation: 'Медведь' },
        { char: 'Я', name: 'я', sound: '[ja]', word: 'Қоян', translation: 'Заяц' }
      ]
    },
    {
      title: 'Төл дыбыстар (9 специфических)',
      description: 'Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І',
      items: [
        { char: 'Ә', name: 'ә', sound: '[æ]', word: 'Әже', translation: 'Бабушка' },
        { char: 'Ғ', name: 'ға', sound: '[ʁ]', word: 'Ғалым', translation: 'Ученый' },
        { char: 'Қ', name: 'қа', sound: '[q]', word: 'Қыран', translation: 'Орёл' },
        { char: 'Ң', name: 'эң', sound: '[ŋ]', word: 'Аңырақай', translation: 'Анракай' },
        { char: 'Ө', name: 'ө', sound: '[ø]', word: 'Өзен', translation: 'Река' },
        { char: 'Ұ', name: 'ұ', sound: '[ʊ]', word: 'Ұшақ', translation: 'Самолёт' },
        { char: 'Ү', name: 'ү', sound: '[y]', word: 'Үкі', translation: 'Филин' },
        { char: 'Һ', name: 'һа', sound: '[h]', word: 'Жиһаз', translation: 'Мебель' },
        { char: 'І', name: 'і', sound: '[ɪ]', word: 'Ізет', translation: 'Уважение' }
      ]
    }
  ],

  // 11. Uzbek / Узбекский
  'uz': [
    {
      title: 'Oʻzbek lotin alifbosi (29)',
      description: 'Узбекский латинский алфавит',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Anor', translation: 'Гранат' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Bola', translation: 'Ребёнок' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Daraxt', translation: 'Дерево' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Eshik', translation: 'Дверь' },
        { char: 'F', name: 'fe', sound: '[f]', word: 'Farzand', translation: 'Дитя' },
        { char: 'G', name: 'ge', sound: '[ɡ]', word: 'Gul', translation: 'Цветок' },
        { char: 'H', name: 'he', sound: '[h]', word: 'Havo', translation: 'Воздух' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Ipak', translation: 'Шёлк' },
        { char: 'J', name: 'je', sound: '[dʒ]/[ʒ]', word: 'Jon', translation: 'Душа' },
        { char: 'K', name: 'ke', sound: '[k]', word: 'Kitob', translation: 'Книга' },
        { char: 'L', name: 'le', sound: '[l]', word: 'Lola', translation: 'Тюльпан' },
        { char: 'M', name: 'me', sound: '[m]', word: 'Maktab', translation: 'Школа' },
        { char: 'N', name: 'ne', sound: '[n]', word: 'Non', translation: 'Хлеб' },
        { char: 'O', name: 'o', sound: '[ɔ]', word: 'Ona', translation: 'Мама' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Paxta', translation: 'Хлопок' },
        { char: 'Q', name: 'qe', sound: '[q]', word: 'Quyosh', translation: 'Солнце' },
        { char: 'R', name: 're', sound: '[r]', word: 'Rahmat', translation: 'Спасибо' },
        { char: 'S', name: 'se', sound: '[s]', word: 'Salom', translation: 'Привет' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Togʻ', translation: 'Гора' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Uy', translation: 'Дом' },
        { char: 'V', name: 've', sound: '[v]', word: 'Vatan', translation: 'Родина' },
        { char: 'X', name: 'xe', sound: '[x]', word: 'Xat', translation: 'Письмо' },
        { char: 'Y', name: 'ye', sound: '[j]', word: 'Yulduz', translation: 'Звезда' },
        { char: 'Z', name: 'ze', sound: '[z]', word: 'Zamin', translation: 'Земля' },
        { char: 'Oʻ', name: 'oʻ', sound: '[o]', word: 'Oʻzbek', translation: 'Узбек', tips: 'Буква O с перевернутым апострофом' },
        { char: 'Gʻ', name: 'gʻ', sound: '[ʁ]', word: 'Gʻalaba', translation: 'Победа', tips: 'Буква G с перевернутым апострофом' },
        { char: 'Sh', name: 'she', sound: '[ʃ]', word: 'Shahar', translation: 'Город' },
        { char: 'Ch', name: 'che', sound: '[tʃ]', word: 'Choy', translation: 'Чай' },
        { char: 'Ng', name: 'nge', sound: '[ŋ]', word: 'Tong', translation: 'Рассвет' }
      ]
    }
  ],

  // 12. Turkmen / Туркменский
  'tk': [
    {
      title: 'Türkmen elipbiýi (30)',
      description: 'Туркменский латинский алфавит',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Aba', translation: 'Отец' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Bagt', translation: 'Счастье' },
        { char: 'Ç', name: 'çe', sound: '[tʃ]', word: 'Çaga', translation: 'Ребёнок' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Dost', translation: 'Друг' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Ene', translation: 'Мама' },
        { char: 'Ä', name: 'ä', sound: '[æ]', word: 'Älem', translation: 'Вселенная', tips: 'Буква A с умлаутом' },
        { char: 'F', name: 'fe', sound: '[f]', word: 'Film', translation: 'Фильм' },
        { char: 'G', name: 'ge', sound: '[ɡ]', word: 'Gül', translation: 'Цветок' },
        { char: 'H', name: 'he', sound: '[h]', word: 'Hawa', translation: 'Да' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Içmek', translation: 'Пить' },
        { char: 'J', name: 'je', sound: '[dʒ]', word: 'Juda', translation: 'Очень' },
        { char: 'Ž', name: 'že', sound: '[ʒ]', word: 'Žurnal', translation: 'Журнал', tips: 'Буква Z с гачеком' },
        { char: 'K', name: 'ke', sound: '[k]', word: 'Kitap', translation: 'Книга' },
        { char: 'L', name: 'le', sound: '[l]', word: 'Lomaý', translation: 'Оптом' },
        { char: 'M', name: 'me', sound: '[m]', word: 'Mugallym', translation: 'Учитель' },
        { char: 'N', name: 'ne', sound: '[n]', word: 'Nan', translation: 'Хлеб' },
        { char: 'Ň', name: 'ne', sound: '[ŋ]', word: 'Tañry', translation: 'Бог', tips: 'Буква N с седилью/хвостиком' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Oglan', translation: 'Мальчик' },
        { char: 'Ö', name: 'ö', sound: '[ø]', word: 'Öý', translation: 'Дом', tips: 'Буква O с умлаутом' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Pikir', translation: 'Мысль' },
        { char: 'R', name: 're', sound: '[r]', word: 'Röwşen', translation: 'Светлый' },
        { char: 'S', name: 'se', sound: '[θ]/[s]', word: 'Salam', translation: 'Привет' },
        { char: 'Ş', name: 'şe', sound: '[ʃ]', word: 'Şäher', translation: 'Город', tips: 'Буква S с седилью' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Tam', translation: 'Стена / Дом' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Uly', translation: 'Большой' },
        { char: 'Ü', name: 'ü', sound: '[y]', word: 'Üzüm', translation: 'Виноград', tips: 'Буква U с умлаутом' },
        { char: 'W', name: 'we', sound: '[β]/[w]', word: 'Watan', translation: 'Родина' },
        { char: 'Y', name: 'y', sound: '[ɯ]', word: 'Ylym', translation: 'Наука' },
        { char: 'Ý', name: 'ye', sound: '[j]', word: 'Ýol', translation: 'Дорога', tips: 'Буква Y с акутом (ударением)' },
        { char: 'Z', name: 'ze', sound: '[ð]/[z]', word: 'Zemin', translation: 'Земля' }
      ]
    }
  ],

  // 13. Kyrgyz / Киргизский
  'ky': [
    {
      title: 'Кыргыз алфавити (36)',
      description: 'Кыргызская кириллица с буквами Ң, Ө, Ү',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Ата', translation: 'Отец' },
        { char: 'Б', name: 'бэ', sound: '[b]', word: 'Бала', translation: 'Ребёнок' },
        { char: 'В', name: 'вэ', sound: '[v]', word: 'Вагон', translation: 'Вагон' },
        { char: 'Г', name: 'гэ', sound: '[ɡ]/[ʁ]', word: 'Гүл', translation: 'Цветок' },
        { char: 'Д', name: 'дэ', sound: '[d]', word: 'Дос', translation: 'Друг' },
        { char: 'Е', name: 'е', sound: '[je]/[e]', word: 'Эне', translation: 'Мама' },
        { char: 'Ё', name: 'ё', sound: '[jo]', word: 'Ёлка', translation: 'Ёлка' },
        { char: 'Ж', name: 'же', sound: '[dʒ]', word: 'Жол', translation: 'Дорога' },
        { char: 'З', name: 'зе', sound: '[z]', word: 'Заман', translation: 'Время' },
        { char: 'И', name: 'и', sound: '[i]', word: 'Ит', translation: 'Собака' },
        { char: 'Й', name: 'йот', sound: '[j]', word: 'Ай', translation: 'Луна' },
        { char: 'К', name: 'ка', sound: '[k]/[q]', word: 'Китеп', translation: 'Книга' },
        { char: 'Л', name: 'эл', sound: '[l]', word: 'Лимон', translation: 'Лимон' },
        { char: 'М', name: 'эм', sound: '[m]', word: 'Мектеп', translation: 'Школа' },
        { char: 'Н', name: 'эн', sound: '[n]', word: 'Нан', translation: 'Хлеб' },
        { char: 'Ң', name: 'эң', sound: '[ŋ]', word: 'Тоң', translation: 'Мерзлота', tips: 'Буква Н с хвостиком' },
        { char: 'О', name: 'о', sound: '[o]', word: 'Ордо', translation: 'Ставка / Центр' },
        { char: 'Ө', name: 'ө', sound: '[ø]', word: 'Өмүр', translation: 'Жизнь', tips: 'Перечеркнутая буква О' },
        { char: 'П', name: 'пэ', sound: '[p]', word: 'Пил', translation: 'Слон' },
        { char: 'Р', name: 'эр', sound: '[r]', word: 'Рахмат', translation: 'Спасибо' },
        { char: 'С', name: 'эс', sound: '[s]', word: 'Салам', translation: 'Привет' },
        { char: 'Т', name: 'тэ', sound: '[t]', word: 'Тоо', translation: 'Гора' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Улут', translation: 'Нация' },
        { char: 'Ү', name: 'ү', sound: '[y]', word: 'Үй', translation: 'Дом', tips: 'Прямая буква Ү' },
        { char: 'Ф', name: 'эф', sound: '[f]', word: 'Фабрика', translation: 'Фабрика' },
        { char: 'Х', name: 'ха', sound: '[x]', word: 'Хат', translation: 'Письмо' },
        { char: 'Ц', name: 'цэ', sound: '[ts]', word: 'Цирк', translation: 'Цирк' },
        { char: 'Ч', name: 'че', sound: '[tʃ]', word: 'Чай', translation: 'Чай' },
        { char: 'Ш', name: 'ша', sound: '[ʃ]', word: 'Шоола', translation: 'Луч' },
        { char: 'Щ', name: 'ща', sound: '[ʃtʃ]', word: 'Щётка', translation: 'Щётка' },
        { char: 'Ъ', name: 'ажыратуу белгиси', sound: '[-]', word: 'Съезд', translation: 'Съезд' },
        { char: 'Ы', name: 'ы', sound: '[ɯ]', word: 'Ыр', translation: 'Песня' },
        { char: 'Ь', name: 'ичкертүү белгиси', sound: '[-]', word: 'Альбом', translation: 'Альбом' },
        { char: 'Э', name: 'э', sound: '[e]', word: 'Эл', translation: 'Народ' },
        { char: 'Ю', name: 'ю', sound: '[ju]', word: 'Юрист', translation: 'Юрист' },
        { char: 'Я', name: 'я', sound: '[ja]', word: 'Якорь', translation: 'Якорь' }
      ]
    }
  ],

  // 14. Tajik / Таджикский
  'tg': [
    {
      title: 'Алифбои тоҷикӣ (35)',
      description: 'Таджикский алфавит с 6 специфическими буквами',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Анор', translation: 'Гранат' },
        { char: 'Б', name: 'бе', sound: '[b]', word: 'Баҳор', translation: 'Весна' },
        { char: 'В', name: 'ве', sound: '[v]', word: 'Ватан', translation: 'Родина' },
        { char: 'Г', name: 'ге', sound: '[ɡ]', word: 'Гул', translation: 'Цветок' },
        { char: 'Ғ', name: 'ғе', sound: '[ʁ]', word: 'Ғалаба', translation: 'Победа', tips: 'Буква Г с черточкой' },
        { char: 'Д', name: 'де', sound: '[d]', word: 'Дарё', translation: 'Река' },
        { char: 'Е', name: 'йе', sound: '[je]/[e]', word: 'Ер', translation: 'Земля' },
        { char: 'Ё', name: 'йо', sound: '[jɔ]', word: 'Ёрдам', translation: 'Помощь' },
        { char: 'Ж', name: 'же', sound: '[ʒ]', word: 'Жола', translation: 'Град' },
        { char: 'З', name: 'зе', sound: '[z]', word: 'Замин', translation: 'Земля' },
        { char: 'И', name: 'и', sound: '[i]', word: 'Илм', translation: 'Знание' },
        { char: 'Ӣ', name: 'ӣ дароз', sound: '[iː] (долгий)', word: 'Зебоӣ', translation: 'Красота', tips: 'Буква И с макроном (чертой)' },
        { char: 'Й', name: 'йи', sound: '[j]', word: 'Май', translation: 'Май' },
        { char: 'К', name: 'ке', sound: '[k]', word: 'Китоб', translation: 'Книга' },
        { char: 'Қ', name: 'қе', sound: '[q]', word: 'Қалам', translation: 'Карандаш', tips: 'Буква К с хвостиком' },
        { char: 'Л', name: 'ле', sound: '[l]', word: 'Лола', translation: 'Тюльпан' },
        { char: 'М', name: 'ме', sound: '[m]', word: 'Модар', translation: 'Мама' },
        { char: 'Н', name: 'не', sound: '[n]', word: 'Нон', translation: 'Хлеб' },
        { char: 'О', name: 'о', sound: '[ɔ]', word: 'Офтоб', translation: 'Солнце' },
        { char: 'П', name: 'пе', sound: '[p]', word: 'Падар', translation: 'Отец' },
        { char: 'Р', name: 'ре', sound: '[r]', word: 'Раҳмат', translation: 'Спасибо' },
        { char: 'С', name: 'се', sound: '[s]', word: 'Салом', translation: 'Привет' },
        { char: 'Т', name: 'те', sound: '[t]', word: 'Тоҷикистон', translation: 'Таджикистан' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Умед', translation: 'Надежда' },
        { char: 'Ӯ', name: 'ӯ', sound: '[ɵ] (средний огубленный)', word: 'Ӯрдак', translation: 'Утка', tips: 'Буква У с макроном' },
        { char: 'Ф', name: 'фе', sound: '[f]', word: 'Фарзанд', translation: 'Дитя' },
        { char: 'Х', name: 'хе', sound: '[x]', word: 'Хона', translation: 'Дом' },
        { char: 'Ҳ', name: 'ҳе', sound: '[h]', word: 'Ҳаёт', translation: 'Жизнь', tips: 'Буква Х с нижним хвостиком' },
        { char: 'Ч', name: 'че', sound: '[tʃ]', word: 'Чой', translation: 'Чай' },
        { char: 'Ҷ', name: 'ҷе', sound: '[dʒ]', word: 'Ҷавон', translation: 'Молодой', tips: 'Буква Ч с хвостиком' },
        { char: 'Ш', name: 'ше', sound: '[ʃ]', word: 'Шаҳр', translation: 'Город' },
        { char: 'Ъ', name: 'аломати сакта', sound: '[ʔ] (гортанная смычка)', word: 'Шеър', translation: 'Стих' },
        { char: 'Э', name: 'э', sound: '[e]', word: 'Эҳтиром', translation: 'Уважение' },
        { char: 'Ю', name: 'йу', sound: '[ju]', word: 'Юнониён', translation: 'Греки' },
        { char: 'Я', name: 'йа', sound: '[ja]', word: 'Ягон', translation: 'Какой-нибудь' }
      ]
    }
  ]
};

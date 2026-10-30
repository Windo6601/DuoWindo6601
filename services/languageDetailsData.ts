export interface LanguageDetailInfo {
  id: string;
  name: string;
  localName: string;
  family: string;
  speakers: string;
  writingSystem: string;
  grammarHighlights: { ru: string; en: string }[];
  samplePhrases: { orig: string; transRu: string; transEn: string; translit?: string }[];
  funFact: { ru: string; en: string };
  difficultyRank: string;
  badge: string;
}

export const HARDEST_LANGUAGE_DETAILS: Record<string, LanguageDetailInfo> = {
  tab: {
    id: 'tab',
    name: 'Tabasaran',
    localName: 'Табасаранский (Табасаран чӏал)',
    family: 'Нахско-дагестанская семья (лезгинская ветвь)',
    speakers: '~130 000 человек (Дагестан, Россия)',
    writingSystem: 'Кириллица (специальные знаки с апострофами и глоттализацией)',
    grammarHighlights: [
      { ru: 'Рекорд Гиннесса: от 48 до 53 падежей существительных (в зависимости от диалекта).', en: 'Guinness Record: 48 to 53 noun cases depending on dialect.' },
      { ru: 'Сложные пространственные падежи (указывают точное направление: внутри, на поверхности, под, за углом).', en: 'Extricate spatial locative cases indicating precise directions.' },
      { ru: 'Эргативный строй предложения.', en: 'Ergative-absolutive alignment syntax.' }
    ],
    samplePhrases: [
      { orig: 'Салам! Фици вува?', transRu: 'Привет! Как поживаешь?', transEn: 'Hello! How are you?', translit: 'Salam! Fitsi vuva?' },
      { orig: 'Узу табасаран чIал аьгъю апIураза', transRu: 'Я изучаю табасаранский язык', transEn: 'I am learning Tabasaran language', translit: 'Uzu tabasaran chIal agyu apIuraza' },
      { orig: 'Баб ва дад ккунраза', transRu: 'Я люблю маму и папу', transEn: 'I love mom and dad', translit: 'Bab va dad kkunraza' }
    ],
    funFact: {
      ru: 'Занесен в Книгу рекордов Гиннесса как язык с самым большим количеством падежей в мире.',
      en: 'Listed in the Guinness Book of World Records as the language with the most noun cases in the world.'
    },
    difficultyRank: '#1',
    badge: '🏆 Рекорд Гиннесса'
  },
  cv: {
    id: 'cv',
    name: 'Chuvash',
    localName: 'Чувашский (Чӑвашла)',
    family: 'Тюркская семья (единственная живая огурская/булгарская ветвь)',
    speakers: '~1.1 миллиона человек (Чувашия, Россия)',
    writingSystem: 'Кириллица с 4 уникальными буквами: Ӑ, Ӗ, Ҫ, Ӳ',
    grammarHighlights: [
      { ru: 'Единственный сохранившийся представитель огурской ветви тюркских языков (отделился от общего тюркского праязыка более 2000 лет назад).', en: 'Sole surviving Oghur Turkic branch, separated over 2,000 years ago.' },
      { ru: 'Сингармонизм гласных и многоуровневая агглютинация суффиксов.', en: 'Vowel harmony and multi-layered suffix agglutination.' },
      { ru: 'Специфические фонетические звуки [ɒ̆] (Ӑ), [ɘ̆] (Ӗ), [ɕ] (Ҫ), [y] (Ӳ).', en: 'Unique phonetics: short central vowels and specific sibilants.' }
    ],
    samplePhrases: [
      { orig: 'Ырӑ кун! Мӗнле пурӑнатӑр?', transRu: 'Добрый день! Как поживаете?', transEn: 'Good day! How are you?', translit: 'Yra kun! Menle puranatar?' },
      { orig: 'Эпӗ чӑваш чӗлхине вӗренетӗп', transRu: 'Я изучаю чувашский язык', transEn: 'I am learning Chuvash', translit: 'Epe chuvash chelkhine verenetep' },
      { orig: 'Тавах сире пысӑк пулӑшушӑн', transRu: 'Спасибо вам за большую помощь', transEn: 'Thank you for the great help', translit: 'Tavakh sire pisak pulushushan' }
    ],
    funFact: {
      ru: 'Чувашский язык непонятен носителям других тюркских языков (казахского, турецкого, татарского) из-за уникального булгарского субстрата.',
      en: 'Chuvash is mutually unintelligible with other Turkic languages due to its distinct Bulgar roots.'
    },
    difficultyRank: '#2',
    badge: '👑 Уникальная ветвь булгар'
  },
  hu: {
    id: 'hu',
    name: 'Hungarian',
    localName: 'Венгерский (Magyar)',
    family: 'Уральская семья (угорская ветвь)',
    speakers: '~13 миллионов человек (Венгрия, ЕС)',
    writingSystem: 'Латиница с диакритическими знаками (умлауты, двойные акуты)',
    grammarHighlights: [
      { ru: 'От 18 до 35 падежей существительных (выражают движение внутрь, наружу, вдоль, над).', en: '18 to 35 noun cases expressing directional relations.' },
      { ru: 'Два спряжения глаголов (определенное и неопределенное) в зависимости от объекта.', en: 'Definite and indefinite verb conjugation systems.' },
      { ru: 'Сингармонизм гласных (суффиксы подстраиваются под гласные корня).', en: 'Strict vowel harmony governing suffix selection.' }
    ],
    samplePhrases: [
      { orig: 'Szia! Hogy vagy?', transRu: 'Привет! Как дела?', transEn: 'Hi! How are you?', translit: 'Szia! Hogy vagy?' },
      { orig: 'Tanulom a magyar nyelvet', transRu: 'Я учу венгерский язык', transEn: 'I am learning Hungarian', translit: 'Tanulom a magyar nyelvet' },
      { orig: 'Köszönöm szépen a segítséget', transRu: 'Большое спасибо за помощь', transEn: 'Thank you very much for help', translit: 'Koszonom szepen a segitseget' }
    ],
    funFact: {
      ru: 'Венгерский язык не принадлежит к индоевропейским языкам Европы; его ближайшие дальние родственники — манси и ханты в Сибири.',
      en: 'Hungarian is not Indo-European; its remote relatives are Mansi and Khanty in Siberia.'
    },
    difficultyRank: '#3',
    badge: '⚡ Уральский гигант'
  },
  eu: {
    id: 'eu',
    name: 'Basque',
    localName: 'Баскский (Euskara)',
    family: 'Язык-изолят (не имеет родственников в мире)',
    speakers: '~750 000 человек (Страна Басков, Испания/Франция)',
    writingSystem: 'Латиница',
    grammarHighlights: [
      { ru: 'Язык-изолят: древнейший живой язык Европы, чье происхождение до конца не разгадано.', en: 'Language isolate: Europe’s oldest living language with unknown origin.' },
      { ru: 'Эргативная конструкция предложения (подлежащее непереходного глагола стоит в том же падеже, что и дополнение переходного).', en: 'Ergative-absolutive alignment syntax.' },
      { ru: 'Полиперсональное спряжение глаголов (глагол кодирует подлежащее, прямое и косвенное дополнения одновременно).', en: 'Polypersonal verb conjugation.' }
    ],
    samplePhrases: [
      { orig: 'Kaixo! Zer moduz?', transRu: 'Привет! Как дела?', transEn: 'Hello! How are you?', translit: 'Kaixo! Zer moduz?' },
      { orig: 'Euskara ikasten ari naiz', transRu: 'Я изучаю баскский язык', transEn: 'I am learning Basque', translit: 'Euskara ikasten ari naiz' },
      { orig: 'Eskerrik asko zure laguntzagatik', transRu: 'Большое спасибо за помощь', transEn: 'Thank you for your help', translit: 'Eskerrik asko zure laguntzagatik' }
    ],
    funFact: {
      ru: 'Баски — один из самых загадочных народов Европы, а их язык не родственен ни одному известному языку планеты.',
      en: 'Basque has no linguistic relatives anywhere on Earth (language isolate).'
    },
    difficultyRank: '#4',
    badge: '🗿 Древний изолят'
  },
  fi: {
    id: 'fi',
    name: 'Finnish',
    localName: 'Финский (Suomi)',
    family: 'Уральская семья (прибалтийско-финская ветвь)',
    speakers: '~5.5 миллионов человек (Финляндия)',
    writingSystem: 'Латиница',
    grammarHighlights: [
      { ru: '15 падежей существительных.', en: '15 noun cases.' },
      { ru: 'Чередование ступеней согласных (сильная и слабая ступени корня при склонении).', en: 'Consonant gradation (K-P-T mutations).' },
      { ru: 'Отсутствие предлогов (их заменяют послелоги и падежные окончания).', en: 'No prepositions (postpositions and case endings instead).' }
    ],
    samplePhrases: [
      { orig: 'Hei! Mitä kuuluu?', transRu: 'Привет! Как дела?', transEn: 'Hi! How are you?', translit: 'Hei! Mita kuuluu?' },
      { orig: 'Minä rakastan suomen kieltä', transRu: 'Я люблю финский язык', transEn: 'I love Finnish language', translit: 'Mina rakastan suomen kielda' },
      { orig: 'Kiitos paljon avusta', transRu: 'Большое спасибо за помощь', transEn: 'Thank you very much for help', translit: 'Kiitos paljon avusta' }
    ],
    funFact: {
      ru: 'В финском языке нет категории будущего времени — все действия в будущем выражаются через настоящее время с контекстом.',
      en: 'Finnish has no future tense; future events are expressed using the present tense.'
    },
    difficultyRank: '#5',
    badge: '❄️ 15 падежей'
  },
  nv: {
    id: 'nv',
    name: 'Navajo',
    localName: 'Навахо (Diné bizaad)',
    family: 'На-дене семья',
    speakers: '~170 000 человек (Юго-Запад США)',
    writingSystem: 'Латиница со специфическими тональными и назальными знаками',
    grammarHighlights: [
      { ru: 'Полисинтетический строй (одно слово-глагол может выражать целое предложение с подлежащим, временем и обстоятельствами).', en: 'Polysynthetic verbs packing entire clauses into single words.' },
      { ru: 'Четыре тона (высокий, низкий, восходящий, нисходящий), меняющих смысл слова.', en: 'Four distinctive tones changing word meanings.' },
      { ru: 'Классификаторы глаголов в зависимости от формы, физического состояния и одушевленности объекта.', en: 'Verb classifiers based on object shape and animacy.' }
    ],
    samplePhrases: [
      { orig: 'Yáʼátʼééh! Haash yinilyé?', transRu: 'Привет! Как тебя зовут?', transEn: 'Hello! What is your name?', translit: 'Ya ateeh! Haash yinilye?' },
      { orig: 'Diné bizaad bídahwiilʼaah', transRu: 'Мы изучаем язык навахо', transEn: 'We are learning Navajo', translit: 'Dine bizaad bidahwiilaah' },
      { orig: 'Ahéheeʼ nitsʼą́ą́dóó', transRu: 'Спасибо тебе за помощь', transEn: 'Thank you for help', translit: 'Ahehee nitsaadoo' }
    ],
    funFact: {
      ru: 'Во время Второй мировой войны шифровальщики-навахо использовали свой язык как абсолютно нераскрываемый шифр для армии США.',
      en: 'Navajo Code Talkers served in WWII using their language as an unbreakable military cipher.'
    },
    difficultyRank: '#6',
    badge: '🪶 Язык шифровальщиков'
  },
  is: {
    id: 'is',
    name: 'Icelandic',
    localName: 'Исландский (Íslenska)',
    family: 'Индоевропейская семья (германская ветвь)',
    speakers: '~380 000 человек (Исландия)',
    writingSystem: 'Латиница с древнескандинавскими буквами (Þ, Ð, Æ)',
    grammarHighlights: [
      { ru: 'Строгий пуризм: язык почти не заимствует международные слова, а создает новые термины из древних корней.', en: 'Strict linguistic purism replacing loanwords with native Icelandic roots.' },
      { ru: 'Сохранил сложную древнескандинавскую падежную морфологию (4 падежа, 3 рода).', en: 'Preserved archaic Old Norse case morphology (4 cases, 3 genders).' },
      { ru: 'Сложное произношение сочетаний согласных.', en: 'Complex consonant cluster pronunciations.' }
    ],
    samplePhrases: [
      { orig: 'Halló! Hvað heitir þú?', transRu: 'Привет! Как тебя зовут?', transEn: 'Hello! What is your name?', translit: 'Hallo! Hvad heitir thu?' },
      { orig: 'Ég tala smá íslensku', transRu: 'Я немного говорю по-исландски', transEn: 'I speak a little Icelandic', translit: 'Eg tala sma islensku' },
      { orig: 'Takk fyrir hjálpina', transRu: 'Спасибо за помощь', transEn: 'Thanks for the help', translit: 'Takk fyrir hjalpina' }
    ],
    funFact: {
      ru: 'Современные исландцы могут свободно читать древние саги XIII века в оригинале без словарей.',
      en: 'Modern Icelanders can easily read 13th-century Norse sagas in original text.'
    },
    difficultyRank: '#7',
    badge: '⚔️ Язык викингов'
  },
  pl: {
    id: 'pl',
    name: 'Polish',
    localName: 'Польский (Polski)',
    family: 'Индоевропейская семья (славянская ветвь)',
    speakers: '~45 миллионов человек (Польша, диаспора)',
    writingSystem: 'Латиница с диакритикой (ą, ę, ś, ć, ł, ż, ź)',
    grammarHighlights: [
      { ru: '7 падежей существительных и прилагательных.', en: '7 noun and adjective cases.' },
      { ru: 'Сложные ряды шипящих звуков и скопления согласных (np. szczebrzeszynie, w Szczebrzeszynie).', en: 'Dense consonant clusters and sibilant harmony.' },
      { ru: 'Система совершенного и несовершенного вида глаголов.', en: 'Complex verbal aspect system.' }
    ],
    samplePhrases: [
      { orig: 'Cześć! Jak się masz?', transRu: 'Привет! Как дела?', transEn: 'Hi! How are you?', translit: 'Czesht! Jak sie mash?' },
      { orig: 'Uczę się języka polskiego', transRu: 'Я изучаю польский язык', transEn: 'I am learning Polish', translit: 'Uche se jeyika polskiego' },
      { orig: 'Dziękuję bardzo za pomoc', transRu: 'Большое спасибо за помощь', transEn: 'Thank you very much for help', translit: 'Dyenkuje bardzo za pomoc' }
    ],
    funFact: {
      ru: 'Фраза «W Szczebrzeszynie chrząszcz brzmi w trzcinie» является классической скороговоркой для проверки дикции.',
      en: 'The sentence about the beetle buzzing in Szczebrzeszyn is a legendary Polish tongue twister.'
    },
    difficultyRank: '#8',
    badge: '🌪️ Фонетический шторм'
  },
  ja: {
    id: 'ja',
    name: 'Japanese',
    localName: 'Японский (日本語)',
    family: 'Японская семья',
    speakers: '~125 миллионов человек (Япония)',
    writingSystem: 'Кандзи (китайские иероглифы) + Хирагана + Катакана',
    grammarHighlights: [
      { ru: 'Три параллельные системы письменности.', en: 'Three concurrent writing systems.' },
      { ru: 'Система уважительности и вежливости (Кейго: сонкего, кенҷōго, тейнеиго).', en: 'Intricate keigo honorific speech levels.' },
      { ru: 'Порядок слов SOV (глагол всегда в конце предложения).', en: 'SOV word order with verbs at sentence end.' }
    ],
    samplePhrases: [
      { orig: 'こんにちは！お元気ですか？', transRu: 'Здравствуйте! Как вы поживаете?', transEn: 'Hello! How are you?', translit: 'Konnichiwa! Ogenki desu ka?' },
      { orig: '私は日本語を勉強しています', transRu: 'Я изучаю японский язык', transEn: 'I am studying Japanese', translit: 'Watashi wa nihongo o benkyou shite imasu' },
      { orig: 'ありがとうございます', transRu: 'Большое спасибо', transEn: 'Thank you very much', translit: 'Arigatou gozaimasu' }
    ],
    funFact: {
      ru: 'В японском языке счётные суффиксы меняются в зависимости от формы предмета (плоские, длинные, мелкие, животные).',
      en: 'Japanese uses different counter words depending on the shape and category of objects.'
    },
    difficultyRank: '#9',
    badge: '🏯 3 системы письма'
  },
  zh: {
    id: 'zh',
    name: 'Chinese',
    localName: 'Китайский (中文 / 普通话)',
    family: 'Сино-тибетская семья',
    speakers: '~1.4 миллиарда человек (Китай, мир)',
    writingSystem: 'Иероглифика (Ханьцзы: упрощенные и традиционные)',
    grammarHighlights: [
      { ru: 'Четыре основных тона + нейтральный тон (изменение тона меняет значение слова).', en: 'Four core tones plus neutral tone changing semantic meaning.' },
      { ru: 'Отсутствие падежей, родов и времен (время выражается контекстными словами и частицами).', en: 'No grammatical cases, genders, or verb tenses.' },
      { ru: 'Десятки тысяч логографических иероглифов.', en: 'Tens of thousands of logographic characters.' }
    ],
    samplePhrases: [
      { orig: '你好！你 身体 怎么样？', transRu: 'Привет! Как твое здоровье?', transEn: 'Hello! How is your health?', translit: 'Nǐ hǎo! Nǐ shēntǐ zěnme yàng?' },
      { orig: '我 正在 学习 中文', transRu: 'Я изучаю китайский язык', transEn: 'I am learning Chinese', translit: 'Wǒ zhèngzài xuéxí zhōngwén' },
      { orig: '非常 感谢 你的 帮助', transRu: 'Большое спасибо за твою помощь', transEn: 'Thank you very much for your help', translit: 'Fēicháng gǎnxiè nǐ de bāngzhù' }
    ],
    funFact: {
      ru: 'Для свободного чтения газеты на китайском языке необходимо знать около 3000 иероглифов.',
      en: 'Knowing around 3,000 characters is required to read a Chinese newspaper fluently.'
    },
    difficultyRank: '#10',
    badge: '🏮 Тоновая иероглифика'
  },
  ar: {
    id: 'ar',
    name: 'Arabic',
    localName: 'Арабский (العربية)',
    family: 'Афразийская семья (семитская ветвь)',
    speakers: '~420 миллионов человек (Ближний Восток, Северная Африка)',
    writingSystem: 'Арабское письмо (абджад, справа налево)',
    grammarHighlights: [
      { ru: 'Трёхсогласный корневой принцип (большинство слов образуются от трехбуквенных корней по шаблонам).', en: 'Triconsonantal root morphology system.' },
      { ru: 'Письмо справа налево без заглавных букв.', en: 'Right-to-left abjad script without capital letters.' },
      { ru: 'Двойственное число существительных и глаголов (помимо единственного и множественного).', en: 'Dual grammatical number alongside singular and plural.' }
    ],
    samplePhrases: [
      { orig: 'مهلاً! كيف حالك؟', transRu: 'Привет! Как дела?', transEn: 'Hello! How are you?', translit: 'Marhaban! Kayfa haluka?' },
      { orig: 'أنا أتعلم اللغة العربية', transRu: 'Я учу арабский язык', transEn: 'I am learning Arabic', translit: 'Ana ataallamu allughata alarabiyya' },
      { orig: 'شكراً جزيلاً لك على المساعدة', transRu: 'Большое спасибо за помощь', transEn: 'Thank you very much for help', translit: 'Shukran jazilan laka ala almusada' }
    ],
    funFact: {
      ru: 'В арабском алфавите буквы меняют свою форму написания в зависимости от позиции в слове (начальная, серединная, конечная, изолированная).',
      en: 'Arabic letters change their shape depending on their position in a word (initial, medial, final, isolated).'
    },
    difficultyRank: '#11',
    badge: '📜 Трёхсогласный корень'
  },
  ko: {
    id: 'ko',
    name: 'Korean',
    localName: 'Корейский (한국어)',
    family: 'Корейская языковая семья',
    speakers: '~80 миллионов человек (Корея)',
    writingSystem: 'Хангыль (фонетическое письмо, созданное в 1443 году)',
    grammarHighlights: [
      { ru: 'Семь уровней вежливости и уважительности речи (от официального до разговорного и панмар).', en: 'Seven distinct speech levels reflecting social hierarchy.' },
      { ru: 'Порядок слов SOV (глагол в конце предложения).', en: 'SOV word order.' },
      { ru: 'Агглютинативная морфология с падежными частицами-послелогами.', en: 'Agglutinative structure with postpositional particles.' }
    ],
    samplePhrases: [
      { orig: '안녕하세요! 어떻게 지내세요?', transRu: 'Здравствуйте! Как поживаете?', transEn: 'Hello! How are you doing?', translit: 'Annyeonghaseyo! Eotteoke jinaeseyo?' },
      { orig: '저는 한국어를 배우고 있습니다', transRu: 'Я изучаю корейский язык', transEn: 'I am learning Korean', translit: 'Jeoneun hangugeoreul baeugo itseumnida' },
      { orig: '도움을 주셔서 감사합니다', transRu: 'Спасибо за помощь', transEn: 'Thank you for your help', translit: 'Doumeul jusyeoseo gamsahamnida' }
    ],
    funFact: {
      ru: 'Алфавит Хангыль считается одним из самых научно продуманных и совершенных алфавитов в мире (создан королем Сечжоном в 1443 г.).',
      en: 'Hangul is acclaimed by linguists as one of the most scientifically designed writing systems ever created.'
    },
    difficultyRank: '#12',
    badge: '🎎 Иерархия вежливости'
  },
  eo: {
    id: 'eo',
    name: 'Esperanto',
    localName: 'Эсперанто (Esperanto)',
    family: 'Плановый международный язык (регулярная грамматика)',
    speakers: '~2 000 000 человек (более 120 стран мира, сообщество эсперантистов)',
    writingSystem: 'Латиница из 28 букв, 100% фонетический принцип: как пишется, так и читается (1 буква = 1 звук)',
    grammarHighlights: [
      { ru: 'Рекорд Гиннесса и ЮНЕСКО: ровно 16 фундаментальных правил без единого исключения (0 неправильных глаголов!).', en: 'Guinness & UNESCO record: exactly 16 fundamental rules with zero exceptions (0 irregular verbs!).' },
      { ru: 'Чёткие окончания частей речи: существительные на -o (domo), прилагательные на -a (bela), наречия на -e (bone), глаголы на -i (lerni).', en: 'Strict part-of-speech endings: nouns end in -o, adjectives in -a, adverbs in -e, verb infinitives in -i.' },
      { ru: 'Единые времена глаголов: настоящее -as (mi lernas), прошедшее -is (mi lernis), будущее -os (mi lernos) для всех лиц и чисел.', en: 'Universal verb tense suffixes: present -as, past -is, future -os across all persons and numbers.' },
      { ru: 'Логический конструктор слов: зная 1 корень и суффиксы, можно образовать десятки слов (san-a = здоровый, mal-san-a = больной, mal-san-ul-ej-o = больница).', en: 'Transparent word building: prefixes and suffixes derive dozens of words from a single root effortlessly.' }
    ],
    samplePhrases: [
      { orig: 'Saluton! Kiel vi fartas?', transRu: 'Привет! Как ваши дела?', transEn: 'Hello! How are you?', translit: 'Салютон! Киэль ви фартас?' },
      { orig: 'Mi lernas Esperanton — la plej facilan lingvon en la mondo', transRu: 'Я изучаю эсперанто — самый лёгкий язык в мире', transEn: 'I am learning Esperanto — the easiest language in the world', translit: 'Ми лэрнас Эспэрантон — ла плэй фацилан лингвон эн ла мондо' },
      { orig: 'Dankon al vi pro via granda helpo!', transRu: 'Большое спасибо вам за помощь!', transEn: 'Thank you very much for your help!', translit: 'Данкон ал ви про виа гранда хэльпо!' },
      { orig: 'Esperanto estas mirinde facila kaj bela lingvo', transRu: 'Эсперанто — удивительно лёгкий и красивый язык', transEn: 'Esperanto is an amazingly easy and beautiful language', translit: 'Эспэранто эстас мириндэ фацила кай бэла лингво' }
    ],
    funFact: {
      ru: 'Эсперанто официально признан ЮНЕСКО и занесен в лингвистические справочники как самый лёгкий язык для изучения на планете: он усваивается в 4–5 раз быстрее любого естественного языка благодаря полному отсутствию исключений!',
      en: 'Esperanto is recognized by UNESCO and Guinness as the easiest language to learn in the world, requiring 4-5 times less study time than any natural language thanks to zero grammatical exceptions.'
    },
    difficultyRank: '№1 Самый лёгкий в мире',
    badge: '🏆 Рекорд простоты: 0 исключений'
  },
  id: {
    id: 'id',
    name: 'Indonesian',
    localName: 'Индонезийский (Bahasa Indonesia)',
    family: 'Австронезийская семья (малайско-полинезийская ветвь)',
    speakers: '~300 миллионов человек (Индонезия)',
    writingSystem: 'Стандартная латиница (26 букв без диакритики), строгое фонетическое чтение',
    grammarHighlights: [
      { ru: 'Полное отсутствие спряжения глаголов: форма глагола никогда не меняется по лицам, числам или родам (saya makan - я ем, kamu makan - ты ешь, mereka makan - они едят).', en: 'No verb conjugations: verb forms never change for person, number, or gender.' },
      { ru: 'Нет грамматических времён: вместо сложных окончаний используются простые слова-маркеры времени (kemarin - вчера, sudah - уже, besok - завтра).', en: 'No verb tenses: time is indicated using simple aspect words like yesterday, already, or tomorrow.' },
      { ru: 'Нет грамматического рода и падежей: нет артиклей вроде the/a, нет окончаний родительного, дательного или винительного падежей.', en: 'No grammatical gender, no noun cases, and no articles.' },
      { ru: 'Множественное число образуется простым удвоением слова: anak (ребёнок) -> anak-anak (дети), orang (человек) -> orang-orang (люди).', en: 'Plurals are formed by simple reduplication: anak (child) -> anak-anak (children).' }
    ],
    samplePhrases: [
      { orig: 'Halo! Apa kabar?', transRu: 'Привет! Как дела?', transEn: 'Hello! How are you?', translit: 'Хало! Апа кабар?' },
      { orig: 'Saya belajar bahasa Indonesia, bahasa yang sangat mudah', transRu: 'Я изучаю индонезийский язык, очень простой язык', transEn: 'I am learning Indonesian, a very easy language', translit: 'Сая бэладжар бахаса Индонезиа' },
      { orig: 'Terima kasih banyak atas bantuannya', transRu: 'Большое спасибо за помощь', transEn: 'Thank you very much for help', translit: 'Терима касих баньяк' },
      { orig: 'Selamat pagi dan selamat belajar!', transRu: 'Доброе утро и приятной учёбы!', transEn: 'Good morning and happy learning!', translit: 'Селамат паги дан селамат беладжар!' }
    ],
    funFact: {
      ru: 'Среди всех естественных государственных языков мира индонезийский признан лингвистами самым простым для изучения: в нём нет родов, нет падежей, нет спряжений и используется простая латиница.',
      en: 'Among all natural national languages, Indonesian is recognized by linguists as the simplest to learn: no grammatical gender, no cases, no verb conjugations, and standard Latin alphabet.'
    },
    difficultyRank: '№1 Естественный язык',
    badge: '🌴 Самый лёгкий естественный язык'
  },
  es: {
    id: 'es',
    name: 'Spanish',
    localName: 'Испанский (Español)',
    family: 'Индоевропейская семья (романская группа)',
    speakers: '~550 миллионов человек (20+ стран мира)',
    writingSystem: 'Латиница с диакритикой ударений (á, é, í, ó, ú, ñ). 100% регулярные правила чтения',
    grammarHighlights: [
      { ru: 'Фонетическая орфография: почти все буквы читаются строго однозначно, ударения графически обозначены.', en: 'Phonetic spelling: predictable pronunciation and explicit accent marks.' },
      { ru: 'Огромный интернациональный словарный запас: тысячи родственных слов с русским и английским языками.', en: 'Massive cognate vocabulary shared with international languages.' },
      { ru: 'Логичные грамматические спряжения по 3 спряжениям (-ar, -er, -ir) с устойчивыми моделями.', en: 'Clean verb conjugation patterns based on three regular paradigms.' },
      { ru: 'Отсутствие падежей существительных: связь слов передаётся простыми предлогами.', en: 'No nominal cases: syntax is handled via intuitive prepositions.' }
    ],
    samplePhrases: [
      { orig: '¡Hola! ¿Cómo estás?', transRu: 'Привет! Как дела?', transEn: 'Hello! How are you?', translit: 'Ола! Комо эстас?' },
      { orig: 'Aprender español es muy fácil y divertido', transRu: 'Учить испанский очень легко и весело', transEn: 'Learning Spanish is very easy and fun', translit: 'Апрәндэр эспаньоль эс муй фасиль и дивэртидо' },
      { orig: 'Muchas gracias por su atención', transRu: 'Большое спасибо за ваше внимание', transEn: 'Thank you very much for your attention', translit: 'Мучас грасиас пор су атэнсьон' },
      { orig: '¡Vamos a aprender juntos!', transRu: 'Пойдёмте учиться вместе!', transEn: 'Let us learn together!', translit: 'Вамос а апрәндэр хунтос!' }
    ],
    funFact: {
      ru: 'Институт FSI (США) признал испанский одним из самых быстро осваиваемых языков в мире (категория I: всего ~600 часов для свободного владения).',
      en: 'The US Foreign Service Institute categorizes Spanish in Category I — among the fastest languages to achieve professional proficiency (approx. 600 hours).'
    },
    difficultyRank: 'ТОП-3 Простых',
    badge: '🇪🇸 Самый популярный лёгкий'
  },
  it: {
    id: 'it',
    name: 'Italian',
    localName: 'Итальянский (Italiano)',
    family: 'Индоевропейская семья (италийская / романская группа)',
    speakers: '~85 миллионов человек (Италия, Швейцария, ЕС)',
    writingSystem: 'Латиница из 21 буквы, максимально музыкальная и открытая фонетика',
    grammarHighlights: [
      { ru: 'Кристально чистые гласные: слова почти всегда заканчиваются на гласный звук, что дарит непревзойдённую мелодичность.', en: 'Pure vowel endings: words almost always terminate in open vowels for supreme musical clarity.' },
      { ru: 'Прямолинейные правила произношения: буквы c и g читаются предсказуемо перед e/i и a/o/u.', en: 'Highly straightforward phonetics with clear consonant pairing rules.' },
      { ru: 'Всего два грамматических рода: мужской (-o) и женский (-a), простое образование множественного (-i, -e).', en: 'Only two genders: masculine (-o) and feminine (-a), with transparent plurals (-i, -e).' },
      { ru: 'Никаких падежей: прямой порядок слов в предложении облегчает свободное общение с первых дней.', en: 'No nominal cases: natural sentence order makes speaking effortless.' }
    ],
    samplePhrases: [
      { orig: 'Ciao! Come va?', transRu: 'Привет! Как дела?', transEn: 'Hi! How is it going?', translit: 'Чао! Комэ ва?' },
      { orig: 'Imparare l’italiano è un vero piacere', transRu: 'Учить итальянский — настоящее удовольствие', transEn: 'Learning Italian is a true pleasure', translit: 'Импарарэ литальяно э ун вэро пьячэрэ' },
      { orig: 'Grazie mille per il tuo aiuto!', transRu: 'Тысяча благодарностей за твою помощь!', transEn: 'Thanks a million for your help!', translit: 'Грацие миллэ пэр иль туо айюто!' },
      { orig: 'La vita è bella!', transRu: 'Жизнь прекрасна!', transEn: 'Life is beautiful!', translit: 'Ла вита э бэлла!' }
    ],
    funFact: {
      ru: 'Итальянский считается самым благозвучным языком на Земле: соотношение гласных к согласным здесь близко к 1:1, благодаря чему слова льются гладко и запоминаются мгновенно.',
      en: 'Italian is considered the most melodious language on Earth, with near 1:1 vowel-to-consonant distribution allowing words to flow musically and stick easily.'
    },
    difficultyRank: 'ТОП-4 Простых',
    badge: '🇮🇹 Музыкальная простота'
  },
  ka: {
    id: 'ka',
    name: 'Georgian',
    localName: 'Грузинский (ქართული ენა)',
    family: 'Картвельская семья (южнокавказская группа)',
    speakers: '~4 миллиона человек (Грузия, диаспора)',
    writingSystem: 'Мхедрули (грузинский алфавит из 33 уникальных букв)',
    grammarHighlights: [
      { ru: 'Сложнейший государственный язык стран бывшего СССР и СНГ: полиперсональное спряжение глаголов (глагол согласуется одновременно с субъектом, прямым и косвенным объектами).', en: 'Most complex national language of the post-Soviet/CIS space: polypersonal agreement encoding subject, direct, and indirect objects simultaneously in the verb.' },
      { ru: 'Эргативно-номинативный строй предложения: падеж подлежащего меняется в зависимости от временной серии глагола и его переходности.', en: 'Split-ergative syntax: noun case marking shifts depending on verb tense series and transitivity.' },
      { ru: 'Экстремальные консонантные кластеры: скопления до 6-8 согласных подряд без единой гласной (например, «гвпртсквни» — ты ощипываешь нас).', en: 'Extreme consonant clusters: up to 6-8 consonants in a row without vowels (e.g. gvprtskvni).' },
      { ru: '7 падежей существительных и развитая система пространственных превербов направления движения.', en: '7 noun cases and directional verbal preverbs.' }
    ],
    samplePhrases: [
      { orig: 'გამარჯობა! როგორ ხარ?', transRu: 'Привет! Как дела?', transEn: 'Hello! How are you?', translit: 'Гамарджоба! Рогор хар?' },
      { orig: 'მე ვსწავლობ ქართულ ენას — ურთულეს და ულამაზეს ენას', transRu: 'Я изучаю грузинский — сложнейший и прекраснейший язык', transEn: 'I am learning Georgian — a complex and beautiful language', translit: 'Ме всцавлоб картул энас' },
      { orig: 'დიდი მადლობა დახმარებისთვის!', transRu: 'Большое спасибо за помощь!', transEn: 'Thank you very much for help!', translit: 'Диди мадлоба дахмаребиствис!' },
      { orig: 'საქართველო ულამაზესი ქვეყანაა', transRu: 'Грузия — прекраснейшая страна', transEn: 'Georgia is a gorgeous country', translit: 'Сакартвело уламазеси квеканаа' }
    ],
    funFact: {
      ru: 'Грузинский признан лингвистами самым грамматически сложным среди государственных языков стран бывшего СССР / СНГ: в одном слове-глаголе может одновременно выражаться субъект, объект, адресат и направленность действия!',
      en: 'Georgian is ranked by linguists as the most grammatically intricate national language among post-Soviet states, encoding subject, object, and recipient in a single verb.'
    },
    difficultyRank: '№1 Гос. язык экс-СССР',
    badge: '🇬🇪 Сложнейший гос. язык СНГ'
  },
  hy: {
    id: 'hy',
    name: 'Armenian',
    localName: 'Армянский (Հայերեն)',
    family: 'Индоевропейская семья (обособленная самостоятельная ветвь)',
    speakers: '~7 миллионов человек (Армения, диаспора)',
    writingSystem: 'Армянский алфавит из 39 букв (создан Месропом Маштоцем в 405 г.)',
    grammarHighlights: [
      { ru: 'Особая обособленная ветвь индоевропейской семьи: не имеет близких живых родственников среди других европейских ветвей.', en: 'Independent single-member branch of the Indo-European language family.' },
      { ru: '7 падежей существительных с развитой агглютинативно-флективной системой склонения.', en: '7 noun cases with distinctive agglutinative nominal declension.' },
      { ru: 'Уникальная древняя письменность: 39 самобытных букв, передающих тончайшие фонетические нюансы.', en: 'Unique ancient script of 39 letters created by Mesrop Mashtots in 405 AD.' }
    ],
    samplePhrases: [
      { orig: 'Բարև ձեզ! Ինչպե՞ս եք:', transRu: 'Здравствуйте! Как вы поживаете?', transEn: 'Hello! How are you?', translit: 'Барев дзез! Инчпес ек?' },
      { orig: 'Ես սովորում եմ հայերեն', transRu: 'Я изучаю армянский язык', transEn: 'I am learning Armenian', translit: 'Ес соворум ем хайерен' },
      { orig: 'Շատ շնորհակալություն օգնության համար!', transRu: 'Большое спасибо за вашу помощь!', transEn: 'Thank you very much for your help!', translit: 'Шат шнорхакалутюн огнутян хамар!' }
    ],
    funFact: {
      ru: 'Армянский алфавит Месропа Маштоца существует практически в неизменном виде с 405 года — более 1600 лет непрерывной письменной истории!',
      en: 'The Armenian alphabet created by Mesrop Mashtots has endured virtually unchanged since 405 AD — over 1,600 years of literary history.'
    },
    difficultyRank: 'ТОП сложность Кавказа',
    badge: '🇦🇲 1600 лет алфавита Маштоца'
  }
};

export const EASIEST_LANGUAGE_DETAILS: Record<string, LanguageDetailInfo> = {
  eo: HARDEST_LANGUAGE_DETAILS.eo,
  id: HARDEST_LANGUAGE_DETAILS.id,
  es: HARDEST_LANGUAGE_DETAILS.es,
  it: HARDEST_LANGUAGE_DETAILS.it
};

export const CIS_HARDEST_LANGUAGE_DETAILS: Record<string, LanguageDetailInfo> = {
  tab: HARDEST_LANGUAGE_DETAILS.tab,
  ka: HARDEST_LANGUAGE_DETAILS.ka,
  cv: HARDEST_LANGUAGE_DETAILS.cv,
  hy: HARDEST_LANGUAGE_DETAILS.hy,
};


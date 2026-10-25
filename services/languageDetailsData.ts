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
  }
};

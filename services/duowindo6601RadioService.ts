import { Course } from '../types';
import { callServerGemini, MODEL_FREE } from './geminiService';

export interface DuoRadioCue {
  id: string;
  speaker: string;
  avatar: string;
  role: 'host' | 'character';
  /** True when the host gives intro/context/tip in the user's familiar language */
  isFamiliarLang: boolean;
  text: string;
  translationRu: string;
  translationEn: string;
  noteRu?: string;
  noteEn?: string;
}

export interface DuoRadioQuestion {
  id: string;
  /** 'mid' = mid-episode listening checkpoint, 'final' = post-episode comprehension */
  stage: 'mid' | 'final';
  afterCueIndex: number;
  replayCueIndex: number;
  questionRu: string;
  questionEn: string;
  optionsRu: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationRu: string;
  explanationEn: string;
}

export interface DuoRadioEpisode {
  id: string;
  courseId: string;
  showNameRu: string;
  showNameEn: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  hostName: string;
  durationLabel: string;
  levelBadge: string;
  icon: string;
  isAiGenerated?: boolean;
  cues: DuoRadioCue[];
  questions: DuoRadioQuestion[];
}

interface TargetLanguageTemplate {
  c1HelloMorning: string;
  c1WantCoffee: string;
  c1NoJuice: string;
  c1GreatIdea: string;
  c2LostTrain: string;
  c2LookHand: string;
  c2HahaFound: string;
  c3OrderTea: string;
  c3BlueCup: string;
  c3VeryTasty: string;
}

const TARGET_TEMPLATES: Record<string, TargetLanguageTemplate> = {
  en: {
    c1HelloMorning: 'Good morning, listeners! Today we are talking about breakfast.',
    c1WantCoffee: 'I usually drink a big cup of coffee and eat warm toast.',
    c1NoJuice: 'Wait, DuoWindo6601! Today I want fresh orange juice instead of coffee!',
    c1GreatIdea: 'That sounds delicious and very healthy, my friend!',
    c2LostTrain: 'Excuse me, where does the fast train to the city center leave from?',
    c2LookHand: 'Platform four! Look at the blue clock above the ticket desk.',
    c2HahaFound: 'Thank you so much! My train leaves in five minutes.',
    c3OrderTea: 'Welcome to our radio cafe! Would you like green tea or hot chocolate?',
    c3BlueCup: 'I would like green tea in a large blue cup, please.',
    c3VeryTasty: 'Here you go! Enjoy the music and your warm tea.'
  },
  es: {
    c1HelloMorning: '¡Buenos días a todos! Hoy hablamos sobre el desayuno favorito.',
    c1WantCoffee: 'Normalmente tomo una taza grande de café con pan tostado.',
    c1NoJuice: '¡Espera, DuoWindo6601! Hoy prefiero jugo de naranja fresco.',
    c1GreatIdea: '¡Qué buena idea y qué desayuno tan saludable, amigo!',
    c2LostTrain: 'Disculpe, ¿de qué andén sale el tren rápido al centro?',
    c2LookHand: '¡Del andén número cuatro! Mire el reloj azul sobre la taquilla.',
    c2HahaFound: '¡Muchas gracias! Mi tren sale en cinco minutos.',
    c3OrderTea: '¡Bienvenidos al café de la radio! ¿Prefiere té verde o chocolate?',
    c3BlueCup: 'Quisiera un té verde en la taza azul grande, por favor.',
    c3VeryTasty: '¡Aquí tiene! Disfrute de la música y de su té.'
  },
  fr: {
    c1HelloMorning: 'Bonjour à tous ! Aujourd’hui, nous parlons du petit déjeuner.',
    c1WantCoffee: 'D’habitude, je bois une grande tasse de café avec du pain grillé.',
    c1NoJuice: 'Attends, DuoWindo6601 ! Aujourd’hui, je veux du jus d’orange frais.',
    c1GreatIdea: 'C’est une excellente idée, très saine pour la journée !',
    c2LostTrain: 'Excusez-moi, de quel quai part le train rapide pour le centre-ville ?',
    c2LookHand: 'Du quai numéro quatre ! Regardez l’horloge bleue près du guichet.',
    c2HahaFound: 'Merci beaucoup ! Mon train part dans cinq minutes.',
    c3OrderTea: 'Bienvenue au café radio ! Voulez-vous du thé vert ou du chocolat chaud ?',
    c3BlueCup: 'Je voudrais un thé vert dans une grande tasse bleue, s’il vous plaît.',
    c3VeryTasty: 'Voici votre commande ! Profitez bien de la musique.'
  },
  de: {
    c1HelloMorning: 'Guten Morgen, liebe Hörer! Heute sprechen wir über das Frühstück.',
    c1WantCoffee: 'Normalerweise trinke ich eine große Tasse Kaffee zum Toast.',
    c1NoJuice: 'Warte, DuoWindo6601! Heute möchte ich frischen Orangensaft trinken!',
    c1GreatIdea: 'Das klingt wirklich lecker und sehr gesund, mein Freund!',
    c2LostTrain: 'Entschuldigung, von welchem Gleis fährt der Schnellzug ins Zentrum?',
    c2LookHand: 'Von Gleis vier! Schauen Sie auf die blaue Uhr über dem Schalter.',
    c2HahaFound: 'Vielen Dank! Mein Zug fährt in genau fünf Minuten ab.',
    c3OrderTea: 'Willkommen im Radio-Café! Möchten Sie grünen Tee oder Kakao?',
    c3BlueCup: 'Ich hätte gern einen grünen Tee in der großen blauen Tasse, bitte.',
    c3VeryTasty: 'Bitte schön! Viel Spaß beim Zuhören!'
  },
  ja: {
    c1HelloMorning: 'おはようございます！今日のテーマは朝ごはんです。',
    c1WantCoffee: 'いつも大きなカップでコーヒーを飲んで、トーストを食べます。',
    c1NoJuice: 'ちょっと待って！今日はコーヒーじゃなくてオレンジジュースが飲みたいです。',
    c1GreatIdea: 'それはとても健康的で素敵ですね！',
    c2LostTrain: 'すみません、市内中心部行きの急行列車は何番線から出ますか？',
    c2LookHand: '四番線です！切符売り場の上の青い時計を見てください。',
    c2HahaFound: 'ありがとうございます！あと五分で出発します。',
    c3OrderTea: 'ラジオカフェへようこそ！緑茶とホットチョコレート、どちらにしますか？',
    c3BlueCup: '大きい青いカップで緑茶をお願いします。',
    c3VeryTasty: 'どうぞ！音楽と一緒にゆっくり楽しんでください。'
  },
  zh: {
    c1HelloMorning: '大家早上好！今天我们聊一聊早餐。',
    c1WantCoffee: '我平时早上喝一大杯咖啡，吃烤面包。',
    c1NoJuice: '等一下！今天我想喝新鲜的橙汁，不喝咖啡！',
    c1GreatIdea: '真是个健康又美味的好主意！',
    c2LostTrain: '请问，开往市中心的快车在几号站台发车？',
    c2LookHand: '在四号站台！请看售票处上面的蓝色时钟。',
    c2HahaFound: '非常感谢！我的火车五分钟后就开了。',
    c3OrderTea: '欢迎来到电台咖啡馆！您想要绿茶还是热巧克力？',
    c3BlueCup: '请给我一杯用大号蓝色杯子装的绿茶。',
    c3VeryTasty: '请慢用！祝您听得开心！'
  },
  ko: {
    c1HelloMorning: '좋은 아침입니다! 오늘은 아침 식사에 대해 이야기합니다.',
    c1WantCoffee: '저는 보통 큰 컵으로 커피를 마시고 토스트를 먹어요.',
    c1NoJuice: '잠깐만요! 오늘은 커피 대신 신선한 오렌지 주스를 마시고 싶어요!',
    c1GreatIdea: '정말 맛있고 건강한 생각이네요!',
    c2LostTrain: '실례지만 시내 중심가로 가는 급행열차는 몇 번 승강장에서 출발하나요?',
    c2LookHand: '4번 승강장입니다! 매표소 위의 파란 시계를 보세요.',
    c2HahaFound: '정말 감사합니다! 기차가 5분 뒤에 출발해요.',
    c3OrderTea: '라디오 카페에 오신 것을 환영합니다! 녹차와 핫초코 중 무엇을 드릴까요?',
    c3BlueCup: '큰 파란색 컵에 녹차를 주세요.',
    c3VeryTasty: '여기 있습니다! 음악과 함께 즐거운 시간 보내세요.'
  },
  it: {
    c1HelloMorning: 'Buongiorno ascoltatori! Oggi parliamo della colazione.',
    c1WantCoffee: 'Di solito bevo una tazza grande di caffè con pane tostato.',
    c1NoJuice: 'Aspetta, DuoWindo6601! Oggi preferisco succo d’arancia fresco!',
    c1GreatIdea: 'Che ottima idea e che colazione sana!',
    c2LostTrain: 'Mi scusi, da quale binario parte il treno veloce per il centro?',
    c2LookHand: 'Dal binario quattro! Guardi l’orologio blu sopra la biglietteria.',
    c2HahaFound: 'Grazie mille! Il mio treno parte tra cinque minuti.',
    c3OrderTea: 'Benvenuti al bar della radio! Preferite tè verde o cioccolata calda?',
    c3BlueCup: 'Vorrei un tè verde nella tazza blu grande, per favore.',
    c3VeryTasty: 'Ecco a lei! Buona musica e buon ascolto.'
  },
  pt: {
    c1HelloMorning: 'Bom dia, ouvintes! Hoje vamos falar sobre o café da manhã.',
    c1WantCoffee: 'Normalmente eu bebo uma xícara grande de café com torrada.',
    c1NoJuice: 'Espere, DuoWindo6601! Hoje eu quero suco de laranja fresco!',
    c1GreatIdea: 'Essa é uma ideia deliciosa e muito saudável!',
    c2LostTrain: 'Com licença, de qual plataforma sai o trem rápido para o centro?',
    c2LookHand: 'Da plataforma quatro! Olhe para o relógio azul acima da bilheteria.',
    c2HahaFound: 'Muito obrigado! Meu trem parte em cinco minutos.',
    c3OrderTea: 'Bem-vindos ao café da rádio! Vocês querem chá verde ou chocolate quente?',
    c3BlueCup: 'Eu gostaria de um chá verde na xícara azul grande, por favor.',
    c3VeryTasty: 'Aqui está! Aproveite a música e seu chá quentinho.'
  },
  tr: {
    c1HelloMorning: 'Günaydın dinleyiciler! Bugün kahvaltı hakkında konuşuyoruz.',
    c1WantCoffee: 'Genellikle büyük bir fincan kahve içer ve kızarmış ekmek yerim.',
    c1NoJuice: 'Bekle, DuoWindo6601! Bugün kahve yerine taze portakal suyu istiyorum!',
    c1GreatIdea: 'Çok lezzetli ve çok sağlıklı bir fikir!',
    c2LostTrain: 'Affedersiniz, şehir merkezine giden hızlı tren hangi perondan kalkıyor?',
    c2LookHand: 'Dördüncü perondan! Gişenin üzerindeki mavi saate bakın.',
    c2HahaFound: 'Çok teşekkür ederim! Trenim beş dakika içinde kalkıyor.',
    c3OrderTea: 'Radyo kafemize hoş geldiniz! Yeşil çay mı yoksa sıcak çikolata mı istersiniz?',
    c3BlueCup: 'Büyük mavi fincanda yeşil çay rica ediyorum, lütfen.',
    c3VeryTasty: 'Buyurun! Müziğin ve sıcak çayınızın tadını çıkarın.'
  },
  ar: {
    c1HelloMorning: 'صباح الخير أيها المستمعون! اليوم نتحدث عن وجبة الإفطار.',
    c1WantCoffee: 'عادة أشرب كوبًا كبيرًا من القهوة وآكل الخبز المحمص.',
    c1NoJuice: 'انتظر يا صديقي! اليوم أريد عصير برتقال طازجًا بدلًا من القهوة!',
    c1GreatIdea: 'هذه فكرة رائعة وصحية جدًا!',
    c2LostTrain: 'عذرًا، من أي رصيف يغادر القطار السريع إلى وسط المدينة؟',
    c2LookHand: 'من الرصيف رقم أربعة! انظر إلى الساعة الزرقاء فوق مكتب التذاكر.',
    c2HahaFound: 'شكرًا جزيلاً لك! سيغادر قطاري خلال خمس دقائق.',
    c3OrderTea: 'مرحبًا بكم في مقهى الراديو! هل تفضلون الشاي الأخضر أم الشوكولاتة الساخنة؟',
    c3BlueCup: 'أود شايًا أخضر في الكوب الأزرق الكبير، من فضلك.',
    c3VeryTasty: 'تفضل! استمتع بالموسيقى وبكأس الشاي الدافئ.'
  },
  ru: {
    c1HelloMorning: 'Доброе утро, слушатели! Сегодня в эфире говорим про завтрак.',
    c1WantCoffee: 'Обычно я пью большую кружку кофе и ем тёплый тост.',
    c1NoJuice: 'Подожди, Сова DuoWindo6601! Сегодня вместо кофе я хочу свежий апельсиновый сок!',
    c1GreatIdea: 'Отличная и очень полезная идея для бодрого утра!',
    c2LostTrain: 'Извините, с какой платформы отправляется скорый поезд в центр города?',
    c2LookHand: 'С четвёртой платформы! Посмотрите на синие часы над кассой.',
    c2HahaFound: 'Большое спасибо! Мой поезд отправляется уже через пять минут.',
    c3OrderTea: 'Добро пожаловать в радио-кафе! Вы хотите зелёный чай или горячий шоколад?',
    c3BlueCup: 'Мне, пожалуйста, зелёный чай в большой синей чашке.',
    c3VeryTasty: 'Пожалуйста! Приятного прослушивания музыки и тёплого чаепития.'
  }
};

function getTemplateForCourse(courseId: string): TargetLanguageTemplate {
  return TARGET_TEMPLATES[courseId] || TARGET_TEMPLATES.en;
}

export function getCuratedRadioEpisodes(
  course: Course,
  userLanguage: string = 'ru',
  langSection: number = 1
): DuoRadioEpisode[] {
  const tpl = getTemplateForCourse(course.id);
  const isRuHost = userLanguage !== 'en';
  const courseLabel = course.localName || course.name;
  const levelLabel = langSection <= 2 ? 'A1' : langSection <= 4 ? 'A2' : langSection <= 6 ? 'B1' : 'B2';

  const hostIsTargetLang =
    (course.id === 'ru' && isRuHost) || (course.id === 'en' && !isRuHost);

  const owlSpeaker = isRuHost ? 'Сова DuoWindo6601' : 'Owl DuoWindo6601';
  const guestSpeaker = isRuHost ? 'Гость эфира' : 'Radio Guest';
  const stationSpeaker = isRuHost ? 'Дежурный по станции' : 'Station Attendant';
  const baristaSpeaker = isRuHost ? 'Бариста радио-кафе' : 'Radio Cafe Barista';

  return [
    {
      id: `radio-ep-1-${course.id}`,
      courseId: course.id,
      showNameRu: 'Утреннее шоу Совы DuoWindo6601',
      showNameEn: 'Owl DuoWindo6601 Morning Show',
      titleRu: 'Кофе или апельсиновый сок?',
      titleEn: 'Coffee or Orange Juice?',
      descRu: `Погружение в естественный темп речи (${courseLabel}): Сова DuoWindo6601 обсуждает утренние привычки с гостем эфира.`,
      descEn: `Immersion podcast in ${courseLabel}: Owl DuoWindo6601 chats about morning routines with a studio guest.`,
      hostName: owlSpeaker,
      durationLabel: '1:45',
      levelBadge: levelLabel,
      icon: '🦉',
      cues: [
        {
          id: 'ep1-c1',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? `Привет! С вами Сова DuoWindo6601 в эфире DuoWindo6601Radio. Сейчас вы услышите диалог на языке курса (${courseLabel}) о завтраке. Попробуйте уловить, что именно захотел выпить наш гость!`
            : `Welcome! This is Owl DuoWindo6601 on DuoWindo6601Radio. You are about to hear a natural conversation in ${courseLabel} about breakfast. Listen closely to hear what our guest wants to drink!`,
          translationRu: `Привет! С вами Сова DuoWindo6601 в эфире DuoWindo6601Radio. Сейчас вы услышите диалог на языке курса (${courseLabel}) о завтраке. Попробуйте уловить, что именно захотел выпить наш гость!`,
          translationEn: `Welcome! This is Owl DuoWindo6601 on DuoWindo6601Radio. You are about to hear a natural conversation in ${courseLabel} about breakfast. Listen closely to hear what our guest wants to drink!`,
          noteRu: 'Пояснение Совы DuoWindo6601',
          noteEn: 'Owl DuoWindo6601 intro'
        },
        {
          id: 'ep1-c2',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1HelloMorning,
          translationRu: 'Доброе утро, слушатели! Сегодня мы говорим о завтраке.',
          translationEn: 'Good morning, listeners! Today we are talking about breakfast.'
        },
        {
          id: 'ep1-c3',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1WantCoffee,
          translationRu: 'Обычно я пью большую чашку кофе и ем тёплый тост.',
          translationEn: 'I usually drink a big cup of coffee and eat warm toast.'
        },
        {
          id: 'ep1-c4',
          speaker: guestSpeaker,
          avatar: '🎙️',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1NoJuice,
          translationRu: 'Подожди, Сова DuoWindo6601! Сегодня вместо кофе я хочу свежий апельсиновый сок!',
          translationEn: 'Wait, DuoWindo6601! Today I want fresh orange juice instead of coffee!'
        },
        {
          id: 'ep1-c5',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Обратите внимание на интонацию: в живой речи выбор напитка выделяется паузой перед словом «сегодня». А теперь послушайте ответ Совы DuoWindo6601!'
            : 'Notice the intonation: speakers emphasize the contrast right before saying "today". Now listen to Owl DuoWindo6601’s reply!',
          translationRu: 'Обратите внимание на интонацию: в живой речи выбор напитка выделяется паузой перед словом «сегодня».',
          translationEn: 'Notice the intonation: speakers emphasize the contrast right before saying "today".',
          noteRu: 'Языковая подсказка Совы DuoWindo6601',
          noteEn: 'Owl DuoWindo6601 tip'
        },
        {
          id: 'ep1-c6',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1GreatIdea,
          translationRu: 'Это звучит вкусно и очень полезно для здоровья!',
          translationEn: 'That sounds delicious and very healthy, my friend!'
        }
      ],
      questions: [
        {
          id: 'ep1-q1',
          stage: 'mid',
          afterCueIndex: 3,
          replayCueIndex: 3,
          questionRu: 'Что гость эфира захотел выпить сегодня вместо кофе?',
          questionEn: 'What did the guest want to drink today instead of coffee?',
          optionsRu: ['Зелёный чай с лимоном', 'Свежий апельсиновый сок', 'Холодное молоко'],
          optionsEn: ['Green tea with lemon', 'Fresh orange juice', 'Cold milk'],
          correctIndex: 1,
          explanationRu: 'В эфире прозвучало, что сегодня гость предпочитает свежий апельсиновый сок вместо кофе.',
          explanationEn: 'The guest said they want fresh orange juice instead of coffee today.'
        },
        {
          id: 'ep1-q2',
          stage: 'final',
          afterCueIndex: 5,
          replayCueIndex: 2,
          questionRu: 'Что обычно пьёт и ест на завтрак Сова DuoWindo6601?',
          questionEn: 'What does Owl DuoWindo6601 usually drink and eat for breakfast?',
          optionsRu: ['Большую чашку кофе и тост', 'Стакан воды и яблоко', 'Суп и блины'],
          optionsEn: ['A big cup of coffee and toast', 'Water and an apple', 'Soup and pancakes'],
          correctIndex: 0,
          explanationRu: 'В начале эфира Сова DuoWindo6601 рассказала, что обычно пьёт большую чашку кофе с тостом.',
          explanationEn: 'At the start of the episode, Owl DuoWindo6601 mentioned coffee and warm toast.'
        }
      ]
    },
    {
      id: `radio-ep-2-${course.id}`,
      courseId: course.id,
      showNameRu: 'Репортаж Совы DuoWindo6601 с вокзала',
      showNameEn: 'Owl DuoWindo6601 Station Live',
      titleRu: 'Скорый поезд и синие часы',
      titleEn: 'The Express Train & Blue Clock',
      descRu: 'Прямое включение Совы DuoWindo6601: учимся воспринимать на слух номера платформ, время и ориентиры.',
      descEn: 'Live broadcast by Owl DuoWindo6601: practice catching platform numbers, times, and landmarks by ear.',
      hostName: owlSpeaker,
      durationLabel: '1:50',
      levelBadge: levelLabel,
      icon: '🚆',
      cues: [
        {
          id: 'ep2-c1',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Сова DuoWindo6601 ведёт прямой репортаж с оживлённого вокзала! Слушайте внимательно цифры и ориентиры, чтобы не пропустить скорый поезд.'
            : 'Owl DuoWindo6601 is reporting live from a busy train station! Listen carefully for numbers and landmarks so you don’t miss the express train.',
          translationRu: 'Сова DuoWindo6601 ведёт прямой репортаж с вокзала! Слушайте внимательно цифры и ориентиры.',
          translationEn: 'Owl DuoWindo6601 is reporting live from a train station! Listen for numbers and landmarks.',
          noteRu: 'Вступление Совы DuoWindo6601',
          noteEn: 'Owl DuoWindo6601 intro'
        },
        {
          id: 'ep2-c2',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c2LostTrain,
          translationRu: 'Извините, с какой платформы отправляется скорый поезд в центр города?',
          translationEn: 'Excuse me, where does the fast train to the city center leave from?'
        },
        {
          id: 'ep2-c3',
          speaker: stationSpeaker,
          avatar: '🚉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c2LookHand,
          translationRu: 'С четвёртой платформы! Посмотрите на синие часы над кассой.',
          translationEn: 'Platform four! Look at the blue clock above the ticket desk.'
        },
        {
          id: 'ep2-c4',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Отлично! В объявлениях на вокзале ключевая информация — номер и цвет ориентира — звучит чётче. Проверим, как вы запомнили детали!'
            : 'Great! In station directions, key details like numbers and colors stand out clearly. Let’s check what you caught!',
          translationRu: 'Отлично! Проверим, запомнили ли вы номер платформы и ориентир.',
          translationEn: 'Great! Let’s check if you caught the platform number and landmark.',
          noteRu: 'Подсказка Совы DuoWindo6601',
          noteEn: 'Listening tip'
        },
        {
          id: 'ep2-c5',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c2HahaFound,
          translationRu: 'Большое спасибо! Мой поезд отправляется через пять минут.',
          translationEn: 'Thank you so much! My train leaves in five minutes.'
        }
      ],
      questions: [
        {
          id: 'ep2-q1',
          stage: 'mid',
          afterCueIndex: 2,
          replayCueIndex: 2,
          questionRu: 'С какой платформы отправляется скорый поезд?',
          questionEn: 'Which platform does the express train leave from?',
          optionsRu: ['Со второй платформы', 'С четвёртой платформы', 'С девятой платформы'],
          optionsEn: ['Platform two', 'Platform four', 'Platform nine'],
          correctIndex: 1,
          explanationRu: 'Дежурный ответил Сове DuoWindo6601, что поезд отправляется с четвёртой платформы у синих часов.',
          explanationEn: 'The attendant told Owl DuoWindo6601 the train leaves from platform four near the blue clock.'
        },
        {
          id: 'ep2-q2',
          stage: 'final',
          afterCueIndex: 4,
          replayCueIndex: 4,
          questionRu: 'Через сколько минут отправляется поезд Совы DuoWindo6601?',
          questionEn: 'In how many minutes does Owl DuoWindo6601’s train leave?',
          optionsRu: ['Через 5 минут', 'Через 25 минут', 'Через 1 час'],
          optionsEn: ['In 5 minutes', 'In 25 minutes', 'In 1 hour'],
          correctIndex: 0,
          explanationRu: 'В конце репортажа Сова DuoWindo6601 поблагодарила и сказала, что поезд уходит через пять минут.',
          explanationEn: 'At the end, Owl DuoWindo6601 said the train leaves in five minutes.'
        }
      ]
    },
    {
      id: `radio-ep-3-${course.id}`,
      courseId: course.id,
      showNameRu: 'Вечернее Радио-Кафе DuoWindo6601',
      showNameEn: 'Evening DuoWindo6601 Radio Cafe',
      titleRu: 'Заказ в музыкальном кафе',
      titleEn: 'Ordering at the Music Cafe',
      descRu: 'Спокойный вечерний выпуск Совы DuoWindo6601: вежливые фразы заказа напитка в уютном кафе.',
      descEn: 'Relaxed evening podcast with Owl DuoWindo6601: polite cafe ordering phrases by ear.',
      hostName: owlSpeaker,
      durationLabel: '1:35',
      levelBadge: levelLabel,
      icon: '🍵',
      cues: [
        {
          id: 'ep3-c1',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Добрый вечер! С вами Сова DuoWindo6601. В этом выпуске заглянем в уютное радио-кафе. Послушайте, какой напиток и какую чашку закажет Сова DuoWindo6601.'
            : 'Good evening! This is Owl DuoWindo6601. In this episode we visit a cozy radio cafe. Listen for both the drink and the cup Owl DuoWindo6601 orders.',
          translationRu: 'Добрый вечер! Послушайте, какой напиток и какую чашку закажет Сова DuoWindo6601.',
          translationEn: 'Good evening! Listen for the drink and the cup Owl DuoWindo6601 chooses.',
          noteRu: 'Пояснение Совы DuoWindo6601',
          noteEn: 'Host intro'
        },
        {
          id: 'ep3-c2',
          speaker: baristaSpeaker,
          avatar: '☕',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c3OrderTea,
          translationRu: 'Добро пожаловать в радио-кафе! Вы хотите зелёный чай или горячий шоколад?',
          translationEn: 'Welcome to our radio cafe! Would you like green tea or hot chocolate?'
        },
        {
          id: 'ep3-c3',
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c3BlueCup,
          translationRu: 'Мне, пожалуйста, зелёный чай в большой синей чашке.',
          translationEn: 'I would like green tea in a large blue cup, please.'
        },
        {
          id: 'ep3-c4',
          speaker: baristaSpeaker,
          avatar: '☕',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c3VeryTasty,
          translationRu: 'Вот ваш заказ! Наслаждайтесь музыкой и тёплым чаем.',
          translationEn: 'Here you go! Enjoy the music and your warm tea.'
        }
      ],
      questions: [
        {
          id: 'ep3-q1',
          stage: 'mid',
          afterCueIndex: 2,
          replayCueIndex: 2,
          questionRu: 'Какой напиток заказала Сова DuoWindo6601?',
          questionEn: 'Which drink did Owl DuoWindo6601 order?',
          optionsRu: ['Чёрный кофе', 'Зелёный чай', 'Горячий шоколад'],
          optionsEn: ['Black coffee', 'Green tea', 'Hot chocolate'],
          correctIndex: 1,
          explanationRu: 'Сова DuoWindo6601 вежливо попросила зелёный чай в большой синей чашке.',
          explanationEn: 'Owl DuoWindo6601 politely asked for green tea in a large blue cup.'
        },
        {
          id: 'ep3-q2',
          stage: 'final',
          afterCueIndex: 3,
          replayCueIndex: 2,
          questionRu: 'Какого цвета чашку выбрала Сова DuoWindo6601?',
          questionEn: 'What color cup did Owl DuoWindo6601 ask for?',
          optionsRu: ['Красную', 'Жёлтую', 'Синюю'],
          optionsEn: ['Red', 'Yellow', 'Blue'],
          correctIndex: 2,
          explanationRu: 'Сова DuoWindo6601 уточнила, что хочет напиток в большой синей чашке.',
          explanationEn: 'Owl DuoWindo6601 specified a large blue cup.'
        }
      ]
    }
  ];
}

export async function generateDuoRadioEpisodeAI(
  course: Course,
  userLanguage: string = 'ru',
  difficultyLevel: 'easy' | 'hard' = 'easy',
  langSection: number = 1
): Promise<DuoRadioEpisode | null> {
  const isRu = userLanguage !== 'en';
  const targetLangName = course.name || course.localName || 'English';
  const hostLangName = isRu ? 'Russian' : 'English';
  const levelLabel = difficultyLevel === 'hard' ? 'B1-B2' : `A${Math.min(2, Math.max(1, Math.ceil(langSection / 2)))}`;
  const owlSpeaker = isRu ? 'Сова DuoWindo6601' : 'Owl DuoWindo6601';

  const prompt = `Create an engaging listening podcast episode called "DuoWindo6601Radio".
CRITICAL RULE: Do NOT use any third-party trademarked characters.
The ONLY mascot/main character is the Owl "Сова DuoWindo6601" (or "Owl DuoWindo6601"), optionally speaking with neutral everyday roles like "Гость эфира" / "Radio Guest" or "Слушатель" / "Listener".

Target language being learned: ${targetLangName} (course id: ${course.id}).
Listener's native/familiar UI language: ${hostLangName}.
Difficulty: ${difficultyLevel} (${levelLabel}), Section ${langSection} of 8.

Requirements:
1. Total 5 cues:
   - Cue 0: Host "${owlSpeaker}" (role: "host", avatar: "🦉", isFamiliarLang: true) introduces the episode in ${hostLangName} and tells the learner what to listen for.
   - Cue 1: "${owlSpeaker}" (role: "character", avatar: "🦉", isFamiliarLang: false) speaks in ${targetLangName}.
   - Cue 2: "${isRu ? 'Гость эфира' : 'Radio Guest'}" (role: "character", avatar: "🎙️", isFamiliarLang: false) replies in ${targetLangName}.
   - Cue 3: Host "${owlSpeaker}" (role: "host", avatar: "🦉", isFamiliarLang: true) gives a brief 1-sentence listening tip in ${hostLangName}.
   - Cue 4: "${owlSpeaker}" (role: "character", avatar: "🦉", isFamiliarLang: false) concludes the mini dialogue in ${targetLangName}.
2. Include 2 listening comprehension questions:
   - Question 0 (stage: "mid", afterCueIndex: 2, replayCueIndex: 2)
   - Question 1 (stage: "final", afterCueIndex: 4, replayCueIndex: 1)

Return ONLY valid JSON with this exact schema:
{
  "showNameRu": "string",
  "showNameEn": "string",
  "titleRu": "string",
  "titleEn": "string",
  "descRu": "string",
  "descEn": "string",
  "icon": "single emoji",
  "cues": [
    {
      "speaker": "Сова DuoWindo6601 | Гость эфира | Owl DuoWindo6601 | Radio Guest",
      "avatar": "single emoji",
      "role": "host | character",
      "isFamiliarLang": true or false,
      "text": "spoken text",
      "translationRu": "Russian translation",
      "translationEn": "English translation"
    }
  ],
  "questions": [
    {
      "stage": "mid | final",
      "afterCueIndex": number,
      "replayCueIndex": number,
      "questionRu": "string",
      "questionEn": "string",
      "optionsRu": ["opt1", "opt2", "opt3"],
      "optionsEn": ["opt1", "opt2", "opt3"],
      "correctIndex": 0 | 1 | 2,
      "explanationRu": "string",
      "explanationEn": "string"
    }
  ]
}`;

  try {
    const res = await callServerGemini({
      model: MODEL_FREE,
      prompt,
      config: { responseMimeType: 'application/json', temperature: 0.75 }
    });
    const rawText = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return null;
    const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.cues) || parsed.cues.length < 4 || !Array.isArray(parsed.questions) || parsed.questions.length < 1) {
      return null;
    }

    return {
      id: `radio-ai-${course.id}-${Date.now()}`,
      courseId: course.id,
      showNameRu: String(parsed.showNameRu || 'Спецвыпуск Совы DuoWindo6601'),
      showNameEn: String(parsed.showNameEn || 'Owl DuoWindo6601 Radio Special'),
      titleRu: String(parsed.titleRu || 'Новый подкаст'),
      titleEn: String(parsed.titleEn || 'New Podcast Episode'),
      descRu: String(parsed.descRu || 'Свежий выпуск подкаста Совы DuoWindo6601 с вопросами на понимание речи.'),
      descEn: String(parsed.descEn || 'Fresh Owl DuoWindo6601 podcast episode with listening comprehension checks.'),
      hostName: owlSpeaker,
      durationLabel: '1:30',
      levelBadge: levelLabel,
      icon: String(parsed.icon || '🦉'),
      isAiGenerated: true,
      cues: parsed.cues.map((c: any, idx: number) => ({
        id: `ai-cue-${idx}-${Date.now()}`,
        speaker: String(c.speaker || owlSpeaker),
        avatar: String(c.avatar || (c.role === 'host' ? '🦉' : '🎙️')),
        role: c.role === 'host' ? 'host' : 'character',
        isFamiliarLang: Boolean(c.isFamiliarLang),
        text: String(c.text || ''),
        translationRu: String(c.translationRu || c.text || ''),
        translationEn: String(c.translationEn || c.text || '')
      })),
      questions: parsed.questions.map((q: any, idx: number) => ({
        id: `ai-q-${idx}-${Date.now()}`,
        stage: q.stage === 'mid' ? 'mid' : 'final',
        afterCueIndex: Math.min(parsed.cues.length - 1, Math.max(0, Number(q.afterCueIndex ?? (idx === 0 ? 2 : parsed.cues.length - 1)))),
        replayCueIndex: Math.min(parsed.cues.length - 1, Math.max(0, Number(q.replayCueIndex ?? 1))),
        questionRu: String(q.questionRu || 'Что вы услышали в диалоге?'),
        questionEn: String(q.questionEn || 'What did you hear in the dialogue?'),
        optionsRu: Array.isArray(q.optionsRu) && q.optionsRu.length >= 2 ? q.optionsRu.map(String) : ['Вариант 1', 'Вариант 2', 'Вариант 3'],
        optionsEn: Array.isArray(q.optionsEn) && q.optionsEn.length >= 2 ? q.optionsEn.map(String) : ['Option 1', 'Option 2', 'Option 3'],
        correctIndex: Math.min(2, Math.max(0, Number(q.correctIndex ?? 0))),
        explanationRu: String(q.explanationRu || 'Верный ответ прозвучал в диалоге.'),
        explanationEn: String(q.explanationEn || 'The correct answer was mentioned in the dialogue.')
      }))
    };
  } catch (err) {
    console.warn('DuoRadio AI generation fallback triggered:', err);
    return null;
  }
}

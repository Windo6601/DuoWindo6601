import { Course } from '../types';
import { callServerGemini, MODEL_FREE } from './geminiService';
import { normalizeCourseLangCode } from './multilingualTtsHelper';

export interface DuoRadioCue {
  id: string;
  speaker: string;
  avatar: string;
  role: 'host' | 'character';
  /** True when the cue is narration/context in the user's familiar language */
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
  },
  sv: {
    c1HelloMorning: 'God morgon, lyssnare! Idag pratar vi om frukost.',
    c1WantCoffee: 'Vanligtvis dricker jag en stor kopp kaffe och äter rostat bröd.',
    c1NoJuice: 'Vänta, DuoWindo6601! Idag vill jag ha färsk apelsinjuice istället för kaffe!',
    c1GreatIdea: 'Det låter jättegott och väldigt nyttigt, min vän!',
    c2LostTrain: 'Ursäkta, från vilket spår avgår snabbtåget till centrum?',
    c2LookHand: 'Spår fyra! Titta på den blå klockan ovanför biljettluckan.',
    c2HahaFound: 'Tack så mycket! Mitt tåg går om fem minuter.',
    c3OrderTea: 'Välkommen till vårt radiokafé! Vill du ha grönt te eller varm choklad?',
    c3BlueCup: 'Jag skulle vilja ha grönt te i en stor blå kopp, tack.',
    c3VeryTasty: 'Varsågod! Njut av musiken och ditt varma te.'
  },
  no: {
    c1HelloMorning: 'God morgen, lyttere! I dag snakker vi om frokost.',
    c1WantCoffee: 'Vanligvis drikker jeg en stor kopp kaffe og spiser ristet brød.',
    c1NoJuice: 'Vent, DuoWindo6601! I dag vil jeg ha fersk appelsinjuice i stedet for kaffe!',
    c1GreatIdea: 'Det høres veldig godt og sunt ut, min venn!',
    c2LostTrain: 'Unnskyld, fra hvilket spor går hurtigtoget til sentrum?',
    c2LookHand: 'Spor fire! Se på den blå klokken over billettluka.',
    c2HahaFound: 'Tusen takk! Toget mitt går om fem minutter.',
    c3OrderTea: 'Velkommen til radiokafeen vår! Vil du ha grønn te eller varm sjokolade?',
    c3BlueCup: 'Jeg vil gjerne ha grønn te i en stor blå kopp, takk.',
    c3VeryTasty: 'Vær så god! Nyt musikken og den varme teen din.'
  },
  la: {
    c1HelloMorning: 'Salvete, auditores! Hodie de ientaculo loquimur.',
    c1WantCoffee: 'Soleo magnam poculum coffeae bibere et panem tostum edere.',
    c1NoJuice: 'Exspecta! Hodie sucum aurantii recentem pro coffea volo!',
    c1GreatIdea: 'Optimum consilium et saluberrimum est, amice!',
    c2LostTrain: 'Ignosce mihi, a quo perrone tramen celer in urbem proficiscitur?',
    c2LookHand: 'A perrone quarto! Aspice horologium caeruleum super mensam.',
    c2HahaFound: 'Gratias tibi ago! Tramen meum post quinque minuta discedit.',
    c3OrderTea: 'Salve in taberna radiophonica! Visne theam viridem an socolatam calidam?',
    c3BlueCup: 'Theam viridem in magno poculo caeruleo velim, quaeso.',
    c3VeryTasty: 'Ecce! Fruere musica et thea tua calida.'
  },
  eo: {
    c1HelloMorning: 'Bonan matenon, aŭskultantoj! Hodiaŭ ni parolas pri matenmanĝo.',
    c1WantCoffee: 'Kutime mi trinkas grandan tason da kafo kaj manĝas varman toaston.',
    c1NoJuice: 'Atendu! Hodiaŭ mi volas freŝan oranĝan sukon anstataŭ kafo!',
    c1GreatIdea: 'Tio sonas bongusta kaj tre sana, mia amiko!',
    c2LostTrain: 'Pardonu min, de kiu kajo foriras la rapida trajno al la urbocentro?',
    c2LookHand: 'De kajo kvar! Rigardu la bluan horloĝon super la biletejo.',
    c2HahaFound: 'Koran dankon! Mia trajno foriros post kvin minutoj.',
    c3OrderTea: 'Bonvenon al nia radiokafejo! Ĉu vi volas verdan teon aŭ varman ĉokoladon?',
    c3BlueCup: 'Mi ŝatus verdan teon en granda blua taso, mi petas.',
    c3VeryTasty: 'Jen! Ĝuu la muzikon kaj vian varman teon.'
  },
  hv: {
    c1HelloMorning: 'Biarvose, valzyrys! Tubi jentaklo issi udrirzi.',
    c1WantCoffee: 'Kafe bantis nyke jorrāelagon tolī vestragon.',
    c1NoJuice: 'Umbagon! Tubi oranzho suko tolī jorrāelan!',
    c1GreatIdea: 'Syrje kostagon se kirine, raqiros!',
    c2LostTrain: 'Kesan, skori perrone rapida traveno hen valyrion istan?',
    c2LookHand: 'Perrone izula! Azantys jentys hae kostagon.',
    c2HahaFound: 'Kirimvose! Havor azantys hen mērī sīkudā.',
    c3OrderTea: 'Rybās radiokafe! Green tea se varma chokolata?',
    c3BlueCup: 'Green tea hae bantis blua taso jorrāelan.',
    c3VeryTasty: 'Sīr! Música se tea kostagon!'
  },
  tt: {
    c1HelloMorning: 'Хәерле иртә, тыңлаучылар! Бүген без иртәнге аш турында сөйләшәбез.',
    c1WantCoffee: 'Гадәттә мин зур чынаяк кофе эчәм һәм җылы икмәк ашыйм.',
    c1NoJuice: 'Тукта, DuoWindo6601! Бүген мин кофе урынына яңа әфлисун суты телим!',
    c1GreatIdea: 'Бу бик тәмле һәм бик файдалы фикер, дустым!',
    c2LostTrain: 'Гафу итегез, шәһәр үзәгенә тиз йөрешле поезд ничәнче платформадан китә?',
    c2LookHand: 'Дүртенче платформадан! Касса өстендәге зәңгәр сәгатькә карагыз.',
    c2HahaFound: 'Зур рәхмәт! Минем поездым биш минуттан китә.',
    c3OrderTea: 'Радио-кафега рәхим итегез! Сезгә яшел чәйме яки кайнар шоколадмы?',
    c3BlueCup: 'Зинһар, зур зәңгәр чынаякта яшел чәй бирегез.',
    c3VeryTasty: 'Рәхим итегез! Музыкадан һәм җылы чәйдән ләззәт алыгыз.'
  },
  yi: {
    c1HelloMorning: 'גוט מאָרגן, צוהערערס! הייַנט רעדן מיר וועגן פרישטיק.',
    c1WantCoffee: 'געוויינטלעך טרינק איך אַ גרויסע טאַס קאַווע מיט ברויט.',
    c1NoJuice: 'וואַרט, DuoWindo6601! הייַנט וויל איך פרישן מאַראַנץ־זאַפט אַנשטאָט קאַווע!',
    c1GreatIdea: 'דאָס קלינגט זייער געשמאַק און געזונט, מיין פרייַנד!',
    c2LostTrain: 'אַנטשולדיקט, פֿון וועלכער פּלאַטפאָרמע פֿאָרט די שנעלע באַן אין צענטער?',
    c2LookHand: 'פֿון פּלאַטפאָרמע פֿיר! קוקט אויף דער בלויער זייגער איבער דער קאַסע.',
    c2HahaFound: 'אַ גרויסן דאַנק! מיין באַן פֿאָרט אַרויס אין פינף מינוט.',
    c3OrderTea: 'ברוכים הבאים אין אונדזער ראַדיאָ־קאַפֿע! ווילט איר גרינעם טיי אָדער וואַרעמע שאָקאָלאַד?',
    c3BlueCup: 'איך וואָלט געוואָלט גרינעם טיי אין אַ גרויסער בלויער טאַס, ביטע.',
    c3VeryTasty: 'זייט אַזוי גוט! האָט הנאה פֿון דער מוזיק און דעם טיי.'
  },
  uk: {
    c1HelloMorning: 'Доброго ранку, слухачі! Сьогодні в ефірі говоримо про сніданок.',
    c1WantCoffee: 'Зазвичай я п’ю велику чашку кави і їм теплий тост.',
    c1NoJuice: 'Зачекай, DuoWindo6601! Сьогодні замість кави я хочу свіжий апельсиновий сік!',
    c1GreatIdea: 'Чудова та дуже корисна ідея для бадьорого ранку!',
    c2LostTrain: 'Вибачте, з якої платформи відправляється швидкий поїзд у центр міста?',
    c2LookHand: 'З четвертої платформи! Подивіться на синій годинник над касою.',
    c2HahaFound: 'Дуже дякую! Мій поїзд відправляється за п’ять хвилин.',
    c3OrderTea: 'Ласкаво просимо до радіо-кафе! Бажаєте зелений чай чи гарячий шоколад?',
    c3BlueCup: 'Мені, будь ласка, зелений чай у великій синій чашці.',
    c3VeryTasty: 'Будь ласка! Насолоджуйтесь музикою та теплим чаєм.'
  },
  be: {
    c1HelloMorning: 'Добрай раніцы, слухачы! Сёння мы гаворым пра сняданак.',
    c1WantCoffee: 'Звычайна я п’ю вялікі кубак кавы і ем цёплы тост.',
    c1NoJuice: 'Пачакай, DuoWindo6601! Сёння замест кавы я хачу свежы апельсінавы сок!',
    c1GreatIdea: 'Выдатная і вельмі карысная ідэя, сябар!',
    c2LostTrain: 'Прабачце, з якой платформы адпраўляецца хуткі цягнік у цэнтр горада?',
    c2LookHand: 'З чацвёртай платформы! Паглядзіце на сіні гадзіннік над касай.',
    c2HahaFound: 'Вялікі дзякуй! Мой цягнік адпраўляецца праз пяць хвілін.',
    c3OrderTea: 'Сардэчна запрашаем у радыё-кавярню! Хочаце зялёную гарбату ці гарачы шакалад?',
    c3BlueCup: 'Мне, калі ласка, зялёную гарбату ў вялікім сінім кубку.',
    c3VeryTasty: 'Калі ласка! Атрымлівайце асалоду ад музыкі і цёплай гарбаты.'
  },
  kk: {
    c1HelloMorning: 'Қайырлы таң, тыңдармандар! Бүгін біз таңғы ас туралы сөйлесеміз.',
    c1WantCoffee: 'Әдетте мен үлкен кесе кофе ішемін және жылы тост жеймін.',
    c1NoJuice: 'Күте тұр! Бүгін кофенің орнына жаңа сығылған апельсин шырынын ішкім келеді!',
    c1GreatIdea: 'Өте дәмді әрі пайдалы таңдау, достым!',
    c2LostTrain: 'Кешіріңіз, қала орталығына баратын жүрдек пойыз қай платформадан жүреді?',
    c2LookHand: 'Төртінші платформадан! Касса үстіндегі көк сағатқа қараңыз.',
    c2HahaFound: 'Көп рахмет! Пойызым бес минуттан кейін жүреді.',
    c3OrderTea: 'Радио-кафеге қош келдіңіз! Көк шай немесе ыстық шоколад ішесіз бе?',
    c3BlueCup: 'Маған үлкен көк кеседегі жасыл шай беріңізші.',
    c3VeryTasty: 'Мархабат! Әуен мен жылы шайдан ләззат алыңыз.'
  },
  uz: {
    c1HelloMorning: 'Xayrli tong, tinglovchilar! Bugun nonushta haqida gaplashamiz.',
    c1WantCoffee: 'Odatda men katta finjonda qahva ichaman va iliq tost yeyman.',
    c1NoJuice: 'Shoshma! Bugun qahva o‘rniga yangi apelsin sharbatini xohlayman!',
    c1GreatIdea: 'Bu juda mazali va foydali fikr, do‘stim!',
    c2LostTrain: 'Kechirasiz, shahar markaziga boradigan tezyurar poyezd qaysi platformadan jo‘naydi?',
    c2LookHand: 'To‘rtinchi platformadan! Kassa tepasidagi ko‘k soatga qarang.',
    c2HahaFound: 'Katta rahmat! Poyezdim besh daqiqada jo‘naydi.',
    c3OrderTea: 'Radio kafemizga xush kelibsiz! Ko‘k choy yoki issiq shokolad ichasizmi?',
    c3BlueCup: 'Iltimos, katta ko‘k piyolada ko‘k choy bering.',
    c3VeryTasty: 'Marhamat! Musiqadan va issiq choyingizdan rohatlaning.'
  },
  az: {
    c1HelloMorning: 'Sabahınız xeyir, dinləyicilər! Bu gün səhər yeməyi haqqında danışırıq.',
    c1WantCoffee: 'Adətən böyük fincanda qəhvə içir və isti tost yeyirəm.',
    c1NoJuice: 'Gözlə! Bu gün qəhvə əvəzinə təzə portağal şirəsi istəyirəm!',
    c1GreatIdea: 'Bu çox dadlı və çox sağlam fikirdir, dostum!',
    c2LostTrain: 'Bağışlayın, şəhər mərkəzinə gedən sürətli qatar hansı platformadan yola düşür?',
    c2LookHand: 'Dördüncü platformadan! Kassa üzərindəki mavi saata baxın.',
    c2HahaFound: 'Çox sağ olun! Qatarım beş dəqiqəyə yola düşür.',
    c3OrderTea: 'Radio kafemizə xoş gəlmisiniz! Yaşıl çay yoxsa isti şokolad istərdiniz?',
    c3BlueCup: 'Böyük mavi fincanda yaşıl çay xahiş edirəm.',
    c3VeryTasty: 'Buyurun! Musiqidən və isti çayınızdan zövq alın.'
  },
  tk: {
    c1HelloMorning: 'Ertiriňiz haýyrly, diňleýjiler! Şu gün ertirlik hakda gürleşýäris.',
    c1WantCoffee: 'Adatça men uly käsede kofe içýärin we maýyl çörek iýýärin.',
    c1NoJuice: 'Dur! Şu gün kofe däl-de täze pyrtykal şiresini içesim gelýär!',
    c1GreatIdea: 'Bu örän tagamly we peýdaly pikir, dostum!',
    c2LostTrain: 'Bagyşlaň, şäher merkezine gidýän çalt otly haýsy platformadan ugraýar?',
    c2LookHand: 'Dördünji platformadan! Kassanyň ýokarsyndaky gök sagada serediň.',
    c2HahaFound: 'Köp sag boluň! Otlym bäş minutdan ugraýar.',
    c3OrderTea: 'Radio kafemize hoş geldiňiz! Gök çaý ýa-da gyzgyn şokolad isleýärsiňizmi?',
    c3BlueCup: 'Haýyş edýärin, uly gök käsede gök çaý beriň.',
    c3VeryTasty: 'Ine! Aýdymdan we ýyly çaýyňyzdan lezzet alyň.'
  },
  ky: {
    c1HelloMorning: 'Кутман таң, угармандар! Бүгүн эртең мененки тамак тууралуу сүйлөшөбүз.',
    c1WantCoffee: 'Адатта мен чоң чыныда кофе ичем жана жылуу нан жейм.',
    c1NoJuice: 'Токто! Бүгүн кофенин ордуна жаңы апельсин ширесин каалайм!',
    c1GreatIdea: 'Абдан даамдуу жана пайдалуу ой экен, досум!',
    c2LostTrain: 'Кечиресиз, шаардын борборуна баруучу тез поезд кайсы платформадан жөнөйт?',
    c2LookHand: 'Төртүнчү платформадан! Кассанын үстүндөгү көк саатты караңыз.',
    c2HahaFound: 'Чоң рахмат! Менин поездим беш мүнөттөн кийин жөнөйт.',
    c3OrderTea: 'Радио-кафеге кош келиңиз! Көк чай же ысык шоколад ичесизби?',
    c3BlueCup: 'Мага чоң көк чыныда көк чай бериңизчи.',
    c3VeryTasty: 'Алыңыз! Музыкадан жана жылуу чайдан ырахат алыңыз.'
  },
  tg: {
    c1HelloMorning: 'Субҳ ба хайр, шунавандагон! Имрӯз дар бораи наҳорӣ суҳбат мекунем.',
    c1WantCoffee: 'Одатан ман як пиёла калони қаҳва менӯшам ва нони гарм мехӯрам.',
    c1NoJuice: 'Ист! Имрӯз ба ҷои қаҳва ман афшураи тару тозаи афлесун мехоҳам!',
    c1GreatIdea: 'Ин фикри хеле болаззат ва муфид аст, дӯстам!',
    c2LostTrain: 'Бубахшед, қатораи тезгарди маркази шаҳр аз кадом платформа меравад?',
    c2LookHand: 'Аз платформаи чорум! Ба соати кабуди болои хазина нигоҳ кунед.',
    c2HahaFound: 'Ташаккури зиёд! Қатораи ман пас аз панҷ дақиқа меравад.',
    c3OrderTea: 'Ба радио-қаҳвахона хуш омадед! Чойи сабз мехоҳед ё шоколади гарм?',
    c3BlueCup: 'Лутфан дар пиёлаи калони кабуд чойи сабз диҳед.',
    c3VeryTasty: 'Марҳамат! Аз мусиқӣ ва чойи гарми худ лаззат баред.'
  },
  cv: {
    c1HelloMorning: 'Ырӑ ир пултӑр, итлекенсем! Паян эпир ирхи апат ҫинчен калаҫатпӑр.',
    c1WantCoffee: 'Яланхи пекех эпӗ пысӑк чашкӑпа кофе ӗҫетӗп тата ӑшӑ ҫӑкӑр ҫиетӗп.',
    c1NoJuice: 'Тӑхта! Паян эпӗ кофе вырӑнне чӗрӗ апельсин сӗткенӗ илесшӗн!',
    c1GreatIdea: 'Ку питӗ тутлӑ та усӑллӑ шухӑш, тусӑм!',
    c2LostTrain: 'Каҫарӑр, хула варрине каякан хӑвӑрт пуйӑс хӑш платформӑран тухать?',
    c2LookHand: 'Тӑваттӑмӗш платформӑран! Касса ҫинчи кӑвак сехет ҫине пӑхӑр.',
    c2HahaFound: 'Пысӑк тав! Ман пуйӑс пилӗк минутран тухать.',
    c3OrderTea: 'Радио-кафене кӗрӗр! Сире симӗс чей е вӗри шоколад кирлӗ-и?',
    c3BlueCup: 'Тархасшӑн, пысӑк кӑвак чашкӑпа симӗс чей парӑр.',
    c3VeryTasty: 'Акӑ сире! Юрӑпа тата ӑшӑ чейпе киленӗр.'
  },
  tab: {
    c1HelloMorning: 'Салам, ишлерихъдар! Гьамус гъурдну сабагьдин ипӀбан гьякьнаан улхурхьа.',
    c1WantCoffee: 'Узу аьдат вуди аьхю финжандиъ кофе убхураза ва мани уьл ипӀураза.',
    c1NoJuice: 'Гъузуз! Гьамус узуз кофедин ерина цӀийи апельсиндин шире ккундузуз!',
    c1GreatIdea: 'Му лап хъайи ва сагълам фикир ву, йиз дуст!',
    c2LostTrain: 'Багъишламиш апӀин, шагьрин мяркязназ гъябгъюрайи поезд фициб платформйиан гъябгъюра?',
    c2LookHand: 'Йиркьубпи платформйиан! Кассйин зиин али завун рангунин сяаьтназ лиг.',
    c2HahaFound: 'Чухсагъул! Йиз поезд хьуб минутдилан гъябгъюра.',
    c3OrderTea: 'Радио-кафейиз хуш гъабхьну! ГъацӀи чай ккундуваз ясана мани шоколад?',
    c3BlueCup: 'Зяиф, аьхю завун чашкйиъ гъацӀи чай тув.',
    c3VeryTasty: 'Гьамус! Музыкйиинди ва мани чайинди шад йихь.'
  },
  ka: {
    c1HelloMorning: 'დილა მშვიდობისა, მსმენელებო! დღეს საუზმეზე ვსაუბრობთ.',
    c1WantCoffee: 'ჩვეულებრივ დიდ ფინჯან ყავას ვსვამ და თბილ ტოსტს ვჭამ.',
    c1NoJuice: 'მოიცადე! დღეს ყავის ნაცვლად ახალი ფორთოხლის წვენი მინდა!',
    c1GreatIdea: 'ეს ძალიან გემრიელი და ჯანსაღი იდეაა, მეგობარო!',
    c2LostTrain: 'უკაცრავად, რომელი ბაქნიდან გადის სწრაფი მატარებელი ცენტრში?',
    c2LookHand: 'მეოთხე ბაქნიდან! შეხედეთ ლურჯ საათს სალაროს თავზე.',
    c2HahaFound: 'დიდი მადლობა! ჩემი მატარებელი ხუთ წუთში გადის.',
    c3OrderTea: 'კეთილი იყოს თქვენი მობრძანება რადიო-კაფეში! მწვანე ჩაი გნებავთ თუ ცხელი შოკოლადი?',
    c3BlueCup: 'მწვანე ჩაი მინდა დიდ ლურჯ ფინჯანში, თუ შეიძლება.',
    c3VeryTasty: 'ინებეთ! ისიამოვნეთ მუსიკით და თბილი ჩაით.'
  },
  hy: {
    c1HelloMorning: 'Բարի լույս, ունկնդիրներ։ Այսօր խոսում ենք նախաճաշի մասին։',
    c1WantCoffee: 'Սովորաբար ես մեծ բաժակով սուրճ եմ խմում և տաք հաց ուտում։',
    c1NoJuice: 'Սպասիր։ Այսօր սուրճի փոխարեն թարմ նարնջի հյութ եմ ուզում։',
    c1GreatIdea: 'Դա շատ համեղ և առողջարար գաղափար է, բարեկամ։',
    c2LostTrain: 'Ներեցեք, ո՞ր կառամատույցից է մեկնում արագընթաց գնացքը կենտրոն։',
    c2LookHand: 'Չորրորդ կառամատույցից։ Նայեք տոմսարկղի վերևի կապույտ ժամացույցին։',
    c2HahaFound: 'Շատ շնորհակալություն։ Իմ գնացքը մեկնում է հինգ րոպեից։',
    c3OrderTea: 'Բարի գալուստ ռադիո սրճարան։ Կանաչ թե՞յ եք ուզում, թե՞ տաք շոկոլադ։',
    c3BlueCup: 'Խնդրում եմ կանաչ թեյ՝ մեծ կապույտ բաժակի մեջ։',
    c3VeryTasty: 'Խնդրեմ։ Վայելեք երաժշտությունը և ձեր տաք թեյը։'
  },
  pl: {
    c1HelloMorning: 'Dzień dobry, słuchacze! Dziś rozmawiamy o śniadaniu.',
    c1WantCoffee: 'Zwykle piję duży kubek kawy i jem ciepłego tosta.',
    c1NoJuice: 'Poczekaj! Dziś zamiast kawy chcę świeży sok pomarańczowy!',
    c1GreatIdea: 'To brzmi pysznie i bardzo zdrowo, przyjacielu!',
    c2LostTrain: 'Przepraszam, z którego peronu odjeżdża szybki pociąg do centrum?',
    c2LookHand: 'Z peronu czwartego! Spójrz na niebieski zegar nad kasą.',
    c2HahaFound: 'Dziękuję bardzo! Mój pociąg odjeżdża za pięć minut.',
    c3OrderTea: 'Witamy w naszej kawiarni radiowej! Zielona herbata czy gorąca czekolada?',
    c3BlueCup: 'Poproszę zieloną herbatę w dużym niebieskim kubku.',
    c3VeryTasty: 'Proszę bardzo! Miłego słuchania muzyki i smacznej herbaty.'
  },
  fi: {
    c1HelloMorning: 'Hyvää huomenta, kuuntelijat! Tänään puhumme aamiaisesta.',
    c1WantCoffee: 'Yleensä juon ison kupin kahvia ja syön lämmintä paahtoleipää.',
    c1NoJuice: 'Odota! Tänään haluan tuoretta appelsiinimehua kahvin sijaan!',
    c1GreatIdea: 'Se kuulostaa herkulliselta ja todella terveelliseltä!',
    c2LostTrain: 'Anteeksi, miltä laiturilta pikajuna keskustaan lähtee?',
    c2LookHand: 'Laiturilta neljä! Katso sinistä kelloa lipunmyynnin yläpuolella.',
    c2HahaFound: 'Kiitos paljon! Junani lähtee viiden minuutin kuluttua.',
    c3OrderTea: 'Tervetuloa radiokahvilaamme! Haluatko vihreää teetä vai kaakaota?',
    c3BlueCup: 'Ottaisin vihreää teetä isossa sinisessä kupissa, kiitos.',
    c3VeryTasty: 'Olkaa hyvä! Nauttikaa musiikista ja lämpimästä teestä.'
  },
  hu: {
    c1HelloMorning: 'Jó reggelt, hallgatók! Ma a reggeliről beszélgetünk.',
    c1WantCoffee: 'Általában egy nagy csésze kávét iszom és meleg pirítóst eszem.',
    c1NoJuice: 'Várj! Ma kávé helyett friss narancslevet szeretnék inni!',
    c1GreatIdea: 'Ez nagyon finoman és egészségesen hangzik, barátom!',
    c2LostTrain: 'Elnézést, melyik vágányról indul a gyorsvonat a központba?',
    c2LookHand: 'A negyedikről! Nézze a kék órát a pénztár fölött.',
    c2HahaFound: 'Nagyon köszönöm! A vonatom öt perc múlva indul.',
    c3OrderTea: 'Üdvözöljük a rádiókávézóban! Zöld teát vagy forró csokoládét kér?',
    c3BlueCup: 'Zöld teát kérek egy nagy kék csészében, legyen szíves.',
    c3VeryTasty: 'Parancsoljon! Élvezze a zenét és a meleg teát.'
  },
  is: {
    c1HelloMorning: 'Góðan daginn, hlustendur! Í dag tölum við um morgunmat.',
    c1WantCoffee: 'Venjulega drekk ég stóran bolla af kaffi og borða ristað brauð.',
    c1NoJuice: 'Bíddu! Í dag vil ég ferskan appelsínusafa í staðinn fyrir kaffi!',
    c1GreatIdea: 'Það hljómar ljúffengt og mjög hollt, vinur minn!',
    c2LostTrain: 'Afsakið, hvaðan fer hraðlestin í miðbæinn?',
    c2LookHand: 'Af braut fjögur! Líttu á bláu klukkuna yfir miðasölunni.',
    c2HahaFound: 'Kærar þakkir! Lestin mín fer eftir fimm mínútur.',
    c3OrderTea: 'Velkomin á útvarpskaffihúsið! Viltu grænt te eða heitt súkkulaði?',
    c3BlueCup: 'Ég ætla að fá grænt te í stórum bláum bolla, takk.',
    c3VeryTasty: 'Gjörðu svo vel! Njóttu tónlistarinnar og tesins.'
  },
  id: {
    c1HelloMorning: 'Selamat pagi, pendengar! Hari ini kita berbicara tentang sarapan.',
    c1WantCoffee: 'Biasanya saya minum secangkir besar kopi dan makan roti panggang.',
    c1NoJuice: 'Tunggu! Hari ini saya mau jus jeruk segar sebagai pengganti kopi!',
    c1GreatIdea: 'Kedengarannya sangat lezat dan sehat, teman!',
    c2LostTrain: 'Permisi, dari peron berapa kereta cepat ke pusat kota berangkat?',
    c2LookHand: 'Dari peron empat! Lihatlah jam biru di atas loket tiket.',
    c2HahaFound: 'Terima kasih banyak! Kereta saya berangkat dalam lima menit.',
    c3OrderTea: 'Selamat datang di kafe radio kami! Mau teh hijau atau cokelat panas?',
    c3BlueCup: 'Saya pesan teh hijau di cangkir biru besar, tolong.',
    c3VeryTasty: 'Silakan! Nikmati musik dan teh hangat Anda.'
  },
  he: {
    c1HelloMorning: 'בוקר טוב, מאזינים! היום אנחנו מדברים על ארוחת בוקר.',
    c1WantCoffee: 'בדרך כלל אני שותה כוס גדולה של קפה ואוכל טוסט חם.',
    c1NoJuice: 'חכה! היום אני רוצה מיץ תפוזים טרי במקום קפה!',
    c1GreatIdea: 'זה נשמע טעים ומאוד בריא, חבר שלי!',
    c2LostTrain: 'סליחה, מאיזה רציף יוצאת הרכבת המהירה למרכז העיר?',
    c2LookHand: 'מרציף מספר ארבע! תסתכל על השעון הכחול מעל הקופה.',
    c2HahaFound: 'תודה רבה! הרכבת שלי יוצאת בעוד חמש דקות.',
    c3OrderTea: 'ברוכים הבאים לקפה הרדיו! תרצו תה ירוק או שוקו חם?',
    c3BlueCup: 'הייתי רוצה תה ירוק בספל כחול גדול, בבקשה.',
    c3VeryTasty: 'בבקשה! תיהנו מהמוזיקה ומהתה החם.'
  },
  hi: {
    c1HelloMorning: 'सुप्रभात श्रोताओं! आज हम नाश्ते के बारे में बात कर रहे हैं।',
    c1WantCoffee: 'आमतौर पर मैं एक बड़ा कप कॉफी पीता हूँ और गर्म टोस्ट खाता हूँ।',
    c1NoJuice: 'रुको! आज मुझे कॉफी की जगह ताजा संतरे का जूस चाहिए!',
    c1GreatIdea: 'यह बहुत स्वादिष्ट और सेहतमंद विचार है, मेरे दोस्त!',
    c2LostTrain: 'माफ़ कीजिए, शहर के केंद्र जाने वाली तेज़ ट्रेन किस प्लेटफॉर्म से जाएगी?',
    c2LookHand: 'प्लेटफॉर्म चार से! टिकट काउंटर के ऊपर नीली घड़ी देखिए।',
    c2HahaFound: 'बहुत धन्यवाद! मेरी ट्रेन पाँच मिनट में छूटने वाली है।',
    c3OrderTea: 'हमारे रेडियो कैफे में आपका स्वागत है! क्या आप हरी चाय लेंगे या गर्म चॉकलेट?',
    c3BlueCup: 'कृपया मुझे बड़े नीले कप में हरी चाय दीजिए।',
    c3VeryTasty: 'यह लीजिए! संगीत और अपनी गर्म चाय का आनंद लें।'
  },
  ro: {
    c1HelloMorning: 'Bună dimineața, ascultători! Astăzi vorbim despre micul dejun.',
    c1WantCoffee: 'De obicei beau o ceașcă mare de cafea și mănânc pâine prăjită.',
    c1NoJuice: 'Stai! Astăzi vreau suc proaspăt de portocale în loc de cafea!',
    c1GreatIdea: 'Sună delicios și foarte sănătos, prietene!',
    c2LostTrain: 'Scuzați-mă, de la ce peron pleacă trenul rapid spre centru?',
    c2LookHand: 'De la peronul patru! Priviți ceasul albastru de deasupra casei de bilete.',
    c2HahaFound: 'Mulțumesc mult! Trenul meu pleacă în cinci minute.',
    c3OrderTea: 'Bine ați venit la cafeneaua radio! Doriți ceai verde sau ciocolată caldă?',
    c3BlueCup: 'Aș dori un ceai verde într-o ceașcă mare albastră, vă rog.',
    c3VeryTasty: 'Poftiți! Bucurați-vă de muzică și de ceaiul cald.'
  },
  et: {
    c1HelloMorning: 'Tere hommikust, kuulajad! Täna räägime hommikusöögist.',
    c1WantCoffee: 'Tavaliselt joon suure tassi kohvi ja söön sooja röstsaia.',
    c1NoJuice: 'Oota! Täna tahan kohvi asemel värsket apelsinimahla!',
    c1GreatIdea: 'See kõlab maitsvalt ja väga tervislikult, mu sõber!',
    c2LostTrain: 'Vabandage, milliselt platvormilt väljub kiirrong kesklinna?',
    c2LookHand: 'Neljandalt platvormilt! Vaadake sinist kella kassa kohal.',
    c2HahaFound: 'Suur tänu! Minu rong väljub viie minuti pärast.',
    c3OrderTea: 'Tere tulemast meie raadiokohvikusse! Kas soovite rohelist teed või kuuma šokolaadi?',
    c3BlueCup: 'Sooviksin rohelist teed suures sinises tassis, palun.',
    c3VeryTasty: 'Palun! Nautige muusikat ja oma sooja teed.'
  },
  lv: {
    c1HelloMorning: 'Labrīt, klausītāji! Šodien mēs runājam par brokastīm.',
    c1WantCoffee: 'Parasti es dzeru lielu tasi kafijas un ēdu siltu grauzdiņu.',
    c1NoJuice: 'Pagaidi! Šodien kafijas vietā es gribu svaigu apelsīnu sulu!',
    c1GreatIdea: 'Tas izklausās gardi un ļoti veselīgi, mans draugs!',
    c2LostTrain: 'Atvainojiet, no kura perona atiet ātrvilciens uz centru?',
    c2LookHand: 'No ceturtā perona! Skatieties uz zilo pulksteni virs kases.',
    c2HahaFound: 'Liels paldies! Mans vilciens atiet pēc piecām minūtēm.',
    c3OrderTea: 'Laipni lūgti mūsu radiokafejnīcā! Vai vēlaties zaļo tēju vai karsto šokolādi?',
    c3BlueCup: 'Es vēlētos zaļo tēju lielā zilā tasē, lūdzu.',
    c3VeryTasty: 'Lūdzu! Izbaudiet mūziku un silto tēju.'
  },
  lt: {
    c1HelloMorning: 'Labas rytas, klausytojai! Šiandien kalbame apie pusryčius.',
    c1WantCoffee: 'Paprastai geriu didelį puodelį kavos ir valgau šiltą skrebučio riekelę.',
    c1NoJuice: 'Palauk! Šiandien vietoj kavos noriu šviežių apelsinų sulčių!',
    c1GreatIdea: 'Tai skamba skaniai ir labai sveikai, mano drauge!',
    c2LostTrain: 'Atsiprašau, iš kurio perono išvyksta greitasis traukinys į centrą?',
    c2LookHand: 'Iš ketvirto perono! Pažiūrėkite į mėlyną laikrodį virš kasos.',
    c2HahaFound: 'Labai ačiū! Mano traukinys išvyksta po penkių minučių.',
    c3OrderTea: 'Sveiki atvykę į mūsų radijo kavinę! Norėtumėte žaliosios arbatos ar karšto šokolado?',
    c3BlueCup: 'Norėčiau žaliosios arbatos dideliame mėlyname puodelyje, prašau.',
    c3VeryTasty: 'Štai prašau! Mėgaukitės muzika ir šilta arbata.'
  },
  eu: {
    c1HelloMorning: 'Egun on, entzuleak! Gaur gosariari buruz hitz egiten ari gara.',
    c1WantCoffee: 'Normalean kafe katilu handi bat edaten dut eta ogi txigortua jaten dut.',
    c1NoJuice: 'Itxaron! Gaur kafearen ordez laranja zuku freskoa nahi dut!',
    c1GreatIdea: 'Hori oso goxoa eta osasungarria dirudi, laguna!',
    c2LostTrain: 'Barkatu, zein nasatik irteten da erdigunerako tren azkarra?',
    c2LookHand: 'Laugarren nasatik! Begiratu leihatilaren gaineko erloju urdinari.',
    c2HahaFound: 'Eskerrik asko! Nire trena bost minutu barru irtengo da.',
    c3OrderTea: 'Ongi etorri gure irrati kafetegira! Te berdea ala txokolate beroa nahi duzu?',
    c3BlueCup: 'Te berdea nahi nuke katilu urdin handi batean, mesedez.',
    c3VeryTasty: 'Hemen duzu! Gozatu musikaz eta te beroaz.'
  },
  nv: {
    c1HelloMorning: 'Yá’át’ééh abíní! Díí jį́ abíní da’adání baa yádeiilti’.',
    c1WantCoffee: 'T’áá áłahjį’ gohwééh nitsaago yishdlą́ dóó bááh łitsoii yishą́.',
    c1NoJuice: 'T’áá k’ad! Díí jį́ ch’il łitsxooí bitoo’ nisin!',
    c1GreatIdea: 'Éí ayóo łikan dóó baa hózhǫ́, sik’is!',
    c2LostTrain: 'Shik’is, háádę́ę́’shą’ kǫ’ na’ałbąąsii tsxį́įłgo kin tahgóó dah diighááh?',
    c2LookHand: 'Dį́į́’ góne’! Kǫ’ na’ałbąąsii baa dah sitánígi néinił’į́.',
    c2HahaFound: 'Ahéhee’! Ashdla’ dah alzhinjį’ dah diighááh.',
    c3OrderTea: 'Yá’át’ééh! Ch’il ahwééh dootł’izhí doodaii’ chokoláátł sidohíísh nínízin?',
    c3BlueCup: 'Ch’il ahwééh dootł’izhí bee’idlání dootł’izh nitsaago shaa ní’aah.',
    c3VeryTasty: 'Kót’é! Sin dóó ch’il ahwééh baa nił hózhǫ́ǫ́ le’.'
  },
  nl: {
    c1HelloMorning: 'Goedemorgen, luisteraars! Vandaag praten we over het ontbijt.',
    c1WantCoffee: 'Meestal drink ik een grote kop koffie met warme toast.',
    c1NoJuice: 'Wacht! Vandaag wil ik verse sinaasappelsap in plaats van koffie!',
    c1GreatIdea: 'Dat klinkt heerlijk en heel gezond, mijn vriend!',
    c2LostTrain: 'Pardon, van welk spoor vertrekt de sneltrein naar het centrum?',
    c2LookHand: 'Van spoor vier! Kijk naar de blauwe klok boven het loket.',
    c2HahaFound: 'Hartelijk dank! Mijn trein vertrekt over vijf minuten.',
    c3OrderTea: 'Welkom in ons radiocafé! Wilt u groene thee of warme chocolademelk?',
    c3BlueCup: 'Ik wil graag groene thee in een grote blauwe kop, alstublieft.',
    c3VeryTasty: 'Alstublieft! Geniet van de muziek en uw warme thee.'
  },
  cs: {
    c1HelloMorning: 'Dobré ráno, posluchači! Dnes si povídáme o snídani.',
    c1WantCoffee: 'Obvykle piju velký šálek kávy a jím teplý toast.',
    c1NoJuice: 'Počkej! Dnes chci místo kávy čerstvý pomerančový džus!',
    c1GreatIdea: 'To zní výborně a velmi zdravě, příteli!',
    c2LostTrain: 'Promiňte, z kterého nástupiště odjíždí rychlík do centra města?',
    c2LookHand: 'Ze čtvrtého nástupiště! Podívejte se na modré hodiny nad pokladnou.',
    c2HahaFound: 'Moc děkuji! Můj vlak odjíždí za pět minut.',
    c3OrderTea: 'Vítejte v naší rozhlasové kavárně! Dáte si zelený čaj nebo horkou čokoládu?',
    c3BlueCup: 'Dal bych si zelený čaj ve velkém modrém šálku, prosím.',
    c3VeryTasty: 'Tady máte! Užijte si hudbu a teplý čaj.'
  },
  el: {
    c1HelloMorning: 'Καλημέρα, ακροατές! Σήμερα μιλάμε για το πρωινό.',
    c1WantCoffee: 'Συνήθως πίνω ένα μεγάλο φλιτζάνι καφέ και τρώω ζεστό τοστ.',
    c1NoJuice: 'Περίμενε! Σήμερα θέλω φρέσκο χυμό πορτοκάλι αντί για καφέ!',
    c1GreatIdea: 'Αυτό ακούγεται υπέροχο και πολύ υγιεινό, φίλε μου!',
    c2LostTrain: 'Συγγνώμη, από ποια αποβάθρα φεύγει το γρήγορο τρένο για το κέντρο;',
    c2LookHand: 'Από την αποβάθρα τέσσερα! Κοιτάξτε το μπλε ρολόι πάνω από το ταμείο.',
    c2HahaFound: 'Ευχαριστώ πολύ! Το τρένο μου φεύγει σε πέντε λεπτά.',
    c3OrderTea: 'Καλώς ήρθατε στο ραδιοφωνικό καφέ! Θέλετε πράσινο τσάι ή ζεστή σοκολάτα;',
    c3BlueCup: 'Θα ήθελα πράσινο τσάι σε ένα μεγάλο μπλε φλιτζάνι, παρακαλώ.',
    c3VeryTasty: 'Ορίστε! Απολαύστε τη μουσική και το ζεστό σας τσάι.'
  },
  vi: {
    c1HelloMorning: 'Chào buổi sáng quý vị thính giả! Hôm nay chúng ta nói về bữa sáng.',
    c1WantCoffee: 'Thường thì tôi uống một tách cà phê lớn và ăn bánh mì nướng ấm.',
    c1NoJuice: 'Khoan đã! Hôm nay tôi muốn uống nước cam tươi thay cho cà phê!',
    c1GreatIdea: 'Nghe thật ngon và rất tốt cho sức khỏe, bạn của tôi!',
    c2LostTrain: 'Xin lỗi, tàu nhanh đi trung tâm thành phố khởi hành từ sân ga nào ạ?',
    c2LookHand: 'Từ sân ga số bốn! Hãy nhìn chiếc đồng hồ màu xanh phía trên quầy vé.',
    c2HahaFound: 'Cảm ơn rất nhiều! Tàu của tôi sẽ chạy sau năm phút nữa.',
    c3OrderTea: 'Chào mừng đến với quán cà phê radio! Bạn muốn trà xanh hay sô cô la nóng?',
    c3BlueCup: 'Làm ơn cho tôi trà xanh trong chiếc tách lớn màu xanh dương.',
    c3VeryTasty: 'Của bạn đây! Chúc bạn thưởng thức âm nhạc và tách trà ấm.'
  },
  th: {
    c1HelloMorning: 'สวัสดีตอนเช้าครับผู้ฟัง วันนี้เราจะมาคุยกันเรื่องอาหารเช้า',
    c1WantCoffee: 'ปกติฉันดื่มกาแฟแก้วใหญ่และกินขนมปังปิ้งอุ่นๆ',
    c1NoJuice: 'เดี๋ยวก่อน! วันนี้ฉันอยากดื่มน้ำส้มคั้นสดแทนกาแฟ!',
    c1GreatIdea: 'ฟังดูอร่อยและดีต่อสุขภาพมากเลยเพื่อน!',
    c2LostTrain: 'ขอโทษครับ รถไฟด่วนเข้าเมืองออกจากชานชาลาไหนครับ',
    c2LookHand: 'ชานชาลาที่สี่ครับ! ดูที่นาฬิกาสีน้ำเงินเหนือช่องขายตั๋วสิครับ',
    c2HahaFound: 'ขอบคุณมากครับ! รถไฟของฉันจะออกในอีกห้านาที',
    c3OrderTea: 'ยินดีต้อนรับสู่ร้านกาแฟวิทยุ! รับชาเขียวหรือช็อกโกแลตร้อนดีครับ',
    c3BlueCup: 'ขอชาเขียวใส่แก้วสีน้ำเงินใบใหญ่หน่อยครับ',
    c3VeryTasty: 'ได้แล้วครับ! เพลิดเพลินกับเสียงเพลงและชาอุ่นๆ นะครับ'
  }
};

function getTemplateForCourse(courseId: string): TargetLanguageTemplate {
  const normalized = normalizeCourseLangCode(courseId);
  if (courseId === 'mo') return TARGET_TEMPLATES.ro;
  if (courseId.startsWith('rf-') && courseId !== 'rf-chuvash') return TARGET_TEMPLATES.ru;
  return TARGET_TEMPLATES[courseId] || TARGET_TEMPLATES[normalized] || TARGET_TEMPLATES.ru;
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
  const guestSpeaker = isRuHost ? 'Участник эфира' : 'Audio Track';
  const stationSpeaker = isRuHost ? 'Объявление станции' : 'Station Announcement';
  const baristaSpeaker = isRuHost ? 'Кафе эфира' : 'Radio Cafe';

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

export const NON_LANGUAGE_COURSE_IDS = new Set(['math', 'music', 'chess', 'coding', 'art']);
export const RADIO_UNAVAILABLE_LANGUAGE_IDS = new Set(['tlh']);

export const FALLBACK_RADIO_COURSES: Course[] = [
  { id: 'en', name: 'English', localName: 'Английский', flagCode: 'us', themeColor: 'bg-duo-blue', themeBorder: 'border-duo-blueDark', mascotVariant: 'default' },
  { id: 'es', name: 'Spanish', localName: 'Испанский (Español)', flagCode: 'es', themeColor: 'bg-yellow-500', themeBorder: 'border-yellow-700', mascotVariant: 'default' },
  { id: 'fr', name: 'French', localName: 'Французский (Français)', flagCode: 'fr', themeColor: 'bg-indigo-500', themeBorder: 'border-indigo-700', mascotVariant: 'default' },
  { id: 'de', name: 'German', localName: 'Немецкий (Deutsch)', flagCode: 'de', themeColor: 'bg-orange-500', themeBorder: 'border-orange-700', mascotVariant: 'default' },
  { id: 'it', name: 'Italian', localName: 'Итальянский (Italiano)', flagCode: 'it', themeColor: 'bg-green-600', themeBorder: 'border-green-800', mascotVariant: 'default' },
  { id: 'pt', name: 'Portuguese', localName: 'Португальский (Português)', flagCode: 'br', themeColor: 'bg-blue-500', themeBorder: 'border-blue-700', mascotVariant: 'default' },
  { id: 'ja', name: 'Japanese', localName: 'Японский (日本語)', flagCode: 'jp', themeColor: 'bg-rose-500', themeBorder: 'border-rose-700', mascotVariant: 'default' },
  { id: 'zh', name: 'Chinese', localName: 'Китайский (中文)', flagCode: 'cn', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'ko', name: 'Korean', localName: 'Корейский (한국어)', flagCode: 'kr', themeColor: 'bg-sky-400', themeBorder: 'border-sky-600', mascotVariant: 'default' },
  { id: 'ar', name: 'Arabic', localName: 'Арабский (العربية)', flagCode: 'sa', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default' },
  { id: 'he', name: 'Hebrew', localName: 'Иврит (עברית)', flagCode: 'il', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
  { id: 'id', name: 'Indonesian', localName: 'Индонезийский (Bahasa Indonesia)', flagCode: 'id', themeColor: 'bg-teal-600', themeBorder: 'border-teal-800', mascotVariant: 'default' },
  { id: 'eo', name: 'Esperanto', localName: 'Эсперанто (Esperanto)', flagCode: 'eu', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default' },
  { id: 'ru', name: 'Russian', localName: 'Русский (Россия)', flagCode: 'ru', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
  { id: 'be', name: 'Belarusian', localName: 'Белорусский (Беларусь)', flagCode: 'by', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'uk', name: 'Ukrainian', localName: 'Украинский (Украина)', flagCode: 'ua', themeColor: 'bg-amber-500', themeBorder: 'border-amber-700', mascotVariant: 'default' },
  { id: 'mo', name: 'Moldavian', localName: 'Молдавский (Молдова)', flagCode: 'md', themeColor: 'bg-blue-700', themeBorder: 'border-blue-900', mascotVariant: 'default' },
  { id: 'kk', name: 'Kazakh', localName: 'Казахский (Казахстан)', flagCode: 'kz', themeColor: 'bg-sky-500', themeBorder: 'border-sky-700', mascotVariant: 'default' },
  { id: 'uz', name: 'Uzbek', localName: 'Узбекский (Узбекистан)', flagCode: 'uz', themeColor: 'bg-emerald-500', themeBorder: 'border-emerald-700', mascotVariant: 'default' },
  { id: 'hy', name: 'Armenian', localName: 'Армянский (Армения)', flagCode: 'am', themeColor: 'bg-orange-600', themeBorder: 'border-orange-800', mascotVariant: 'default' },
  { id: 'ka', name: 'Georgian', localName: 'Грузинский (Грузия)', flagCode: 'ge', themeColor: 'bg-rose-600', themeBorder: 'border-rose-800', mascotVariant: 'default' },
  { id: 'az', name: 'Azerbaijani', localName: 'Азербайджанский (Азербайджан)', flagCode: 'az', themeColor: 'bg-cyan-600', themeBorder: 'border-cyan-800', mascotVariant: 'default' },
  { id: 'tk', name: 'Turkmen', localName: 'Туркменский (Туркменистан)', flagCode: 'tm', themeColor: 'bg-green-700', themeBorder: 'border-green-900', mascotVariant: 'default' },
  { id: 'ky', name: 'Kyrgyz', localName: 'Киргизский (Кыргызстан)', flagCode: 'kg', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'tg', name: 'Tajik', localName: 'Таджикский (Таджикистан)', flagCode: 'tj', themeColor: 'bg-green-600', themeBorder: 'border-green-800', mascotVariant: 'default' },
  { id: 'lt', name: 'Lithuanian', localName: 'Литовский (Литва)', flagCode: 'lt', themeColor: 'bg-yellow-600', themeBorder: 'border-yellow-800', mascotVariant: 'default' },
  { id: 'lv', name: 'Latvian', localName: 'Латышский (Латвия)', flagCode: 'lv', themeColor: 'bg-red-700', themeBorder: 'border-red-900', mascotVariant: 'default' },
  { id: 'et', name: 'Estonian', localName: 'Эстонский (Эстония)', flagCode: 'ee', themeColor: 'bg-sky-600', themeBorder: 'border-sky-800', mascotVariant: 'default' },
  { id: 'la', name: 'Latin', localName: 'Латынь (Lingua Latina)', flagCode: 'it', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default', isBeta: true },
  { id: 'sv', name: 'Swedish', localName: 'Шведский (Svenska)', flagCode: 'se', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default', isBeta: true },
  { id: 'no', name: 'Norwegian', localName: 'Норвежский (Norsk)', flagCode: 'no', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default', isBeta: true },
  { id: 'tt', name: 'Tatar', localName: 'Татарский (Татар теле)', flagCode: 'ru', themeColor: 'bg-teal-600', themeBorder: 'border-teal-800', mascotVariant: 'default', isBeta: true },
  { id: 'hv', name: 'High Valyrian', localName: 'Высокий валирийский (Valyrio)', flagCode: 'gb', themeColor: 'bg-purple-700', themeBorder: 'border-purple-900', mascotVariant: 'default', isBeta: true },
  { id: 'yi', name: 'Yiddish', localName: 'Идиш (ייִдиш)', flagCode: 'il', themeColor: 'bg-indigo-600', themeBorder: 'border-indigo-800', mascotVariant: 'default', isBeta: true },
  { id: 'tab', name: 'Tabasaran', localName: 'Табасаранский (Табасаран)', flagCode: 'ru', themeColor: 'bg-purple-600', themeBorder: 'border-purple-800', mascotVariant: 'default' },
  { id: 'cv', name: 'Chuvash', localName: 'Чувашский (Чӑвашла)', flagCode: 'ru', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default' },
  { id: 'hu', name: 'Hungarian', localName: 'Венгерский (Magyar)', flagCode: 'hu', themeColor: 'bg-red-500', themeBorder: 'border-red-700', mascotVariant: 'default' },
  { id: 'eu', name: 'Basque', localName: 'Баскский (Euskara)', flagCode: 'es', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default' },
  { id: 'fi', name: 'Finnish', localName: 'Финский (Suomi)', flagCode: 'fi', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
  { id: 'nv', name: 'Navajo', localName: 'Навахо (Diné bizaad)', flagCode: 'us', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default' },
  { id: 'is', name: 'Icelandic', localName: 'Исландский (Íslenska)', flagCode: 'is', themeColor: 'bg-indigo-600', themeBorder: 'border-indigo-800', mascotVariant: 'default' },
  { id: 'pl', name: 'Polish', localName: 'Польский (Polski)', flagCode: 'pl', themeColor: 'bg-rose-500', themeBorder: 'border-rose-700', mascotVariant: 'default' },
  { id: 'tlh', name: 'Klingon', localName: 'Клингонский (tlhIngan Hol)', flagCode: 'us', themeColor: 'bg-stone-700', themeBorder: 'border-stone-900', mascotVariant: 'default', isBeta: true },
  { id: 'math', name: 'Mathematics', localName: 'Математика (Курс не является языком • Точные науки)', flagCode: 'math', themeColor: 'bg-duo-blue', themeBorder: 'border-duo-blueDark', mascotVariant: 'math' },
  { id: 'music', name: 'Music', localName: 'Музыка (Курс не является языком • Ноты и ритм)', flagCode: 'music', themeColor: 'bg-pink-500', themeBorder: 'border-pink-700', mascotVariant: 'music' },
  { id: 'chess', name: 'Chess', localName: 'Шахматы (Курс не является языком • Навык/Игра)', flagCode: 'chess', themeColor: 'bg-slate-600', themeBorder: 'border-slate-800', mascotVariant: 'chess' },
  { id: 'coding', name: 'Programming', localName: 'Программирование (Курс не является языком • Навык/Игра)', flagCode: 'coding', themeColor: 'bg-indigo-600', themeBorder: 'border-indigo-800', mascotVariant: 'default' },
  { id: 'art', name: 'Art', localName: 'Рисование и Каллиграфия (Курс не является языком • Творчество)', flagCode: 'art', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default' }
];

export interface RadioCourseAvailabilityLists {
  availableLanguageCourses: Course[];
  unavailableLanguageCourses: Course[];
  nonLanguageCourses: Course[];
}

export function classifyCoursesForRadio(courses?: Course[]): RadioCourseAvailabilityLists {
  const source = courses && courses.length > 0 ? courses : FALLBACK_RADIO_COURSES;
  const deduped = new Map<string, Course>();
  for (const c of source) {
    if (c && c.id && !deduped.has(c.id)) {
      deduped.set(c.id, c);
    }
  }
  for (const fb of FALLBACK_RADIO_COURSES) {
    if (!deduped.has(fb.id)) {
      deduped.set(fb.id, fb);
    }
  }

  const availableLanguageCourses: Course[] = [];
  const unavailableLanguageCourses: Course[] = [];
  const nonLanguageCourses: Course[] = [];

  for (const c of deduped.values()) {
    if (NON_LANGUAGE_COURSE_IDS.has(c.id)) {
      nonLanguageCourses.push(c);
    } else if (RADIO_UNAVAILABLE_LANGUAGE_IDS.has(c.id)) {
      unavailableLanguageCourses.push(c);
    } else {
      availableLanguageCourses.push(c);
    }
  }

  return {
    availableLanguageCourses,
    unavailableLanguageCourses,
    nonLanguageCourses
  };
}

function extractJsonObject(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return undefined;
  const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!cleaned) return undefined;
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

let localScenarioCursor = 0;

/**
 * Builds an immediately playable episode directly from user-entered text/lines,
 * or from a topic phrase in the course's target language.
 */
export function buildEpisodeFromCustomText(
  course: Course,
  customText: string,
  userLanguage: string = 'ru',
  difficultyLevel: 'easy' | 'hard' = 'easy',
  langSection: number = 1,
  isAiBadge: boolean = false
): DuoRadioEpisode {
  const isRuHost = userLanguage !== 'en';
  const owlSpeaker = isRuHost ? 'Сова DuoWindo6601' : 'Owl DuoWindo6601';
  const guestSpeaker = isRuHost ? 'Гость эфира' : 'Radio Guest';
  const courseLabel = course.localName || course.name;
  const levelLabel = difficultyLevel === 'hard' ? 'B1-B2' : `A${Math.min(2, Math.max(1, Math.ceil(langSection / 2)))}`;
  const hostIsTargetLang =
    (course.id === 'ru' && isRuHost) || (course.id === 'en' && !isRuHost);
  const nowId = Date.now();
  const cleanText = (customText || '').trim();

  // Split user text by newlines or sentence punctuation
  const rawSegments = cleanText
    .split(/\r?\n+|(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 8);

  const tpl = getTemplateForCourse(course.id);
  const effectiveLines =
    rawSegments.length >= 2
      ? rawSegments
      : rawSegments.length === 1 && rawSegments[0].split(/\s+/).length >= 4
      ? [rawSegments[0], tpl.c3VeryTasty]
      : [
          rawSegments[0] ? `${rawSegments[0]} — ${tpl.c1HelloMorning}` : tpl.c1HelloMorning,
          tpl.c3OrderTea,
          tpl.c3BlueCup,
          tpl.c3VeryTasty
        ];

  const cues: DuoRadioCue[] = [
    {
      id: `custom-c0-${nowId}`,
      speaker: owlSpeaker,
      avatar: '🦉',
      role: 'host',
      isFamiliarLang: !hostIsTargetLang,
      text: isRuHost
        ? `Специальный выпуск DuoWindo6601Radio по вашему тексту для курса «${courseLabel}»! Слушайте реплики в эфире и отвечайте на вопросы.`
        : `Custom DuoWindo6601Radio episode for ${courseLabel}! Listen carefully to your broadcast lines and answer the checks.`,
      translationRu: `Спецвыпуск DuoWindo6601Radio по вашему тексту (${courseLabel}).`,
      translationEn: `Custom DuoWindo6601Radio episode (${courseLabel}).`
    }
  ];

  effectiveLines.forEach((line, i) => {
    cues.push({
      id: `custom-c${i + 1}-${nowId}`,
      speaker: i % 2 === 0 ? owlSpeaker : guestSpeaker,
      avatar: i % 2 === 0 ? '🦉' : '🎙️',
      role: 'character',
      isFamiliarLang: false,
      text: line,
      translationRu: line,
      translationEn: line
    });

    if (i === Math.floor(effectiveLines.length / 2) - 1 && effectiveLines.length >= 3) {
      cues.push({
        id: `custom-tip-${nowId}`,
        speaker: owlSpeaker,
        avatar: '🦉',
        role: 'host',
        isFamiliarLang: !hostIsTargetLang,
        text: isRuHost
          ? 'Половина вашего выпуска позади! Продолжаем слушать интонацию и ключевые слова.'
          : 'Halfway through your custom broadcast! Keep listening for intonation and key words.',
        translationRu: 'Слушаем вторую часть вашего текста.',
        translationEn: 'Listening to the second half of your custom text.'
      });
    }
  });

  const firstSpokenIdx = 1;
  const midTargetIdx = Math.min(cues.length - 1, 2);
  const finalTargetIdx = cues.length - 1;
  const snippetA = (cues[firstSpokenIdx]?.text || '').slice(0, 64);
  const snippetB = (cues[finalTargetIdx]?.text || '').slice(0, 64);

  const questions: DuoRadioQuestion[] = [
    {
      id: `custom-q1-${nowId}`,
      stage: 'mid',
      afterCueIndex: midTargetIdx,
      replayCueIndex: firstSpokenIdx,
      questionRu: 'Какая фраза прозвучала в начале вашего выпуска?',
      questionEn: 'Which phrase was spoken at the start of your episode?',
      optionsRu: [
        snippetA,
        'Поезд отправляется с десятой платформы завтра',
        'Сегодня на радио звучит только тишина'
      ],
      optionsEn: [
        snippetA,
        'The train departs from platform ten tomorrow',
        'Only silence is playing on the radio today'
      ],
      correctIndex: 0,
      explanationRu: `В начале выпуска прозвучала реплика: «${snippetA}».`,
      explanationEn: `At the start of the episode you heard: "${snippetA}".`
    },
    {
      id: `custom-q2-${nowId}`,
      stage: 'final',
      afterCueIndex: finalTargetIdx,
      replayCueIndex: finalTargetIdx,
      questionRu: 'Какой фразой завершился выпуск?',
      questionEn: 'Which line concluded the episode?',
      optionsRu: [
        'Магазин закрылся на ремонт',
        snippetB,
        'Никто не пришёл на встречу'
      ],
      optionsEn: [
        'The shop closed for repairs',
        snippetB,
        'Nobody came to the meeting'
      ],
      correctIndex: 1,
      explanationRu: `Финальная реплика выпуска: «${snippetB}».`,
      explanationEn: `Final line of the broadcast: "${snippetB}".`
    }
  ];

  const topicPreview = cleanText.length > 38 ? `${cleanText.slice(0, 38)}…` : cleanText;

  return {
    id: `radio-custom-${course.id}-${nowId}`,
    courseId: course.id,
    showNameRu: 'Персональная студия Совы DuoWindo6601',
    showNameEn: 'Owl DuoWindo6601 Custom Studio',
    titleRu: topicPreview ? `Выпуск: ${topicPreview}` : `Выпуск по тексту (${courseLabel})`,
    titleEn: topicPreview ? `Episode: ${topicPreview}` : `Custom Episode (${courseLabel})`,
    descRu: `Интерактивный аудиовыпуск на языке курса (${courseLabel}), собранный по введённому тексту.`,
    descEn: `Interactive audio episode in ${courseLabel} created from your custom text.`,
    hostName: owlSpeaker,
    durationLabel: '1:20',
    levelBadge: levelLabel,
    icon: '📝',
    isAiGenerated: isAiBadge,
    cues,
    questions
  };
}

/**
 * Guaranteed local dynamic episode generator so "Новый выпуск (AI)" works 100% of the time
 * across every language course (including CIS, World, Beta & regional courses) even if
 * Gemini quota/rate-limits fail over or offline mode is active.
 */
export function buildLocalDynamicRadioEpisode(
  course: Course,
  userLanguage: string = 'ru',
  difficultyLevel: 'easy' | 'hard' = 'easy',
  langSection: number = 1,
  customEpisodeText?: string
): DuoRadioEpisode {
  if (customEpisodeText && customEpisodeText.trim().length > 0) {
    return buildEpisodeFromCustomText(course, customEpisodeText, userLanguage, difficultyLevel, langSection, true);
  }

  const tpl = getTemplateForCourse(course.id);
  const isRuHost = userLanguage !== 'en';
  const owlSpeaker = isRuHost ? 'Сова DuoWindo6601' : 'Owl DuoWindo6601';
  const guestSpeaker = isRuHost ? 'Гость эфира' : 'Radio Guest';
  const courseLabel = course.localName || course.name;
  const levelLabel = difficultyLevel === 'hard' ? 'B1-B2' : `A${Math.min(2, Math.max(1, Math.ceil(langSection / 2)))}`;
  const hostIsTargetLang =
    (course.id === 'ru' && isRuHost) || (course.id === 'en' && !isRuHost);
  const nowId = Date.now();

  const variant = localScenarioCursor % 3;
  localScenarioCursor += 1;

  if (variant === 0) {
    return {
      id: `radio-ai-${course.id}-${nowId}`,
      courseId: course.id,
      showNameRu: 'Утренний экспресс Совы DuoWindo6601',
      showNameEn: 'Owl DuoWindo6601 Morning Express',
      titleRu: `Путь в центр и зелёный чай (${courseLabel})`,
      titleEn: `Trip Downtown & Green Tea (${courseLabel})`,
      descRu: `Новый динамический выпуск на языке курса (${courseLabel}): совмещаем дорогу на вокзале и заказ в кафе.`,
      descEn: `Fresh dynamic episode in ${courseLabel}: combining train directions and a cafe order.`,
      hostName: owlSpeaker,
      durationLabel: '1:40',
      levelBadge: levelLabel,
      icon: '🎙️',
      isAiGenerated: true,
      cues: [
        {
          id: `dyn0-c0-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? `Добро пожаловать в свежий выпуск DuoWindo6601Radio для курса «${courseLabel}»! Слушайте номер платформы и то, что гость заказал перед дорогой.`
            : `Welcome to a fresh DuoWindo6601Radio episode for ${courseLabel}! Listen for the platform number and the drink ordered before the trip.`,
          translationRu: `Свежий выпуск DuoWindo6601Radio для курса «${courseLabel}».`,
          translationEn: `Fresh DuoWindo6601Radio episode for ${courseLabel}.`
        },
        {
          id: `dyn0-c1-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c2LostTrain,
          translationRu: 'Извините, с какой платформы отправляется скорый поезд в центр города?',
          translationEn: 'Excuse me, where does the fast train to the city center leave from?'
        },
        {
          id: `dyn0-c2-${nowId}`,
          speaker: guestSpeaker,
          avatar: '🚉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c2LookHand,
          translationRu: 'С четвёртой платформы! Посмотрите на синие часы над кассой.',
          translationEn: 'Platform four! Look at the blue clock above the ticket desk.'
        },
        {
          id: `dyn0-c3-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Обратите внимание на вежливую просьбу дальше — Сова DuoWindo6601 успевает заглянуть в вокзальное кафе!'
            : 'Notice the polite phrasing next — Owl DuoWindo6601 stops by the station cafe!',
          translationRu: 'Совет по аудированию: слушайте ключевые слова заказа.',
          translationEn: 'Listening tip: catch the key words of the order.'
        },
        {
          id: `dyn0-c4-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c3BlueCup,
          translationRu: 'Мне, пожалуйста, зелёный чай в большой синей чашке.',
          translationEn: 'I would like green tea in a large blue cup, please.'
        }
      ],
      questions: [
        {
          id: `dyn0-q1-${nowId}`,
          stage: 'mid',
          afterCueIndex: 2,
          replayCueIndex: 2,
          questionRu: 'Где находятся синие часы из объявления?',
          questionEn: 'Where is the blue clock mentioned in the reply?',
          optionsRu: ['Над кассой на четвёртой платформе', 'Внутри поезда у окна', 'На крыше кафе'],
          optionsEn: ['Above the ticket desk at platform four', 'Inside the train by the window', 'On the cafe roof'],
          correctIndex: 0,
          explanationRu: 'В реплике указано, что скорый поезд идёт с четвёртой платформы, а синие часы висят над кассой.',
          explanationEn: 'The reply says platform four and the blue clock is above the ticket desk.'
        },
        {
          id: `dyn0-q2-${nowId}`,
          stage: 'final',
          afterCueIndex: 4,
          replayCueIndex: 4,
          questionRu: 'Что попросила Сова DuoWindo6601 в конце выпуска?',
          questionEn: 'What did Owl DuoWindo6601 ask for at the end of the episode?',
          optionsRu: ['Чёрный кофе в маленькой чашке', 'Зелёный чай в большой синей чашке', 'Стакан холодной воды'],
          optionsEn: ['Black coffee in a small cup', 'Green tea in a large blue cup', 'A glass of cold water'],
          correctIndex: 1,
          explanationRu: 'Сова DuoWindo6601 заказала зелёный чай в большой синей чашке.',
          explanationEn: 'Owl DuoWindo6601 ordered green tea in a large blue cup.'
        }
      ]
    };
  }

  if (variant === 1) {
    return {
      id: `radio-ai-${course.id}-${nowId}`,
      courseId: course.id,
      showNameRu: 'Живой диалог DuoWindo6601Radio',
      showNameEn: 'DuoWindo6601Radio Live Dialogue',
      titleRu: `Полезное утро в студии (${courseLabel})`,
      titleEn: `Healthy Studio Morning (${courseLabel})`,
      descRu: `Тренировка восприятия живой речи (${courseLabel}): утренний выбор напитков и приглашение в радио-кафе.`,
      descEn: `Live listening drill (${courseLabel}): morning beverage choices and radio cafe welcome.`,
      hostName: owlSpeaker,
      durationLabel: '1:35',
      levelBadge: levelLabel,
      icon: '🎧',
      isAiGenerated: true,
      cues: [
        {
          id: `dyn1-c0-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? `В эфире DuoWindo6601Radio — новый выпуск для изучающих «${courseLabel}». Послушайте, почему гость решил поменять свою привычку.`
            : `On DuoWindo6601Radio — a new episode for ${courseLabel} learners. Listen to why our guest changed their morning habit.`,
          translationRu: `Новый выпуск DuoWindo6601Radio для курса «${courseLabel}».`,
          translationEn: `New DuoWindo6601Radio episode for ${courseLabel}.`
        },
        {
          id: `dyn1-c1-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1HelloMorning,
          translationRu: 'Доброе утро, слушатели! Сегодня мы говорим о завтраке.',
          translationEn: 'Good morning, listeners! Today we are talking about breakfast.'
        },
        {
          id: `dyn1-c2-${nowId}`,
          speaker: guestSpeaker,
          avatar: '🎙️',
          role: 'character',
          isFamiliarLang: false,
          text: tpl.c1NoJuice,
          translationRu: 'Подожди! Сегодня вместо кофе я хочу свежий апельсиновый сок!',
          translationEn: 'Wait! Today I want fresh orange juice instead of coffee!'
        },
        {
          id: `dyn1-c3-${nowId}`,
          speaker: owlSpeaker,
          avatar: '🦉',
          role: 'host',
          isFamiliarLang: !hostIsTargetLang,
          text: isRuHost
            ? 'Запомните реакцию ведущего: похвала за полезный выбор звучит мягко и доброжелательно.'
            : 'Notice the host’s reaction: praising a healthy choice sounds warm and friendly.',
          translationRu: 'Сова DuoWindo6601 комментирует реакцию собеседника.',
          translationEn: 'Owl DuoWindo6601 highlights the speaker’s reaction.'
        },
        {
          id: `dyn1-c4-${nowId}`,
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
          id: `dyn1-q1-${nowId}`,
          stage: 'mid',
          afterCueIndex: 2,
          replayCueIndex: 2,
          questionRu: 'Какой напиток выбрал гость вместо кофе?',
          questionEn: 'Which drink did the guest choose instead of coffee?',
          optionsRu: ['Свежий апельсиновый сок', 'Горячий шоколад', 'Томатный сок'],
          optionsEn: ['Fresh orange juice', 'Hot chocolate', 'Tomato juice'],
          correctIndex: 0,
          explanationRu: 'Гость сказал, что сегодня хочет свежий апельсиновый сок.',
          explanationEn: 'The guest said they want fresh orange juice today.'
        },
        {
          id: `dyn1-q2-${nowId}`,
          stage: 'final',
          afterCueIndex: 4,
          replayCueIndex: 4,
          questionRu: 'Как Сова DuoWindo6601 оценила идею гостя?',
          questionEn: 'How did Owl DuoWindo6601 react to the guest’s idea?',
          optionsRu: ['Сказала, что это слишком рано', 'Назвала это вкусным и полезным выбором', 'Попросила подождать до вечера'],
          optionsEn: ['Said it was too early', 'Called it delicious and very healthy', 'Asked to wait until evening'],
          correctIndex: 1,
          explanationRu: 'Сова ответила, что это звучит очень вкусно и полезно.',
          explanationEn: 'Owl replied that it sounds delicious and very healthy.'
        }
      ]
    };
  }

  return {
    id: `radio-ai-${course.id}-${nowId}`,
    courseId: course.id,
    showNameRu: 'Вечерний подкаст DuoWindo6601Radio',
    showNameEn: 'DuoWindo6601Radio Evening Podcast',
    titleRu: `Тёплый чай перед дорогой (${courseLabel})`,
    titleEn: `Warm Tea Before Departure (${courseLabel})`,
    descRu: `Свежая аудиоистория на языке курса (${courseLabel}): уютный вечер в кафе и проверка времени отправления.`,
    descEn: `Fresh audio story in ${courseLabel}: a cozy evening cafe visit and checking departure time.`,
    hostName: owlSpeaker,
    durationLabel: '1:35',
    levelBadge: levelLabel,
    icon: '📻',
    isAiGenerated: true,
    cues: [
      {
        id: `dyn2-c0-${nowId}`,
        speaker: owlSpeaker,
        avatar: '🦉',
        role: 'host',
        isFamiliarLang: !hostIsTargetLang,
        text: isRuHost
          ? `Привет в новом эфире DuoWindo6601Radio («${courseLabel}»)! Сегодня слушаем уютный вечерний диалог в кафе перед отправлением поезда.`
          : `Welcome to a new DuoWindo6601Radio episode (${courseLabel})! Listen to a cozy cafe chat before the train leaves.`,
        translationRu: `Вечерний выпуск DuoWindo6601Radio («${courseLabel}»).`,
        translationEn: `Evening DuoWindo6601Radio episode (${courseLabel}).`
      },
      {
        id: `dyn2-c1-${nowId}`,
        speaker: guestSpeaker,
        avatar: '☕',
        role: 'character',
        isFamiliarLang: false,
        text: tpl.c3OrderTea,
        translationRu: 'Добро пожаловать в радио-кафе! Вы хотите зелёный чай или горячий шоколад?',
        translationEn: 'Welcome to our radio cafe! Would you like green tea or hot chocolate?'
      },
      {
        id: `dyn2-c2-${nowId}`,
        speaker: owlSpeaker,
        avatar: '🦉',
        role: 'character',
        isFamiliarLang: false,
        text: tpl.c3VeryTasty,
        translationRu: 'Пожалуйста! Приятного прослушивания музыки и тёплого чаепития.',
        translationEn: 'Here you go! Enjoy the music and your warm tea.'
      },
      {
        id: `dyn2-c3-${nowId}`,
        speaker: owlSpeaker,
        avatar: '🦉',
        role: 'host',
        isFamiliarLang: !hostIsTargetLang,
        text: isRuHost
          ? 'А теперь прислушайтесь к последней фразе — сколько минут осталось до отправления?'
          : 'Now listen closely to the closing line — how many minutes remain before departure?',
        translationRu: 'Подсказка перед финальной репликой.',
        translationEn: 'Tip before the closing line.'
      },
      {
        id: `dyn2-c4-${nowId}`,
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
        id: `dyn2-q1-${nowId}`,
        stage: 'mid',
        afterCueIndex: 2,
        replayCueIndex: 1,
        questionRu: 'Какие два напитка предложили в радио-кафе?',
        questionEn: 'Which two drinks were offered at the radio cafe?',
        optionsRu: ['Эспрессо и лимонад', 'Зелёный чай и горячий шоколад', 'Молочный коктейль и вода'],
        optionsEn: ['Espresso and lemonade', 'Green tea and hot chocolate', 'Milkshake and water'],
        correctIndex: 1,
        explanationRu: 'В кафе спросили, хочет ли гость зелёный чай или горячий шоколад.',
        explanationEn: 'The cafe host asked if you would like green tea or hot chocolate.'
      },
      {
        id: `dyn2-q2-${nowId}`,
        stage: 'final',
        afterCueIndex: 4,
        replayCueIndex: 4,
        questionRu: 'Через сколько минут отправляется поезд?',
        questionEn: 'In how many minutes does the train depart?',
        optionsRu: ['Через 5 минут', 'Через 15 минут', 'Через 30 минут'],
        optionsEn: ['In 5 minutes', 'In 15 minutes', 'In 30 minutes'],
        correctIndex: 0,
        explanationRu: 'В финальной реплике сказано, что поезд отправляется через пять минут.',
        explanationEn: 'The closing line stated the train leaves in five minutes.'
      }
    ]
  };
}

export async function generateDuoRadioEpisodeAI(
  course: Course,
  userLanguage: string = 'ru',
  difficultyLevel: 'easy' | 'hard' = 'hard',
  langSection: number = 1,
  customEpisodeText?: string
): Promise<DuoRadioEpisode> {
  const isRu = userLanguage !== 'en';
  const targetLangName = course.name || course.localName || 'English';
  const hostLangName = isRu ? 'Russian' : 'English';
  const levelLabel = difficultyLevel === 'hard' ? 'B2-C1' : `A${Math.min(2, Math.max(1, Math.ceil(langSection / 2)))}`;
  const owlSpeaker = isRu ? 'Сова DuoWindo6601' : 'Owl DuoWindo6601';
  const trimmedCustom = (customEpisodeText || '').trim();

  const customDirective = trimmedCustom
    ? `\nUSER-PROVIDED EPISODE TEXT / TOPIC (IMPORTANT — MUST USE THIS):\n"""\n${trimmedCustom.slice(0, 1200)}\n"""\nIf the user provided sentences or dialogue lines, turn/adapt them into the target-language cues (isFamiliarLang: false) in ${targetLangName} (or keep the exact target lines if already in ${targetLangName}). If the user provided a topic/prompt, write the entire episode about that topic.`
    : '';

  const complexityRule = difficultyLevel === 'hard'
    ? `Make every target-language cue (Cue 1, Cue 2, Cue 4) rich, long, and complex: 3-4 detailed multi-clause sentences with advanced vocabulary, idioms, and natural connectors (do NOT output short 1-line phrases).`
    : `Make every target-language cue clear, natural, and well-structured: 2-3 complete sentences.`;

  const prompt = `Create an engaging listening podcast episode called "DuoWindo6601Radio".
CRITICAL RULE: Do NOT use any third-party trademarked characters.
The ONLY mascot/main character is the Owl "Сова DuoWindo6601" (or "Owl DuoWindo6601"), optionally speaking with neutral everyday roles like "Гость эфира" / "Radio Guest" or "Слушатель" / "Listener".

Target language being learned: ${targetLangName} (course id: ${course.id}).
Listener's native/familiar UI language: ${hostLangName}.
Difficulty: ${difficultyLevel} (${levelLabel}), Section ${langSection} of 8.${customDirective}
${complexityRule}

Requirements:
1. Total 5 cues:
   - Cue 0: Host "${owlSpeaker}" (role: "host", avatar: "🦉", isFamiliarLang: true) introduces the episode in ${hostLangName} (2-3 detailed sentences) and tells the learner what to listen for.
   - Cue 1: "${owlSpeaker}" (role: "character", avatar: "🦉", isFamiliarLang: false) speaks extensively in ${targetLangName}.
   - Cue 2: "${isRu ? 'Гость эфира' : 'Radio Guest'}" (role: "character", avatar: "🎙️", isFamiliarLang: false) replies extensively in ${targetLangName}.
   - Cue 3: Host "${owlSpeaker}" (role: "host", avatar: "🦉", isFamiliarLang: true) gives a detailed 2-sentence listening analysis & grammar tip in ${hostLangName}.
   - Cue 4: "${owlSpeaker}" (role: "character", avatar: "🦉", isFamiliarLang: false) concludes the rich dialogue in ${targetLangName}.
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
    const parsed = (res?.data && typeof res.data === 'object' ? res.data : undefined) || extractJsonObject(rawText);

    if (!parsed || !Array.isArray(parsed.cues) || parsed.cues.length < 3) {
      return buildLocalDynamicRadioEpisode(course, userLanguage, difficultyLevel, langSection, trimmedCustom);
    }

    const validCues = parsed.cues
      .filter((c: any) => c && String(c.text || '').trim().length > 0)
      .map((c: any, idx: number) => ({
        id: `ai-cue-${idx}-${Date.now()}`,
        speaker: String(c.speaker || owlSpeaker),
        avatar: String(c.avatar || (c.role === 'host' ? '🦉' : '🎙️')),
        role: (c.role === 'host' ? 'host' : 'character') as 'host' | 'character',
        isFamiliarLang: Boolean(c.isFamiliarLang),
        text: String(c.text || ''),
        translationRu: String(c.translationRu || c.text || ''),
        translationEn: String(c.translationEn || c.text || '')
      }));

    if (validCues.length < 3) {
      return buildLocalDynamicRadioEpisode(course, userLanguage, difficultyLevel, langSection, trimmedCustom);
    }

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const safeQuestions: DuoRadioQuestion[] =
      rawQuestions.length >= 1
        ? rawQuestions.map((q: any, idx: number) => ({
            id: `ai-q-${idx}-${Date.now()}`,
            stage: q.stage === 'mid' ? 'mid' : 'final',
            afterCueIndex: Math.min(validCues.length - 1, Math.max(0, Number(q.afterCueIndex ?? (idx === 0 ? Math.min(2, validCues.length - 1) : validCues.length - 1)))),
            replayCueIndex: Math.min(validCues.length - 1, Math.max(0, Number(q.replayCueIndex ?? 1))),
            questionRu: String(q.questionRu || 'Что вы услышали в диалоге?'),
            questionEn: String(q.questionEn || 'What did you hear in the dialogue?'),
            optionsRu: Array.isArray(q.optionsRu) && q.optionsRu.length >= 2 ? q.optionsRu.map(String) : ['Вариант 1', 'Вариант 2', 'Вариант 3'],
            optionsEn: Array.isArray(q.optionsEn) && q.optionsEn.length >= 2 ? q.optionsEn.map(String) : ['Option 1', 'Option 2', 'Option 3'],
            correctIndex: Math.min(2, Math.max(0, Number(q.correctIndex ?? 0))),
            explanationRu: String(q.explanationRu || 'Верный ответ прозвучал в диалоге.'),
            explanationEn: String(q.explanationEn || 'The correct answer was mentioned in the dialogue.')
          }))
        : [
            {
              id: `ai-q-fb-${Date.now()}`,
              stage: 'final',
              afterCueIndex: validCues.length - 1,
              replayCueIndex: Math.min(1, validCues.length - 1),
              questionRu: 'О чём был прослушанный диалог?',
              questionEn: 'What was the listening dialogue about?',
              optionsRu: [String(parsed.titleRu || 'Главной теме выпуска'), 'О ремонте дороги', 'О компьютерных играх'],
              optionsEn: [String(parsed.titleEn || 'Main episode topic'), 'Road repairs', 'Computer games'],
              correctIndex: 0,
              explanationRu: 'Вся беседа в выпуске раскрывала главную тему.',
              explanationEn: 'The conversation focused on the main episode topic.'
            }
          ];

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
      cues: validCues,
      questions: safeQuestions
    };
  } catch (err) {
    console.warn('DuoRadio AI generation using guaranteed local episode fallback:', err);
    return buildLocalDynamicRadioEpisode(course, userLanguage, difficultyLevel, langSection, trimmedCustom);
  }
}

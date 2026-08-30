
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exercise, AdventureScenario, RoleplayMessage } from "../types";

export const MODEL_FREE = "gemini-3-flash-preview";
export const MODEL_PRO = "gemini-3-pro-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const USER_PROVIDED_KEY = "AIzaSyCts7NuiqtwiRwtHuIcNEPJN_xs5ApRVFs";
export const getApiKey = () => {
  return process.env.API_KEY || process.env.GEMINI_API_KEY || USER_PROVIDED_KEY;
};

const TOPICS = ['приветствия', 'еда', 'семья', 'путешествия', 'хобби', 'магазины', 'работа', 'погода', 'числа'];

const audioCache = new Map<string, string>();

/**
 * Utility to call Gemini API with exponential backoff retry for 429/503 errors.
 */
async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || 0;
      
      const isRateLimit = 
        errorStatus === 429 || 
        errorStatus === 503 ||
        errorMessage.includes('429') || 
        errorMessage.includes('503') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('Overloaded');
      
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        const delay = (initialDelay * Math.pow(2, attempt)) + jitter;
        console.warn(`Gemini API Issue (${errorStatus || 'Rate Limit'}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  if (data.length % 2 !== 0) {
      const newData = new Uint8Array(data.length + 1);
      newData.set(data);
      data = newData;
  }
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

const playPCM = async (base64Audio: string) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const bytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.error("Error playing PCM audio:", e);
  }
};

const fallbackSpeak = (text: string, lang: string = 'en', slow: boolean = false, provider: 'google' | 'yandex' | 'system' = 'system') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = slow ? 0.6 : 1.0;
    
    const langMap: Record<string, string> = {
      'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES', 'ja': 'ja-JP', 
      'zh': 'zh-CN', 'ko': 'ko-KR', 'it': 'it-IT', 'pt': 'pt-BR', 'ru': 'ru-RU',
      'be': 'ru-RU', 'uk': 'uk-UA', 'et': 'et-EE', 'lv': 'lv-LV', 'lt': 'lt-LT', 'tr': 'tr-TR',
      'ar': 'ar-SA'
    };
    
    // Default lang
    utterance.lang = langMap[lang] || lang;
    
    // Ensure voices are loaded (Chrome sometimes loads asynchronously)
    let voices = window.speechSynthesis.getVoices();
    
    const findVoice = () => {
        let matchingVoice: SpeechSynthesisVoice | undefined;

        if (provider === 'yandex') {
            matchingVoice = voices.find(v => (v.name.toLowerCase().includes("yandex") || v.name.toLowerCase().includes("yuri")) && v.lang.startsWith(utterance.lang.split('-')[0]));
        } else if (provider === 'google') {
            matchingVoice = voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith(utterance.lang.split('-')[0]));
        }

        if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang === utterance.lang);
        }
        if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        }

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            findVoice();
        };
    } else {
        findVoice();
    }
  }
};

export const speakText = async (text: string, lang: string = 'en', slow: boolean = false, voiceName: string = 'Kore', provider: 'gemini' | 'google' | 'yandex' | 'system' = 'gemini') => {
  if (!text) return;

  if (provider === 'google' || provider === 'yandex' || provider === 'system') {
      fallbackSpeak(text, lang, slow, provider);
      return;
  }

  const cacheKey = `${text}_${lang}_${slow}_${voiceName}`;
  if (audioCache.has(cacheKey)) return playPCM(audioCache.get(cacheKey)!);

  try {
    const base64Audio = await callGeminiWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = slow 
        ? `Say VERY slowly, clearly and naturally in ${lang} language: ${text}` 
        : `Say clearly and naturally in ${lang} language: ${text}`;
      
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    }, 2);

    if (base64Audio) {
      audioCache.set(cacheKey, base64Audio);
      return playPCM(base64Audio);
    } else throw new Error("No audio data");
  } catch (error) {
    console.warn("TTS failed, using fallback:", error);
    fallbackSpeak(text, lang, slow, 'system');
  }
};

// --- LOCAL OFFLINE LESSON CACHE SYSTEM ---
const LESSON_CACHE_KEY = 'duowindo_lesson_cache_v2';

export const saveLessonToCache = (subjectId: string, exercise: Exercise) => {
  try {
    if (!exercise || !exercise.originalSentence) return;
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    const cache: Record<string, Exercise[]> = raw ? JSON.parse(raw) : {};
    if (!cache[subjectId]) cache[subjectId] = [];
    
    // Avoid exact duplicate
    const exists = cache[subjectId].some(e => e.originalSentence === exercise.originalSentence && e.type === exercise.type);
    if (!exists) {
      const cleanExercise: Exercise = {
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
        isFallback: false,
        isCached: true
      };
      cache[subjectId].unshift(cleanExercise);
      // Keep up to 30 cached exercises per course
      if (cache[subjectId].length > 30) {
        cache[subjectId] = cache[subjectId].slice(0, 30);
      }
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.warn("Failed to save lesson to cache:", e);
  }
};

export const getCachedExercise = (subjectId: string, type?: Exercise['type']): Exercise | null => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, Exercise[]> = JSON.parse(raw);
    const list = cache[subjectId] || [];
    if (list.length === 0) return null;
    
    const filtered = type ? list.filter(e => e.type === type) : list;
    const pool = filtered.length > 0 ? filtered : list;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { ...item, id: crypto.randomUUID(), isCached: true, isFallback: false };
  } catch (e) {
    console.warn("Failed to read lesson from cache:", e);
    return null;
  }
};

export const getCachedLessonsCount = (subjectId?: string): number => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (!raw) return 0;
    const cache: Record<string, Exercise[]> = JSON.parse(raw);
    if (subjectId) {
      return (cache[subjectId] || []).length;
    }
    return Object.values(cache).reduce((acc, curr) => acc + curr.length, 0);
  } catch {
    return 0;
  }
};

export const clearLessonCache = () => {
  try {
    localStorage.removeItem(LESSON_CACHE_KEY);
  } catch {}
};

export const preseedDefaultLessonCache = () => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (raw && Object.keys(JSON.parse(raw)).length > 3) {
      return; // Already preseeded
    }

    const defaultSeed: Record<string, Exercise[]> = {
      'en': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'The cat sleeps on the sofa', targetTranslation: 'Кошка спит на диване', wordBank: ['Кошка', 'спит', 'на', 'диване', 'собака', 'ест', 'в'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'I drink water every morning', targetTranslation: 'Я пью воду каждое утро', wordBank: ['Я', 'пью', 'воду', 'каждое', 'утро', 'чай', 'он'], isCached: true },
        { id: crypto.randomUUID(), type: 'speech', originalSentence: 'Good morning, how are you today?', targetTranslation: 'Доброе утро, как ваши дела сегодня?', wordBank: ['Доброе', 'утро', 'как', 'дела', 'хорошо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'She reads an interesting book', targetTranslation: 'Она читает интересную книгу', wordBank: ['Она', 'читает', 'интересную', 'книгу', 'он', 'журнал', 'пишет'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'We travel to new cities in summer', targetTranslation: 'Мы путешествуем в новые города летом', wordBank: ['Мы', 'путешествуем', 'в', 'новые', 'города', 'летом', 'зимой', 'они'], isCached: true },
      ],
      'ru': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Привет, как тебя зовут?', targetTranslation: 'Hello, what is your name?', wordBank: ['Hello', 'what', 'is', 'your', 'name', 'how', 'old'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Это мой лучший друг', targetTranslation: 'This is my best friend', wordBank: ['This', 'is', 'my', 'best', 'friend', 'brother', 'good'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'Сегодня прекрасная погода', targetTranslation: 'Today is wonderful weather', wordBank: ['Today', 'is', 'wonderful', 'weather', 'cold', 'rain'], isCached: true }
      ],
      'de': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Guten Tag, wie geht es Ihnen?', targetTranslation: 'Добрый день, как ваши дела?', wordBank: ['Добрый', 'день', 'как', 'ваши', 'дела', 'вечер', 'плохо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Ich lerne gerne Deutsch', targetTranslation: 'Я с удовольствием учу немецкий', wordBank: ['Я', 'с', 'удовольствием', 'учу', 'немецкий', 'он', 'английский'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'Das Haus ist sehr groß und schön', targetTranslation: 'Дом очень большой и красивый', wordBank: ['Дом', 'очень', 'большой', 'и', 'красивый', 'маленький', 'сад'], isCached: true }
      ],
      'fr': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Bonjour, comment allez-vous?', targetTranslation: 'Здравствуйте, как ваши дела?', wordBank: ['Здравствуйте', 'как', 'ваши', 'дела', 'Привет', 'он'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'J\'aime la musique et les voyages', targetTranslation: 'Я люблю музыку и путешествия', wordBank: ['Я', 'люблю', 'музыку', 'и', 'путешествия', 'книги', 'еду'], isCached: true }
      ],
      'es': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Hola, ¿cómo estás hoy?', targetTranslation: 'Привет, как ты сегодня?', wordBank: ['Привет', 'как', 'ты', 'сегодня', 'он', 'хорошо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'El perro corre en el parque', targetTranslation: 'Собака бегает в парке', wordBank: ['Собака', 'бегает', 'в', 'парке', 'кошка', 'спит', 'на'], isCached: true }
      ],
      'zh': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '你好，很高兴认识你', targetTranslation: 'Привет, приятно познакомиться', wordBank: ['Привет', 'приятно', 'познакомиться', 'с', 'тобой', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '我想喝一杯水', targetTranslation: 'Я хочу выпить стакан воды', wordBank: ['Я', 'хочу', 'выпить', 'стакан', 'воды', 'чай', 'он'], isCached: true }
      ],
      'ja': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'こんにちは、元気ですか？', targetTranslation: 'Привет, как дела?', wordBank: ['Привет', 'как', 'дела', 'хорошо', 'спасибо', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '猫は部屋で眠っています', targetTranslation: 'Кошка спит в комнате', wordBank: ['Кошка', 'спит', 'в', 'комнате', 'собака', 'ест', 'на'], isCached: true }
      ],
      'ar': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'مرحبا، كيف حالك؟', targetTranslation: 'Привет, как твои дела?', wordBank: ['Привет', 'как', 'твои', 'дела', 'хорошо', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'هذا بيت جميل وكبير', targetTranslation: 'Это красивый и большой дом', wordBank: ['Это', 'красивый', 'и', 'большой', 'дом', 'сад', 'новый'], isCached: true }
      ],
      'math': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '15 + 27 = ?', targetTranslation: '42', wordBank: ['42', '41', '43', '32'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '8 × 7 = ?', targetTranslation: '56', wordBank: ['56', '54', '64', '48'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '100 - 36 = ?', targetTranslation: '64', wordBank: ['64', '74', '54', '66'], isCached: true }
      ],
      'music': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Какая нота пишется на первой линейке нотного стана?', targetTranslation: 'Ми', wordBank: ['Ми', 'Фа', 'Соль', 'Ре'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Какой знак повышает ноту на полутон?', targetTranslation: 'Диез', wordBank: ['Диез', 'Бемоль', 'Бекар', 'Фермата'], isCached: true }
      ]
    };

    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(defaultSeed));
  } catch (e) {
    console.warn("Could not preseed default lessons:", e);
  }
};

// Automatically seed cache on module load if available in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preseedDefaultLessonCache();
  }, 1000);
}

export const getFallbackExercise = (subjectId: string, type: Exercise['type'], subjectName: string): Exercise => {
    // 1. Try local cache first!
    const cached = getCachedExercise(subjectId, type);
    if (cached) {
      return cached;
    }

    if (subjectId === 'math') {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        const res = op === '+' ? a + b : a - b;
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: `${a} ${op} ${b} = ?`,
            targetTranslation: res.toString(),
            wordBank: [res.toString(), (res + 1).toString(), (res - 1).toString(), (res + 10).toString()].sort(() => Math.random() - 0.5),
            isFallback: true
        };
    }
    if (subjectId === 'music') {
        const notes = [
            { note: "До (C)", question: "Какая нота идет первой в гамме До-мажор?", answer: "До" },
            { note: "Ре (D)", question: "Какая нота находится между До и Ми?", answer: "Ре" },
            { note: "Ми (E)", question: "На какой линейке нотного стана пишется нота Ми первой октавы?", answer: "Первой" },
            { note: "Скрипичный ключ", question: "Какой ключ называют ключом Соль?", answer: "Скрипичный" },
            { note: "Форте", question: "Как в музыке обозначается громкое исполнение?", answer: "Форте" },
            { note: "Пиано", question: "Как в музыке обозначается тихое исполнение?", answer: "Пиано" },
        ];
        const item = notes[Math.floor(Math.random() * notes.length)];
        const distractors = ["Фа", "Соль", "Ля", "Си", "Басовый", "Анданте", "Престо"].filter(d => d !== item.answer).slice(0, 3);
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: item.question,
            targetTranslation: item.answer,
            wordBank: [item.answer, ...distractors].sort(() => Math.random() - 0.5),
            isFallback: true
        };
    }
    if (subjectId.startsWith('rf-')) {
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: `Это регион РФ: ${subjectName}?`,
            targetTranslation: "Да", wordBank: ["Да", "Нет", "Возможно", "Не знаю"], isFallback: true
        };
    }
    const vocab: Record<string, [string, string][]> = {
        'en': [['Hello, friend', 'Привет, друг'], ['The cat is sleeping', 'Кошка спит'], ['I like reading books', 'Я люблю читать книги'], ['Fresh water is good', 'Свежая вода хорошая'], ['We go to the park', 'Мы идем в парк'], ['Thank you very much', 'Большое спасибо']],
        'ru': [['Hello', 'Привет'], ['Friend', 'Друг'], ['Good', 'Хорошо'], ['Yes', 'Да'], ['No', 'Нет']],
        'zh': [['你好', 'Привет'], ['猫', 'Кошка'], ['狗', 'Собака'], ['水', 'Вода'], ['家', 'Дом'], ['人', 'Человек'], ['谢谢', 'Спасибо'], ['中国', 'Китай']],
        'ja': [['こんにちは', 'Привет'], ['猫', 'Кошка'], ['犬', 'Собака'], ['水', 'Вода'], ['家', 'Дом'], ['ありがとう', 'Спасибо']],
        'ko': [['안녕하세요', 'Привет'], ['고양이', 'Кошка'], ['강ажи', 'Собака'], ['물', 'Вода'], ['집', 'Дом'], ['감사합니다', 'Спасибо']],
        'de': [['Guten Tag', 'Добрый день'], ['Die Katze schläft', 'Кошка спит'], ['Das Haus ist groß', 'Дом большой'], ['Danke schön', 'Большое спасибо']],
        'fr': [['Bonjour mon ami', 'Привет мой друг'], ['Le chat dort', 'Кот спит'], ['La maison est belle', 'Дом красивый'], ['Merci beaucoup', 'Большое спасибо']],
        'es': [['Hola amigo', 'Привет друг'], ['El gato duerme', 'Кот спит'], ['La casa es grande', 'Дом большой'], ['Muchas gracias', 'Большое спасибо']],
        'ar': [['مرحبا يا صديقي', 'Привет мой друг'], ['البيت كبير', 'Дом большой'], ['ماء بارد', 'Холодная вода'], ['شكرا جزيلا', 'Большое спасибо']],
        'he': [['שלום חבר', 'Привет друг'], ['הבית יפה', 'Дом красивый'], ['מים קרים', 'Холодная вода'], ['תודה רבה', 'Большое спасибо']],
    };
    
    const currentVocab = vocab[subjectId] || vocab['en'];
    const [word, trans] = currentVocab[Math.floor(Math.random() * currentVocab.length)];
    const distractors = ["Нет", "Дом", "Вода", "Хлеб", "Мир", "Друг", "Книга"].filter(d => d !== trans).sort(() => Math.random() - 0.5).slice(0, 3);
    
    return {
        id: crypto.randomUUID(), type: type || 'translation', originalSentence: word, targetTranslation: trans,
        wordBank: [trans, ...distractors].sort(() => Math.random() - 0.5), isFallback: true
    };
};

export const generateExercise = async (
    targetSubject: string, subjectId: string, isLanguage: boolean = true,
    type: Exercise['type'] = 'translation', isPro: boolean = false, customTopic?: string
): Promise<Exercise> => {
  const model = isPro ? MODEL_PRO : MODEL_FREE;
  const topic = (customTopic && customTopic.trim()) ? customTopic : TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const prompt = isLanguage 
    ? `Сгенерируй упражнение типа "${type}" для изучения ${targetSubject}. Тема: ${topic}.`
    : `Сгенерируй задачу для предмета "${targetSubject}".`;

  try {
    const data = await callGeminiWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalSentence: { type: Type.STRING },
              targetTranslation: { type: Type.STRING },
              wordBank: { type: Type.ARRAY, items: { type: Type.STRING } },
              hints: { type: Type.OBJECT }
            },
            required: ["originalSentence", "targetTranslation", "wordBank"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
    const exercise: Exercise = { id: crypto.randomUUID(), ...data, type: type };
    // Automatically save to local offline cache!
    saveLessonToCache(subjectId, exercise);
    return exercise;
  } catch (error) {
    return getFallbackExercise(subjectId, type, targetSubject);
  }
};

export const checkAnswerWithAI = async (
  subject: string,
  userAnswer: string,
  correctAnswer: string,
  isMax: boolean = false
): Promise<{ isCorrect: boolean; feedback: string; isFallback?: boolean }> => {
  // Simple check first
  if (!userAnswer) return { isCorrect: false, feedback: "No answer provided" };
  const normUser = userAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '');
  const normCorrect = correctAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '');
  
  if (normUser === normCorrect) {
      return { isCorrect: true, feedback: "Верно!" };
  }

  try {
    const result = await callGeminiWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: isMax ? MODEL_PRO : MODEL_FREE,
        contents: `I am learning ${subject}. 
        The correct answer is: "${correctAnswer}".
        My answer was: "${userAnswer}".
        Is my answer correct? (Allow small typos).
        Return JSON: { "isCorrect": boolean, "feedback": string (in Russian or English) }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING }
            },
            required: ["isCorrect", "feedback"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
    return result;
  } catch (e) {
    const isCorrect = normUser === normCorrect;
    return { 
        isCorrect, 
        feedback: isCorrect ? "Правильно" : `Офлайн режим: Правильный ответ - ${correctAnswer}`, 
        isFallback: true 
    };
  }
};

export const getMistakeExplanation = async (
    original: string, 
    userAnswer: string, 
    correctAnswer: string, 
    userLanguage: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_PRO,
                contents: `You are a friendly language tutor similar to Duolingo.
                The student made a mistake.
                Original phrase: "${original}"
                Student's answer: "${userAnswer}"
                Correct answer: "${correctAnswer}"
                
                Explain briefly and clearly (max 50 words) why the student's answer is wrong or how the grammar works.
                Respond in this language: ${userLanguage}.
                Do not be technical, be encouraging.`
            });
        });
        return response.text?.trim() || "Explanation not available offline.";
    } catch (e) {
        return "Не удалось загрузить объяснение (ошибка сети).";
    }
}

const CIS_OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  'привет': {
    'be': 'Прывітанне', 'uk': 'Привіт', 'mo': 'Salut', 'lt': 'Labas', 'lv': 'Sveiki',
    'et': 'Tere', 'ka': 'გამარჯობა (Gamarjoba)', 'hy': 'Բարև (Barev)', 'az': 'Salam',
    'kk': 'Сәлем', 'uz': 'Salom', 'tk': 'Salam', 'ky': 'Салам', 'tg': 'Салом',
    'en': 'Hello', 'de': 'Hallo', 'fr': 'Bonjour', 'es': 'Hola', 'zh': '你好', 'ja': 'こんにちは', 'ar': 'مرحبا'
  },
  'спасибо': {
    'be': 'Дзякуй', 'uk': 'Дякую', 'mo': 'Mulțumesc', 'lt': 'Ačiū', 'lv': 'Paldies',
    'et': 'Aitäh', 'ka': 'მადლობა (Madloba)', 'hy': 'Շնորհակալություն (Shnorhakalutyun)', 'az': 'Təşəkkür edirəm',
    'kk': 'Рахмет', 'uz': 'Rahmat', 'tk': 'Sag boluň', 'ky': 'Рахмат', 'tg': 'Раҳмат',
    'en': 'Thank you', 'de': 'Danke', 'fr': 'Merci', 'es': 'Gracias', 'zh': '谢谢', 'ja': 'ありがとう', 'ar': 'شكرا'
  },
  'как дела': {
    'be': 'Як справы?', 'uk': 'Як справи?', 'mo': 'Ce mai faci?', 'lt': 'Kaip sekasi?', 'lv': 'Kā iet?',
    'et': 'Kuidas läheb?', 'ka': 'როგორ ხარ? (Rogor khar?)', 'hy': 'Ինչպե՞ս ես (Inchpes es?)', 'az': 'Necəsən?',
    'kk': 'Қалың қалай?', 'uz': 'Ishlar qalay?', 'tk': 'Ýagdaýlar nähili?', 'ky': 'Кандайсың?', 'tg': 'Аҳвол чӣ хел?',
    'en': 'How are you?', 'de': 'Wie geht es dir?', 'fr': 'Comment vas-tu?', 'es': '¿Cómo estás?', 'zh': '你好吗？', 'ja': 'お元気ですか？', 'ar': 'كيف حالك؟'
  },
  'до свидания': {
    'be': 'Да пабачэння', 'uk': 'До побачення', 'mo': 'La revedere', 'lt': 'Viso gero', 'lv': 'Uz redzēšanos',
    'et': 'Head aega', 'ka': 'ნახვამდის (Nakhvamdis)', 'hy': 'Ցտեսություն (Tstesutyun)', 'az': 'Sağ olun',
    'kk': 'Сау болыңыз', 'uz': 'Xayr', 'tk': 'Hoş gal', 'ky': 'Кош болуңуз', 'tg': 'Хайр',
    'en': 'Goodbye', 'de': 'Auf Wiedersehen', 'fr': 'Au revoir', 'es': 'Adiós', 'zh': '再见', 'ja': 'さようなら', 'ar': 'مع السلامة'
  }
};

export const translateText = async (text: string, targetLang: string, sourceLang?: string): Promise<string> => {
  if (!text || !text.trim()) return "";
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await callGeminiWithRetry(async () => {
        const fromClause = sourceLang && sourceLang !== 'auto' ? `from ${sourceLang} ` : '';
        return ai.models.generateContent({
            model: MODEL_FREE,
            contents: `Translate the following text ${fromClause}into ${targetLang}. Preserve tone and natural grammar. Return ONLY the translation, with no explanation or conversational preamble.\n\nText:\n${text}`
        });
    });
    return response.text?.trim() || "Error translating.";
  } catch (e) {
    const cleaned = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    if (CIS_OFFLINE_DICTIONARY[cleaned] && CIS_OFFLINE_DICTIONARY[cleaned][targetLang]) {
      return CIS_OFFLINE_DICTIONARY[cleaned][targetLang];
    }
    return `[Офлайн] ${text}`;
  }
}

export const startRoleplay = async (subject: string, subjectId: string): Promise<Exercise> => {
    const isArabic = subjectId === 'ar' || subject.toLowerCase().includes('араб') || subject.toLowerCase().includes('arabic');
    
    const arabicScenarios = [
        "في المقهى (Заказ в арабском кафе)",
        "التعارف والتحية (Знакомство и приветствие)",
        "في السوق والتبضع (В магазине и на рынке)",
        "السفر في المطار (Путешествие и аэропорт)"
    ];
    
    const scenario = isArabic 
        ? arabicScenarios[Math.floor(Math.random() * arabicScenarios.length)]
        : "Ordering coffee";

    try {
        const firstMessage = await callGeminiWithRetry(async () => {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const prompt = isArabic 
                ? `You are an AI Arabic conversation partner in a roleplay. Scenario: "${scenario}". Greet the student in warm natural Arabic (with Russian/English translation in parentheses if helpful). Keep it 1-2 short sentences.`
                : `Act as a friendly local who speaks ${subject}. Scenario: ${scenario}. Start the conversation.`;
            
            const response = await ai.models.generateContent({ model: MODEL_FREE, contents: prompt });
            return response.text?.trim() || (isArabic ? "مرحباً بك! أهلاً وسهلاً. كيف يمكنني مساعدتك اليوم؟" : "Hello!");
        });
        return {
            id: crypto.randomUUID(), type: 'roleplay', originalSentence: scenario, targetTranslation: "", wordBank: [],
            roleplayData: { topic: scenario, messages: [{ role: 'model', text: firstMessage }], userTurn: true }
        };
    } catch (e) {
        return {
            id: 'fallback-rp', type: 'roleplay', originalSentence: isArabic ? "ممارسة اللغة العربية" : "Offline Practice", targetTranslation: "", wordBank: [], isFallback: true,
            roleplayData: { 
                topic: scenario, 
                messages: [{ role: 'model', text: isArabic ? "مرحباً بك! أهلاً وسهلاً في درس المحادثة العربية." : "Hello! Welcome to conversation practice." }], 
                userTurn: true 
            }
        };
    }
};

export const replyToRoleplay = async (history: RoleplayMessage[], userMessageText: string, subject: string, isMax: boolean): Promise<RoleplayMessage> => {
    const isArabic = subject.toLowerCase().includes('араб') || subject.toLowerCase().includes('arabic');
    try {
         const data = await callGeminiWithRetry(async () => {
             const ai = new GoogleGenAI({ apiKey: getApiKey() });
             const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
             const prompt = `${context}\nUser: ${userMessageText}
             ${isArabic ? 'You are a friendly Arabic language tutor. Reply in clear natural Arabic with RTL formatting. If user made a mistake in Arabic, provide a brief correction.' : 'Reply naturally in ' + subject + '.'}`;

             const response = await ai.models.generateContent({
                 model: isMax ? MODEL_PRO : MODEL_FREE,
                 contents: prompt,
                 config: {
                     responseMimeType: "application/json",
                     responseSchema: {
                         type: Type.OBJECT,
                         properties: { text: { type: Type.STRING }, correction: { type: Type.STRING } },
                         required: ["text"]
                     }
                 }
             });
             return JSON.parse(response.text || '{}');
         });
         return { role: 'model', text: data.text || (isArabic ? "أهلاً بك! هذا رائع." : "I see."), correction: data.correction };
    } catch (e) {
        return { role: 'model', text: isArabic ? "مرحباً بك! شكراً لك." : "Offline reply.", isFallback: true };
    }
};

export const generateIllusion = async (subject: string, subjectId: string): Promise<Exercise> => {
    try {
        const data = await callGeminiWithRetry(async () => {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Generate a 'Minimal Pair' auditory exercise for learning ${subject}. Return JSON.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { soundText: { type: Type.STRING }, optionA: { type: Type.STRING }, optionB: { type: Type.STRING }, correctOption: { type: Type.STRING }, explanation: { type: Type.STRING } },
                        required: ["soundText", "optionA", "optionB", "correctOption", "explanation"]
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        });
        return { id: crypto.randomUUID(), type: 'illusion', originalSentence: "Sound Illusion", targetTranslation: "", wordBank: [], illusionData: data };
    } catch (e) {
        return { id: 'fb-ill', type: 'illusion', originalSentence: "Offline", targetTranslation: "", wordBank: [], isFallback: true, illusionData: { soundText: "Test", optionA: "Test", optionB: "Toast", correctOption: "A", explanation: "Offline." } };
    }
};

export const generateDrawing = async (subject: string, subjectId: string, specificChar?: string): Promise<Exercise> => {
    try {
        const prompt = specificChar 
            ? `Generate a writing challenge for the character "${specificChar}" in ${subject}. Return JSON.`
            : `Generate a writing challenge for a random letter in ${subject}. Return JSON.`;

        const data = await callGeminiWithRetry(async () => {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { character: { type: Type.STRING }, instruction: { type: Type.STRING } },
                        required: ["character", "instruction"]
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        });
        
        // Force the character if specificChar was requested (in case AI hallucinates)
        if (specificChar) data.character = specificChar;

        return { id: crypto.randomUUID(), type: 'drawing', originalSentence: "Draw", targetTranslation: "", wordBank: [], drawingData: data };
    } catch (e) {
        let fallbackChar = specificChar || "A";
        if (!specificChar) {
            if (subjectId === 'zh') fallbackChar = "人";
            else if (subjectId === 'ja') fallbackChar = "あ";
            else if (subjectId === 'ko') fallbackChar = "ㄱ";
            else if (subjectId === 'ru') fallbackChar = "А";
            else if (subjectId === 'ar') fallbackChar = "ا";
            else if (subjectId === 'he') fallbackChar = "א";
        }
        return { 
            id: 'fb-dr', 
            type: 'drawing', 
            originalSentence: "Draw", 
            targetTranslation: "", 
            wordBank: [], 
            isFallback: true, 
            drawingData: { 
                character: fallbackChar, 
                instruction: `Нарисуйте символ: ${fallbackChar}` 
            } 
        };
    }
};

export const checkDrawing = async (base64Image: string, targetCharacter: string): Promise<{ isCorrect: boolean; feedback: string; isFallback?: boolean }> => {
    try {
        const result = await callGeminiWithRetry(async () => {
            const ai = new GoogleGenAI({ apiKey: getApiKey() });
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: {
                    parts: [
                        { inlineData: { mimeType: "image/png", data: base64Image } },
                        { text: `Is this drawing legible as "${targetCharacter}"? Return JSON {isCorrect: boolean, feedback: string}. Give feedback in Russian.` }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { isCorrect: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } },
                        required: ["isCorrect", "feedback"]
                    }
                }
            });
            return JSON.parse(response.text || '{"isCorrect":false}');
        });
        return result;
    } catch (e) {
        return { isCorrect: true, feedback: `Отличная работа! Символ "${targetCharacter}" нарисован.`, isFallback: true };
    }
};

// --- ISHIHARA SERVICE ---
export const generateIshihara = async (subjectId: string): Promise<Exercise> => {
    const number = Math.floor(Math.random() * 90) + 10; // 10-99
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: MODEL_FREE,
            contents: { parts: [{ text: `Generate an Ishihara color blindness test plate showing the number ${number}. High contrast, clear dots. Return only the image.` }] }
        });
        // Extract image
        let imageBase64 = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageBase64 = part.inlineData.data;
                break;
            }
        }
        if (imageBase64) {
            return {
                id: crypto.randomUUID(),
                type: 'ishihara',
                originalSentence: "Ishihara Test",
                targetTranslation: number.toString(),
                wordBank: [],
                ishiharaData: { image: imageBase64, number: number.toString() }
            };
        }
    } catch (e) {
        console.log("Using procedural Ishihara plate generator for test");
    }

    return {
        id: crypto.randomUUID(),
        type: 'ishihara',
        originalSentence: "Ishihara Color Blindness Test",
        targetTranslation: number.toString(),
        wordBank: [],
        isFallback: false,
        ishiharaData: { image: "", number: number.toString() } 
    };
};

// --- CHESS SERVICES ---

export const generateReading = async (subject: string, subjectId: string): Promise<Exercise> => {
    const mode = Math.random() > 0.5 ? 'fill-blanks' : 'write';
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        let prompt = "";
        let schema: any = {};

        if (mode === 'fill-blanks') {
            prompt = `Generate a short reading exercise in ${subject} about ${topic}.
            Create a short text (3-5 sentences).
            Identify 3-5 key words to be "blanks".
            Return JSON with:
            - title: A short title.
            - text: The text with blanks replaced by "___".
            - blanks: An array of objects { id: "b1", word: "correctWord" }.
            - wordBank: An array of strings including the correct words and 3-4 distractors.
            `;
            schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    blanks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, word: { type: Type.STRING } } } },
                    wordBank: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "text", "blanks", "wordBank"]
            };
        } else {
            prompt = `Generate a creative writing prompt in ${subject} about ${topic}.
            Return JSON with:
            - title: A short title.
            - text: A story starter or context (1-2 sentences).
            - prompt: A specific instruction for what the user should write (e.g., "Finish the story", "Describe the character").
            `;
            schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    prompt: { type: Type.STRING }
                },
                required: ["title", "text", "prompt"]
            };
        }

        const response = await callGeminiWithRetry(async () => {
             return ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
        });
        const data = JSON.parse(response.text || '{}');

        let fullText = data.text;
        if (mode === 'fill-blanks' && data.blanks) {
            // Replace ___ with correct words sequentially
            // We assume the number of ___ matches blanks length
            data.blanks.forEach((b: any) => {
                fullText = fullText.replace("___", b.word);
            });
        }

        return {
            id: crypto.randomUUID(),
            type: 'reading',
            originalSentence: data.title,
            targetTranslation: fullText, // Full text for checking
            wordBank: data.wordBank || [],
            readingData: {
                title: data.title,
                text: data.text,
                mode: mode,
                blanks: data.blanks,
                prompt: data.prompt
            }
        };

    } catch (e) {
        // Fallback
        return {
            id: 'fallback-reading',
            type: 'reading',
            originalSentence: "Reading Practice",
            targetTranslation: "",
            wordBank: ["apple", "banana", "orange"],
            isFallback: true,
            readingData: {
                title: "My Fruit",
                text: "I like to eat ___ and ___.",
                mode: 'fill-blanks',
                blanks: [{ id: 'b1', word: 'apple' }, { id: 'b2', word: 'banana' }]
            }
        };
    }
}

export const getChessMove = async (fen: string, history: string[]): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Current FEN: ${fen}. History: ${history.join(' ')}.
        Play the best move for ${fen.includes(' w ') ? 'White' : 'Black'}.
        Reply with the move in UCI format (e.g. e2e4, e7e5, e1g1).
        NO explanations. ONLY the move string.`;
        
        const response = await callGeminiWithRetry(async () => {
             return ai.models.generateContent({
                 model: MODEL_FREE,
                 contents: prompt,
             });
        });
        
        const text = response.text || "";
        // Match e2e4 or e2-e4
        const match = text.match(/([a-h][1-8])[-]?([a-h][1-8])([qrbn])?/i);
        if (match) {
            // Normalize to source-target (e.g. e2-e4) for internal logic
            return `${match[1]}-${match[2]}`;
        }
        return "";
    } catch (e) {
        console.error("Chess AI Error", e);
        return "";
    }
}

export const getChessChatReply = async (fen: string, history: string[], chatHistory: RoleplayMessage[], userMessage?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prevChat = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Duo'}: ${m.text}`).join('\n');
    
    let prompt = `You are DuoWindo6601, a competitive but encouraging chess bot mascot (Owl). 
    IMPORTANT: You must adopt the persona of Oscar from Duolingo — dramatic, slightly condescending, obsessed with perfection, yet strangely encouraging in a backhanded way. Use his typical phrases and dramatic flair.
    
    Current Board FEN: ${fen}
    Last Moves: ${history.slice(-3).join(', ')}
    
    Chat History:
    ${prevChat}
    `;

    if (userMessage) {
        prompt += `\nUser said: "${userMessage}"\nReply to the user. Be witty, short (max 15 words).`;
    } else {
        prompt += `\nYou just made a move. Give a short, cheeky comment about the board state (max 10 words). E.g., "Take that!", "Watch your queen!", "Nice try."`;
    }

    const response = await callGeminiWithRetry(async () => {
       return ai.models.generateContent({
           model: MODEL_FREE,
           contents: prompt
       });
    });
    return response.text?.trim() || "Your turn!";
  } catch (e) {
    return "Thinking...";
  }
};

// --- INTERVIEW SERVICES ---

export const generateInterviewQuestion = async (topic: string = "general programming"): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Generate a challenging technical interview question about ${topic}. Return ONLY the question text. Be professional but concise.`
            });
        });
        return response.text?.trim() || "Tell me about your experience.";
    } catch (e) {
        return "Describe IDEMPOTENCY in HTTP methods.";
    }
};

export const getInterviewHint = async (question: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_PRO,
                contents: `Provide a structured "cheat sheet" answer for this interview question: "${question}".
                Format it with bullet points. Keep it concise, ready to read during a call.
                Explain key concepts clearly.
                Return text suitable for display.`
            });
        });
        return response.text?.trim() || "Hint unavailable.";
    } catch (e) {
        return "Network error. No hint.";
    }
};

export const generateVideoCallRoleplayResponse = async (
    topic: string,
    history: RoleplayMessage[],
    userText: string,
    language: string
): Promise<{ text: string; correction?: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const context = history.map(m => `${m.role === 'user' ? 'User' : 'DuoWindo6601'}: ${m.text}`).join('\n');
        const prompt = `You are DuoWindo6601, an AI language tutor in a LIVE interactive Video Call with a student learning ${language}. 
Current topic/scenario: "${topic}".
Recent conversation:
${context}
User said during video call: "${userText}"

Reply naturally, warmly, and concisely as DuoWindo6601 (1-2 sentences max for spoken video call).
If user made a language/grammar mistake, provide a very brief friendly correction.
Return JSON with { "text": "...", "correction": "..." }`;

        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            correction: { type: Type.STRING }
                        },
                        required: ["text"]
                    }
                }
            });
        });
        const data = JSON.parse(response.text || '{}');
        return { text: data.text || "That sounds great! Tell me more.", correction: data.correction };
    } catch (e) {
        return { text: "That sounds interesting! What else would you like to discuss?" };
    }
};
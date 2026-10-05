import React, { useState } from 'react';
import { Course, PlacementQuestion, PlacementResult, UserProgress } from '../types';

interface PlacementTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onApplyModule: (suggestedModule: number, bonusXp: number) => void;
  language: string;
  playSound: (name: string) => void;
  setToast: (msg: string | null) => void;
}

// Question database for supported languages
const PLACEMENT_QUESTIONS: Record<string, PlacementQuestion[]> = {
  en: [
    {
      id: 'en_1',
      level: 'A1',
      question: 'Choose the correct greeting: "______ are you today?"',
      questionRu: 'Выберите правильное приветствие: "______ are you today?"',
      options: ['How', 'What', 'Who', 'Where'],
      correctIndex: 0,
      explanation: '"How are you?" is the standard greeting to ask how someone is doing.',
    },
    {
      id: 'en_2',
      level: 'A2',
      question: 'Select the correct verb form: "She ______ to school every day."',
      questionRu: 'Выберите правильную форму глагола: "She ______ to school every day."',
      options: ['go', 'goes', 'going', 'is go'],
      correctIndex: 1,
      explanation: 'In the present simple with third person singular (she), we add -es: "goes".',
    },
    {
      id: 'en_3',
      level: 'B1',
      question: 'Choose the correct preposition: "I am interested ______ learning new languages."',
      questionRu: 'Выберите верный предлог: "I am interested ______ learning new languages."',
      options: ['at', 'on', 'in', 'about'],
      correctIndex: 2,
      explanation: 'The adjective "interested" takes the preposition "in".',
    },
    {
      id: 'en_4',
      level: 'B1',
      question: 'Fill in the blank: "If it rains tomorrow, we ______ the picnic."',
      questionRu: 'Заполните пропуск: "If it rains tomorrow, we ______ the picnic."',
      options: ['will cancel', 'would cancel', 'cancelled', 'cancels'],
      correctIndex: 0,
      explanation: 'First conditional (real possibility in future): If + Present Simple, will + base verb.',
    },
    {
      id: 'en_5',
      level: 'B2',
      question: 'Which word best means "to make something more bearable or milder"?',
      questionRu: 'Какое слово лучше всего означает "смягчать, облегчать"?',
      options: ['Exacerbate', 'Alleviate', 'Deteriorate', 'Prolong'],
      correctIndex: 1,
      explanation: '"Alleviate" means to relieve, lessen, or ease suffering.',
    },
  ],
  es: [
    {
      id: 'es_1',
      level: 'A1',
      question: '¿Cómo se dice "Hello, good morning" en español?',
      questionRu: 'Как переводится "Привет, доброе утро" на испанский?',
      options: ['Hola, buenos días', 'Adiós, buenas noches', 'Por favor, gracias', 'Hasta luego'],
      correctIndex: 0,
      explanation: '"Hola, buenos días" означает "Привет, доброе утро".',
    },
    {
      id: 'es_2',
      level: 'A2',
      question: 'Completa la frase: "Nosotros ______ en Madrid."',
      questionRu: 'Заполните пропуск: "Nosotros ______ en Madrid."',
      options: ['vivo', 'vive', 'vivimos', 'viven'],
      correctIndex: 2,
      explanation: 'Форма первого лица множественного числа (nosotros) для глагола vivir — "vivimos".',
    },
    {
      id: 'es_3',
      level: 'B1',
      question: 'Elige la forma correcta en pretérito: "Ayer yo ______ una carta."',
      questionRu: 'Выберите прошедшее время: "Ayer yo ______ una carta."',
      options: ['escribo', 'escribí', 'escribía', 'he escribir'],
      correctIndex: 1,
      explanation: 'Pretérito indefinido для "yo" — "escribí".',
    },
    {
      id: 'es_4',
      level: 'B1',
      question: 'Elige la opción con subjuntivo: "Espero que tú ______ bien."',
      questionRu: 'Выберите правильное сослагательное наклонение: "Espero que tú ______ bien."',
      options: ['estás', 'estés', 'estar', 'estuviste'],
      correctIndex: 1,
      explanation: 'После выражений надежды (Espero que...) используется Presente de Subjuntivo: "estés".',
    },
    {
      id: 'es_5',
      level: 'B2',
      question: '¿Qué significa el modismo "tomar el pelo"?',
      questionRu: 'Что означает испанская идиома "tomar el pelo"?',
      options: ['Burlarse o bromear con alguien', 'Cortar el cabello', 'Tener prisa', 'Estar enfadado'],
      correctIndex: 0,
      explanation: '"Tomar el pelo" означает подшучивать или разыгрывать кого-то.',
    },
  ],
  de: [
    {
      id: 'de_1',
      level: 'A1',
      question: 'Wie sagt man "Danke schön"?',
      questionRu: 'Что означает "Danke schön"?',
      options: ['Большое спасибо', 'Пожалуйста', 'До свидания', 'Доброе утро'],
      correctIndex: 0,
      explanation: '"Danke schön" переводится как "Большое спасибо".',
    },
    {
      id: 'de_2',
      level: 'A2',
      question: 'Ergänzen Sie: "Ich ______ Deutsch lernen."',
      questionRu: 'Вставьте модальный глагол: "Ich ______ Deutsch lernen."',
      options: ['möchte', 'möchtet', 'möchten', 'möchtest'],
      correctIndex: 0,
      explanation: 'Форма для "ich" от möchten — "möchte".',
    },
    {
      id: 'de_3',
      level: 'B1',
      question: 'Welcher Artikel gehört zu "Hund" im Akkusativ: "Ich sehe ______ Hund."',
      questionRu: 'Какой артикль в Akkusativ (мужской род): "Ich sehe ______ Hund."',
      options: ['der', 'den', 'dem', 'das'],
      correctIndex: 1,
      explanation: 'В винительном падеже (Akkusativ) мужской род "der" меняется на "den".',
    },
    {
      id: 'de_4',
      level: 'B1',
      question: 'Wählen Sie die richtige Konjunktion: "Er lernt fleißig, ______ er die Prüfung besteht."',
      questionRu: 'Выберите союз цели: "Er lernt fleißig, ______ er die Prüfung besteht."',
      options: ['damit', 'weil', 'obwohl', 'denn'],
      correctIndex: 0,
      explanation: '"damit" означает "чтобы, с целью того, чтобы".',
    },
    {
      id: 'de_5',
      level: 'B2',
      question: 'Was bedeutet das Wort "Nachhaltigkeit"?',
      questionRu: 'Что означает немецкое слово "Nachhaltigkeit"?',
      options: ['Устойчивое развитие / Экологичность', 'Поспешность', 'Пунктуальность', 'Любопытство'],
      correctIndex: 0,
      explanation: '"Nachhaltigkeit" означает устойчивое экологическое развитие.',
    },
  ],
  fr: [
    {
      id: 'fr_1',
      level: 'A1',
      question: 'Comment dit-on "Good evening" en français ?',
      questionRu: 'Как сказать "Добрый вечер" по-французски?',
      options: ['Bonsoir', 'Bonjour', 'Bonne nuit', 'Au revoir'],
      correctIndex: 0,
      explanation: '"Bonsoir" используется для приветствия вечером.',
    },
    {
      id: 'fr_2',
      level: 'A2',
      question: 'Complétez : "Nous ______ français."',
      questionRu: 'Вставьте глагол parler для "nous":',
      options: ['parle', 'parlons', 'parlez', 'parlent'],
      correctIndex: 1,
      explanation: 'Окончание формы nous в настоящем времени — -ons: "parlons".',
    },
    {
      id: 'fr_3',
      level: 'B1',
      question: 'Passé composé : "Hier, elle ______ au cinéma."',
      questionRu: 'Выберите правильную форму passé composé с être:',
      options: ['est allée', 'a allé', 'est allé', 'va'],
      correctIndex: 0,
      explanation: 'Глагол aller спрягается с être, женский род требует согласования: "est allée".',
    },
    {
      id: 'fr_4',
      level: 'B1',
      question: 'Subjonctif : "Il faut que tu ______ tes devoirs."',
      questionRu: 'Какая форма subjonctif верна: "Il faut que tu ______ tes devoirs."',
      options: ['fais', 'fasses', 'feras', 'fait'],
      correctIndex: 1,
      explanation: 'После "il faut que" используется subjonctif: "fasses".',
    },
    {
      id: 'fr_5',
      level: 'B2',
      question: 'Que signifie l\'expression "avoir le coup de foudre" ?',
      questionRu: 'Что означает выражение "avoir le coup de foudre"?',
      options: ['Влюбиться с первого взгляда', 'Испугаться грома', 'Попасть под дождь', 'Рассердиться'],
      correctIndex: 0,
      explanation: '"Coup de foudre" означает внезапную любовь с первого взгляда.',
    },
  ],
};

// Fallback questions for any other courses (Japanese, Chinese, Arabic, Russian etc.)
const GENERAL_FALLBACK_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'gen_1',
    level: 'A1',
    question: 'How familiar are you with basic letters, alphabet, and sounds of this language?',
    questionRu: 'Насколько вы знакомы с алфавитом и базовыми звуками этого языка?',
    options: ['Только начинаю учить с нуля', 'Знаю несколько базовых звуков', 'Уверенно читаю простые слова', 'Свободно читаю и перевожу'],
    correctIndex: 2,
    explanation: 'Проверка уверенности в чтении простых конструкций.',
  },
  {
    id: 'gen_2',
    level: 'A2',
    question: 'Can you introduce yourself and state where you are from?',
    questionRu: 'Можете ли вы представиться и сказать, откуда вы родом?',
    options: ['Нет, пока не знаю', 'С трудом и по шпаргалке', 'Да, могу назвать имя и страну', 'Свободно расскажу о себе и профессии'],
    correctIndex: 2,
    explanation: 'Базовый уровень А2: самопрезентация.',
  },
  {
    id: 'gen_3',
    level: 'B1',
    question: 'Can you ask for directions in a foreign city or order food in a restaurant?',
    questionRu: 'Можете ли вы спросить дорогу или заказать еду в ресторане?',
    options: ['Только жестами', 'С помощью переводчика', 'Да, простыми фразами', 'Да, свободно общаюсь с официантом'],
    correctIndex: 2,
    explanation: 'Средний уровень B1: решение повседневных бытовых задач.',
  },
  {
    id: 'gen_4',
    level: 'B1',
    question: 'How comfortable are you with past and future tenses in this language?',
    questionRu: 'Насколько вы ориентируетесь в прошедшем и будущем временах?',
    options: ['Знаю только настоящее', 'Иногда путаю окончания', 'Уверенно использую основные времена', 'Понимаю сложные временные нюансы'],
    correctIndex: 2,
    explanation: 'Грамматический уровень B1: временные формы.',
  },
  {
    id: 'gen_5',
    level: 'B2',
    question: 'Can you understand podcasts, TV shows or books with complex arguments?',
    questionRu: 'Понимаете ли вы телепередачи, книги или подкасты с беглой речью?',
    options: ['Пока нет', 'Только отдельные слова', 'Улавливаю основную суть', 'Понимаю 80-95% даже на высокой скорости'],
    correctIndex: 3,
    explanation: 'Продвинутый уровень B2: восприятие беглой речи.',
  },
];

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
  setUser,
  onApplyModule,
  language,
  playSound,
  setToast,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const isRu = language === 'ru';
  const questions = PLACEMENT_QUESTIONS[course.id] || GENERAL_FALLBACK_QUESTIONS;
  const currentQ = questions[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    playSound('click');
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);

    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      playSound('correct');
    } else {
      playSound('wrong');
    }

    setAnswers((prev) => [...prev, selectedOption]);
  };

  const handleNextQuestion = () => {
    playSound('click');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
    }
  };

  // Calculate score and result
  const calculateResult = (): PlacementResult => {
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].correctIndex) {
        score += 1;
      }
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    let suggestedModule = 1;
    let levelTitle = isRu ? 'Модуль 1: Начинающий (A1)' : 'Module 1: Beginner (A1)';
    let levelDescription = isRu 
      ? 'Идеально для изучения основ, алфавита, звуков и первых простых предложений.' 
      : 'Ideal for learning basics, alphabet, sounds, and first sentences.';

    if (percentage >= 80) {
      suggestedModule = 4;
      levelTitle = isRu ? 'Модуль 4: Продвинутый (B2)' : 'Module 4: Advanced (B2)';
      levelDescription = isRu 
        ? 'Высокий уровень владения! Рекомендуем пропустить базовые темы и перейти к сложным диалогам и нюансам.' 
        : 'High proficiency! We recommend skipping basic topics and jumping to advanced dialogues.';
    } else if (percentage >= 50) {
      suggestedModule = 3;
      levelTitle = isRu ? 'Модуль 3: Средний уровень (B1)' : 'Module 3: Intermediate (B1)';
      levelDescription = isRu 
        ? 'Хорошая база! Вы можете пропустить вводные уроки и начать с темы путешествий, работы и грамматики.' 
        : 'Solid foundation! You can skip introductory lessons and start with travel, work, and grammar.';
    } else if (percentage >= 25) {
      suggestedModule = 2;
      levelTitle = isRu ? 'Модуль 2: Базовый уровень (A2)' : 'Module 2: Elementary (A2)';
      levelDescription = isRu 
        ? 'Вы знакомы с основами языка. Рекомендуем начать со 2 модуля для закрепления и расширения словаря.' 
        : 'You know the basics. Start with Module 2 to strengthen vocabulary and basic sentences.';
    }

    return {
      courseId: course.id,
      score,
      total,
      percentage,
      suggestedModule,
      levelTitle,
      levelDescription,
    };
  };

  const handleApplyResult = () => {
    const result = calculateResult();
    playSound('correct');
    const bonusXp = (result.suggestedModule - 1) * 60;

    // Save test result in user progress
    const updatedPlacementTests = {
      ...(user.placementTests || {}),
      [course.id]: {
        moduleIndex: result.suggestedModule,
        score: result.score,
        completedAt: new Date().toISOString(),
      },
    };

    setUser((prev) => ({
      ...prev,
      currentUnit: Math.max(prev.currentUnit || 1, result.suggestedModule),
      xp: (prev.xp || 0) + bonusXp,
      placementTests: updatedPlacementTests,
    }));

    onApplyModule(result.suggestedModule, bonusXp);
    setToast(
      isRu 
        ? `🎯 Вы успешно распределены в ${result.levelTitle}! Начислено +${bonusXp} XP` 
        : `🎯 Placed into ${result.levelTitle}! Awarded +${bonusXp} XP`
    );
    onClose();
  };

  const handleStartAtBeginning = () => {
    playSound('click');
    onApplyModule(1, 0);
    setToast(isRu ? '🐣 Вы начали курс с Модуля 1 (С самых основ)' : '🐣 Started course at Module 1 from scratch');
    onClose();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = course.id === 'es' ? 'es-ES' : course.id === 'de' ? 'de-DE' : course.id === 'fr' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-[285] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="fixed inset-0" onClick={() => { playSound('click'); onClose(); }} />

      <div className="relative z-10 bg-gray-950 border-2 border-duo-green/80 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-[0_0_55px_rgba(88,204,2,0.25)] text-white space-y-4 max-h-[92vh] overflow-y-auto text-left">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-duo-green/20 border-2 border-duo-green/60 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🎯
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isRu ? 'Тест на уровень языка' : 'Language Placement Test'}</span>
                <span className="text-[10px] bg-duo-green/20 text-duo-green border border-duo-green/40 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                  {course.name}
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                {isRu ? 'Определите подходящий начальный модуль курса' : 'Determine your optimal starting module'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ACTIVE TEST FLOW */}
        {!isFinished && (
          <div className="space-y-4">
            {/* PROGRESS BAR */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                <span>{isRu ? `Вопрос ${currentIdx + 1} из ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}</span>
                <span className="text-duo-green font-mono uppercase font-black">{currentQ.level}</span>
              </div>
              <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-duo-green h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* QUESTION BOX */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                  {isRu && currentQ.questionRu ? currentQ.questionRu : currentQ.question}
                </h4>
                <button
                  type="button"
                  onClick={() => speakText(currentQ.question)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-duo-blue rounded-xl border border-gray-700 shrink-0 cursor-pointer"
                  title={isRu ? 'Озвучить вопрос' : 'Speak question'}
                >
                  🔊
                </button>
              </div>
              {isRu && currentQ.questionRu && currentQ.question !== currentQ.questionRu && (
                <p className="text-xs text-gray-400 italic">
                  {currentQ.question}
                </p>
              )}
            </div>

            {/* OPTIONS LIST */}
            <div className="space-y-2">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-gray-900 border-gray-800 hover:border-duo-green/50 text-gray-200';
                if (selectedOption === idx) {
                  btnStyle = 'bg-duo-green/20 border-duo-green text-white ring-2 ring-duo-green/40';
                }

                if (isAnswerChecked) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500';
                  } else if (selectedOption === idx) {
                    btnStyle = 'bg-red-950/80 border-red-500 text-red-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    <span className="text-xs opacity-60 font-mono">[{String.fromCharCode(65 + idx)}]</span>
                  </button>
                );
              })}
            </div>

            {/* EXPLANATION FEEDBACK ON CHECK */}
            {isAnswerChecked && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                selectedOption === currentQ.correctIndex 
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200' 
                  : 'bg-red-950/50 border-red-500/50 text-red-200'
              }`}>
                <div className="font-black text-xs uppercase flex items-center gap-1.5">
                  <span>{selectedOption === currentQ.correctIndex ? '✅ Верно!' : '❌ Не совсем точно'}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartAtBeginning}
                className="text-xs text-gray-400 hover:text-gray-200 underline font-bold cursor-pointer"
              >
                {isRu ? 'Пропустить и начать с Модуля 1' : 'Skip & start at Module 1'}
              </button>

              {!isAnswerChecked ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className="py-3 px-6 bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-duo-greenDark active:translate-y-0.5 transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {isRu ? 'Проверить' : 'Check'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="py-3 px-6 bg-duo-blue hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-duo-blueDark active:translate-y-0.5 transition-all shadow cursor-pointer"
                >
                  {currentIdx + 1 < questions.length ? (isRu ? 'Дальше →' : 'Next →') : (isRu ? 'Результат 🏆' : 'Results 🏆')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {isFinished && (() => {
          const result = calculateResult();
          return (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 border-2 border-white/50 flex items-center justify-center text-4xl shadow-xl">
                🏆
              </div>

              <div>
                <span className="text-xs text-duo-green font-black uppercase tracking-wider font-mono">
                  {isRu ? `Результат: ${result.score} из ${result.total} (${result.percentage}%)` : `Result: ${result.score} / ${result.total} (${result.percentage}%)`}
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {result.levelTitle}
                </h3>
                <p className="text-xs text-gray-300 font-bold max-w-md mx-auto mt-2 leading-relaxed">
                  {result.levelDescription}
                </p>
              </div>

              <div className="p-3.5 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-around text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Рекомендованный старт' : 'Suggested Start'}</span>
                  <span className="text-duo-green font-black text-base">Модуль {result.suggestedModule}</span>
                </div>
                <div className="h-8 w-px bg-gray-800" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Бонусный опыт XP' : 'Bonus Placement XP'}</span>
                  <span className="text-amber-400 font-black text-base">+{(result.suggestedModule - 1) * 60} XP</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleApplyResult}
                  className="w-full py-4 bg-duo-green hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark active:translate-y-0.5 transition-all shadow-lg cursor-pointer"
                >
                  🚀 {isRu ? `Начать обучение с Модуля ${result.suggestedModule}` : `Start Learning at Module ${result.suggestedModule}`}
                </button>

                <button
                  type="button"
                  onClick={handleStartAtBeginning}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  🐣 {isRu ? 'Всё равно начать с Модуля 1 (С нуля)' : 'Start from Module 1 (From Scratch)'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

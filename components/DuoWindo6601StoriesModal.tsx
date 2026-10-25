import React, { useState } from 'react';
import { Course, UserProgress } from '../types';
import { CloseIcon, VolumeIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import { Mascot } from './Mascot';
import confetti from 'canvas-confetti';

export interface StoryLine {
  id: string;
  character: string;
  avatar: string;
  text: string;
  translationRu: string;
  translationEn: string;
}

export interface StoryQuestion {
  questionRu: string;
  questionEn: string;
  optionsRu: string[];
  optionsEn: string[];
  correctIndex: number;
}

export interface DuolingoStory {
  id: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  icon: string;
  accentColor: string;
  lines: StoryLine[];
  question: StoryQuestion;
}

// Built-in authentic Duolingo-style stories adapted for courses
const DEFAULT_STORIES: DuolingoStory[] = [
  {
    id: 'good-morning',
    titleRu: 'Доброе утро',
    titleEn: 'Good Morning',
    descRu: 'Джуниор хочет взрослого кофе, но у папы другие планы',
    descEn: 'Junior wants coffee for breakfast, but dad has other plans',
    icon: '☕',
    accentColor: 'from-amber-500 to-orange-500',
    lines: [
      { id: '1', character: 'Junior', avatar: '👦', text: 'Доброе утро, папа! Мне нужен кофе.', translationRu: 'Доброе утро, папа! Мне нужен кофе.', translationEn: 'Good morning, dad! I need coffee.' },
      { id: '2', character: 'Eddy', avatar: '👨', text: 'Кофе? Джуниор, тебе всего восемь лет!', translationRu: 'Кофе? Джуниор, тебе всего восемь лет!', translationEn: 'Coffee? Junior, you are only eight years old!' },
      { id: '3', character: 'Junior', avatar: '👦', text: 'Но я уже взрослый! У меня сегодня сложный экзамен в школе.', translationRu: 'Но я уже взрослый! У меня сегодня сложный экзамен в школе.', translationEn: 'But I am already grown up! I have a hard exam at school today.' },
      { id: '4', character: 'Eddy', avatar: '👨', text: 'Вот, держи стакан теплого молока с мёдом.', translationRu: 'Вот, держи стакан теплого молока с мёдом.', translationEn: 'Here, take a glass of warm milk with honey.' },
      { id: '5', character: 'Junior', avatar: '👦', text: 'Хм... это сладко. Ладно, взрослые дела подождут!', translationRu: 'Хм... это сладко. Ладно, взрослые дела подождут!', translationEn: 'Hmm... that is sweet. Okay, grown-up things can wait!' }
    ],
    question: {
      questionRu: 'Что в итоге выпил Джуниор?',
      questionEn: 'What did Junior end up drinking?',
      optionsRu: ['Горячий черный кофе', 'Теплое молоко с мёдом', 'Апельсиновый сок'],
      optionsEn: ['Hot black coffee', 'Warm milk with honey', 'Orange juice'],
      correctIndex: 1
    }
  },
  {
    id: 'the-date',
    titleRu: 'Свидание',
    titleEn: 'A Date',
    descRu: 'Беа встречает в ресторане мужчину, но произошла забавная путаница',
    descEn: 'Bea meets a man in a restaurant, but there is a funny mix-up',
    icon: '🌹',
    accentColor: 'from-rose-500 to-pink-500',
    lines: [
      { id: '1', character: 'Bea', avatar: '👩', text: 'Привет! Ты Даниэль? Извини за опоздание.', translationRu: 'Привет! Ты Даниэль? Извини за опоздание.', translationEn: 'Hello! Are you Daniel? Sorry for being late.' },
      { id: '2', character: 'Daniel', avatar: '🧔', text: 'Да, я Даниэль. Но я ждал маму...', translationRu: 'Да, я Даниэль. Но я ждал маму...', translationEn: 'Yes, I am Daniel. But I was waiting for my mom...' },
      { id: '3', character: 'Bea', avatar: '👩', text: 'Ой! Я перепутала столики! Какая неловкость!', translationRu: 'Ой! Я перепутала столики! Какая неловкость!', translationEn: 'Oh! I mixed up the tables! How awkward!' },
      { id: '4', character: 'Daniel', avatar: '🧔', text: 'Ничего страшного! Присаживайся, мама как раз позвонила, что застряла в пробке.', translationRu: 'Ничего страшного! Присаживайся, мама как раз позвонила, что застряла в пробке.', translationEn: 'No problem at all! Sit down, my mom just called saying she is stuck in traffic.' },
      { id: '5', character: 'Bea', avatar: '👩', text: 'Тогда давай закажем десерт!', translationRu: 'Тогда давай закажем десерт!', translationEn: 'Then let us order dessert!' }
    ],
    question: {
      questionRu: 'Кого на самом деле ждал Даниэль за столиком?',
      questionEn: 'Who was Daniel actually waiting for?',
      optionsRu: ['Своего коллегу по работе', 'Свою маму', 'Свою девушку'],
      optionsEn: ['His coworker', 'His mother', 'His girlfriend'],
      correctIndex: 1
    }
  },
  {
    id: 'lost-ticket',
    titleRu: 'Потерянный билет',
    titleEn: 'The Lost Ticket',
    descRu: 'Викрам на вокзале проверяет все карманы перед отправлением',
    descEn: 'Vikram checks all his pockets before the train departs',
    icon: '🎫',
    accentColor: 'from-emerald-500 to-teal-500',
    lines: [
      { id: '1', character: 'Vikram', avatar: '👨‍💼', text: 'О нет! Где мой билет на поезд?', translationRu: 'О нет! Где мой билет на поезд?', translationEn: 'Oh no! Where is my train ticket?' },
      { id: '2', character: 'Clerk', avatar: '👮', text: 'Поезд отправляется через две минуты, сэр.', translationRu: 'Поезд отправляется через две минуты, сэр.', translationEn: 'The train leaves in two minutes, sir.' },
      { id: '3', character: 'Vikram', avatar: '👨‍💼', text: 'Его нет в сумке! Его нет в кошельке!', translationRu: 'Его нет в сумке! Его нет в кошельке!', translationEn: 'It is not in the bag! It is not in the wallet!' },
      { id: '4', character: 'Clerk', avatar: '👮', text: 'Сэр, взгляните на свою правую руку.', translationRu: 'Сэр, взгляните на свою правую руку.', translationEn: 'Sir, please look at your right hand.' },
      { id: '5', character: 'Vikram', avatar: '👨‍💼', text: 'Ха-ха! Я держал его всё это время! Спасибо!', translationRu: 'Ха-ха! Я держал его всё это время! Спасибо!', translationEn: 'Haha! I was holding it all this time! Thank you!' }
    ],
    question: {
      questionRu: 'Где всё это время находился билет Викрама?',
      questionEn: 'Where was Vikram\'s ticket the entire time?',
      optionsRu: ['В чемодане', 'В его руке', 'Он выпал на перрон'],
      optionsEn: ['In the suitcase', 'In his hand', 'It dropped onto the platform'],
      correctIndex: 1
    }
  },
  {
    id: 'red-jacket',
    titleRu: 'Красная куртка',
    titleEn: 'The Red Jacket',
    descRu: 'Люси выбирает одежду в магазине, когда к ней подходят с вопросом',
    descEn: 'Lucy is browsing clothes when a shopper asks for advice',
    icon: '🧥',
    accentColor: 'from-purple-500 to-indigo-500',
    lines: [
      { id: '1', character: 'Shopper', avatar: '👱‍♀️', text: 'Здравствуйте! У вас есть эта куртка в синем цвете?', translationRu: 'Здравствуйте! У вас есть эта куртка в синем цвете?', translationEn: 'Hello! Do you have this jacket in blue?' },
      { id: '2', character: 'Lucy', avatar: '🧓', text: 'Я не знаю, милочка.', translationRu: 'Я не знаю, милочка.', translationEn: 'I do not know, dear.' },
      { id: '3', character: 'Shopper', avatar: '👱‍♀️', text: 'Разве вы здесь не работаете? На вас красный бейдж!', translationRu: 'Разве вы здесь не работаете? На вас красный бейдж!', translationEn: 'Do you not work here? You have a red badge!' },
      { id: '4', character: 'Lucy', avatar: '🧓', text: 'Это значок моего шахматного клуба! Но синий цвет вам определенно пойдет.', translationRu: 'Это значок моего шахматного клуба! Но синий цвет вам определенно пойдет.', translationEn: 'This is my chess club badge! But blue will definitely suit you.' },
      { id: '5', character: 'Shopper', avatar: '👱‍♀️', text: 'Спасибо за совет, чемпионка!', translationRu: 'Спасибо за совет, чемпионка!', translationEn: 'Thanks for the advice, champion!' }
    ],
    question: {
      questionRu: 'Кем на самом деле оказалась Люси?',
      questionEn: 'Who did Lucy turn out to be?',
      optionsRu: ['Менеджером магазина', 'Членом шахматного клуба', 'Охранником'],
      optionsEn: ['Store manager', 'Chess club member', 'Security guard'],
      correctIndex: 1
    }
  }
];

interface DuoWindo6601StoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourse: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  speakText: (text: string, courseId: string, slow?: boolean) => void;
}

export const DuoWindo6601StoriesModal: React.FC<DuoWindo6601StoriesModalProps> = ({
  isOpen,
  onClose,
  currentCourse,
  user,
  setUser,
  playSound,
  setToast,
  speakText
}) => {
  const isRu = user.language === 'ru';
  const [activeStory, setActiveStory] = useState<DuolingoStory | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [isStoryComplete, setIsStoryComplete] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);

  if (!isOpen) return null;

  const handleStartStory = (story: DuolingoStory) => {
    playSound('click');
    setActiveStory(story);
    setCurrentLineIndex(0);
    setShowQuestion(false);
    setSelectedOption(null);
    setQuestionAnswered(false);
    setIsStoryComplete(false);

    // Speak initial line
    if (story.lines[0]) {
      speakText(story.lines[0].text, currentCourse.id);
    }
  };

  const handleNextLine = () => {
    playSound('click');
    if (!activeStory) return;

    if (currentLineIndex < activeStory.lines.length - 1) {
      const nextIndex = currentLineIndex + 1;
      setCurrentLineIndex(nextIndex);
      speakText(activeStory.lines[nextIndex].text, currentCourse.id);
    } else if (!showQuestion) {
      setShowQuestion(true);
      playSound('fanfare');
    }
  };

  const handleSelectOption = (idx: number) => {
    if (questionAnswered || !activeStory) return;
    setSelectedOption(idx);
    setQuestionAnswered(true);

    if (idx === activeStory.question.correctIndex) {
      playSound('correct');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } else {
      playSound('wrong');
    }
  };

  const handleFinishStory = () => {
    playSound('fanfare');
    setIsStoryComplete(true);
    setUser(u => ({
      ...u,
      xp: u.xp + 25,
      gems: u.gems + 5
    }));
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    setToast(isRu ? '🎉 История завершена! +25 ОЧКОВ XP!' : '🎉 Story completed! +25 XP!');
  };

  const handleClosePlayer = () => {
    playSound('click');
    setActiveStory(null);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-[#131f24] border-2 border-[#263843] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative text-left">
        
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 border-b border-[#263843] flex items-center justify-between bg-[#182328]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-md text-white">
              📖
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>{isRu ? 'Истории DuoWindo6601' : 'DuoWindo6601 Stories'}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentCourse.localName}
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-bold">
                {isRu ? 'Интерактивные диалоги и вопросы на понимание (+25 XP)' : 'Interactive dialogues and comprehension questions (+25 XP)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              if (activeStory) {
                setActiveStory(null);
              } else {
                onClose();
              }
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Закрыть"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!activeStory ? (
            /* STORIES CATALOG SHELF */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-900/50 via-slate-900 to-pink-900/50 border border-purple-500/40 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-base">
                    {isRu ? 'Коллекция оригинальных историй' : 'Original Stories Collection'}
                  </h3>
                  <p className="text-xs text-purple-200/80 font-bold mt-0.5">
                    {isRu ? 'Слушайте реплики персонажей, отвечайте на вопросы и прокачивайте язык' : 'Listen to characters, answer comprehension questions and level up'}
                  </p>
                </div>
                <div className="text-2xl shrink-0 ml-2">✨</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {DEFAULT_STORIES.map(story => (
                  <div
                    key={story.id}
                    onClick={() => handleStartStory(story)}
                    className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-purple-500/60 rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${story.accentColor} flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform`}>
                          {story.icon}
                        </div>
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          +25 XP
                        </span>
                      </div>
                      <h4 className="font-black text-white text-base md:text-lg group-hover:text-purple-300 transition-colors">
                        {isRu ? story.titleRu : story.titleEn}
                      </h4>
                      <p className="text-xs text-gray-400 font-bold mt-1 line-clamp-2">
                        {isRu ? story.descRu : story.descEn}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#263843] flex items-center justify-between text-xs font-black text-purple-400 group-hover:text-purple-300">
                      <span>{isRu ? 'СЛУШАТЬ И ЧИТАТЬ' : 'LISTEN & READ'}</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isStoryComplete ? (
            /* STORY COMPLETED SCREEN */
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95">
              <div className="relative inline-block">
                <Mascot emotion="happy" className="w-32 h-32 mx-auto drop-shadow-2xl" variant={currentCourse.mascotVariant} />
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full border-2 border-white shadow-lg">
                  +25 XP
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {isRu ? 'История завершена!' : 'Story Completed!'}
                </h3>
                <p className="text-sm font-bold text-gray-400 mt-1">
                  {isRu ? `Вы отлично справились с историей "${activeStory.titleRu}"!` : `Great job completing "${activeStory.titleEn}"!`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClosePlayer}
                  className="px-6 py-3.5 bg-[#58cc02] hover:bg-[#46a302] border-b-4 border-[#3b8700] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer active:translate-y-1 active:border-b-0"
                >
                  {isRu ? 'К СПИСКУ ИСТОРИЙ' : 'BACK TO STORIES'}
                </button>
              </div>
            </div>
          ) : (
            /* STORY READER */
            <div className="space-y-5">
              {/* Story top progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-gray-400">
                  <span className="text-purple-300 uppercase">
                    {isRu ? activeStory.titleRu : activeStory.titleEn}
                  </span>
                  <span>
                    {currentLineIndex + 1} / {activeStory.lines.length}
                  </span>
                </div>
                <div className="w-full bg-[#1e2d35] h-3 rounded-full overflow-hidden border border-[#263843]">
                  <div
                    className="bg-[#58cc02] h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentLineIndex + 1) / (activeStory.lines.length + 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Translation toggle button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTranslations(!showTranslations)}
                  className="text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#182328] border border-[#263843] cursor-pointer"
                >
                  <span>{showTranslations ? '👁️' : '🙈'}</span>
                  <span>{isRu ? (showTranslations ? 'Скрыть перевод' : 'Показать перевод') : (showTranslations ? 'Hide translation' : 'Show translation')}</span>
                </button>
              </div>

              {/* Conversation messages shown so far */}
              <div className="space-y-3">
                {activeStory.lines.slice(0, currentLineIndex + 1).map((line, idx) => {
                  const isLatest = idx === currentLineIndex;
                  return (
                    <div
                      key={line.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-200 border ${
                        isLatest
                          ? 'bg-[#1e2d35] border-purple-500/50 shadow-md'
                          : 'bg-[#182328]/80 border-transparent opacity-85'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                        {line.avatar}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-300 uppercase tracking-wider">
                            {line.character}
                          </span>
                          <button
                            type="button"
                            onClick={() => speakText(line.text, currentCourse.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title="Озвучить"
                          >
                            <VolumeIcon className="w-4 h-4 text-purple-300" />
                          </button>
                        </div>
                        <p className="text-white font-bold text-base leading-snug">
                          {line.text}
                        </p>
                        {showTranslations && (
                          <p className="text-xs font-bold text-gray-400 italic">
                            {isRu ? line.translationRu : line.translationEn}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehension Question if reached the end of dialogue */}
              {showQuestion && (
                <div className="bg-[#182328] border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                    <span>⚡</span>
                    <span>{isRu ? 'ВОПРОС ПО ИСТОРИИ' : 'STORY COMPREHENSION'}</span>
                  </div>

                  <h4 className="text-white font-black text-base sm:text-lg">
                    {isRu ? activeStory.question.questionRu : activeStory.question.questionEn}
                  </h4>

                  <div className="space-y-2">
                    {(isRu ? activeStory.question.optionsRu : activeStory.question.optionsEn).map((opt, idx) => {
                      const isChosen = selectedOption === idx;
                      const isCorrect = idx === activeStory.question.correctIndex;
                      let btnStyle = 'bg-[#1e2d35] border-[#263843] text-white hover:border-purple-400';

                      if (questionAnswered) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-black';
                        } else if (isChosen) {
                          btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300 line-through';
                        } else {
                          btnStyle = 'bg-[#182328] border-transparent text-gray-500 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={questionAnswered}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full p-3.5 rounded-xl border-2 text-left font-bold text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {questionAnswered && isCorrect && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTION BUTTON */}
        {activeStory && !isStoryComplete && (
          <div className="p-4 sm:p-5 border-t border-[#263843] bg-[#182328] flex items-center justify-between">
            <button
              type="button"
              onClick={handleClosePlayer}
              className="px-4 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isRu ? 'ВЫЙТИ' : 'EXIT'}
            </button>

            {!showQuestion ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowQuestion(true);
                  }}
                  className="px-4 py-3 bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border-2 border-gray-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  title={isRu ? 'Пропустить реплики к вопросу' : 'Skip lines to question'}
                >
                  <span>⏭️</span>
                  <span>{isRu ? 'ПРОПУСТИТЬ' : 'SKIP'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextLine}
                  className="px-8 py-3.5 bg-[#58cc02] hover:bg-[#46a302] border-b-4 border-[#3b8700] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer active:translate-y-1 active:border-b-0"
                >
                  {isRu ? 'ПРОДОЛЖИТЬ →' : 'CONTINUE →'}
                </button>
              </div>
            ) : questionAnswered ? (
              <button
                type="button"
                onClick={handleFinishStory}
                className="px-8 py-3.5 bg-[#1cb0f6] hover:bg-[#189ddc] border-b-4 border-[#1482b8] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer active:translate-y-1 active:border-b-0"
              >
                {isRu ? 'ЗАВЕРШИТЬ (+25 XP) 🎉' : 'COMPLETE (+25 XP) 🎉'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFinishStory}
                  className="px-4 py-2.5 bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border-2 border-gray-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow"
                  title={isRu ? 'Пропустить вопрос' : 'Skip question'}
                >
                  <span>⏭️</span>
                  <span>{isRu ? 'ПРОПУСТИТЬ' : 'SKIP'}</span>
                </button>
                <div className="text-xs font-bold text-amber-400">
                  {isRu ? 'Выберите правильный ответ' : 'Select the correct answer'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const DuolingoStoriesModal = DuoWindo6601StoriesModal;

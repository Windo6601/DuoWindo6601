import React, { useState, useEffect, useRef } from 'react';
import { UserProgress } from '../types';
import { CloseIcon, VolumeIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from './Icons';
import { Mascot } from './Mascot';
import confetti from 'canvas-confetti';

interface MusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  onUpdateUser: (updated: Partial<UserProgress>) => void;
  initialTab?: 'notes' | 'learn' | 'tempo' | 'repeat';
}

interface MelodySong {
  id: string;
  titleRu: string;
  titleEn: string;
  composer: string;
  difficulty: string;
  notes: { note: string; freq: number; duration: number }[];
}

const NOTE_THEORY = [
  { note: 'C4', nameRu: 'До (C)', freq: 261.63, descriptionRu: 'Основная нота октавы, отправная точка звукоряда.', color: 'bg-red-500' },
  { note: 'D4', nameRu: 'Ре (D)', freq: 293.66, descriptionRu: 'Вторая ступень, светлый и устойчивый звук.', color: 'bg-orange-500' },
  { note: 'E4', nameRu: 'Ми (E)', freq: 329.63, descriptionRu: 'Третья ступень, придающая мягкость и лиричность.', color: 'bg-yellow-500' },
  { note: 'F4', nameRu: 'Фа (F)', freq: 349.23, descriptionRu: 'Четвертая ступень, открытая и выразительная.', color: 'bg-green-500' },
  { note: 'G4', nameRu: 'Соль (G)', freq: 392.00, descriptionRu: 'Пятая ступень (доминанта), яркая и звонкая.', color: 'bg-teal-500' },
  { note: 'A4', nameRu: 'Ля (A)', freq: 440.00, descriptionRu: 'Шестая ступень, эталон настройки камертона (440 Гц).', color: 'bg-blue-500' },
  { note: 'B4', nameRu: 'Си (B)', freq: 493.88, descriptionRu: 'Седьмая ступень (вводный тон), стремящаяся к тонике.', color: 'bg-purple-500' },
  { note: 'C5', nameRu: 'До (C5)', freq: 523.25, descriptionRu: 'Верхняя тоника, октавой выше.', color: 'bg-pink-500' },
];

const MELODIES: MelodySong[] = [
  {
    id: 'twinkle',
    titleRu: 'Звёздочка (Twinkle Twinkle)',
    titleEn: 'Twinkle Twinkle Little Star',
    composer: 'Народная / В. А. Моцарт',
    difficulty: 'Легко',
    notes: [
      { note: 'C4', freq: 261.63, duration: 400 },
      { note: 'C4', freq: 261.63, duration: 400 },
      { note: 'G4', freq: 392.00, duration: 400 },
      { note: 'G4', freq: 392.00, duration: 400 },
      { note: 'A4', freq: 440.00, duration: 400 },
      { note: 'A4', freq: 440.00, duration: 400 },
      { note: 'G4', freq: 392.00, duration: 800 },
      { note: 'F4', freq: 349.23, duration: 400 },
      { note: 'F4', freq: 349.23, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'D4', freq: 293.66, duration: 400 },
      { note: 'D4', freq: 293.66, duration: 400 },
      { note: 'C4', freq: 261.63, duration: 800 },
    ]
  },
  {
    id: 'fur-elise',
    titleRu: 'К Элизе (Für Elise)',
    titleEn: 'Für Elise',
    composer: 'Л. ван Бетховен',
    difficulty: 'Средне',
    notes: [
      { note: 'E5', freq: 659.25, duration: 300 },
      { note: 'D#5', freq: 622.25, duration: 300 },
      { note: 'E5', freq: 659.25, duration: 300 },
      { note: 'D#5', freq: 622.25, duration: 300 },
      { note: 'E5', freq: 659.25, duration: 300 },
      { note: 'B4', freq: 493.88, duration: 300 },
      { note: 'D5', freq: 587.33, duration: 300 },
      { note: 'C5', freq: 523.25, duration: 300 },
      { note: 'A4', freq: 440.00, duration: 600 },
    ]
  },
  {
    id: 'ode-to-joy',
    titleRu: 'Ода к радости',
    titleEn: 'Ode to Joy',
    composer: 'Л. ван Бетховен',
    difficulty: 'Легко',
    notes: [
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'F4', freq: 349.23, duration: 400 },
      { note: 'G4', freq: 392.00, duration: 400 },
      { note: 'G4', freq: 392.00, duration: 400 },
      { note: 'F4', freq: 349.23, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'D4', freq: 293.66, duration: 400 },
      { note: 'C4', freq: 261.63, duration: 400 },
      { note: 'C4', freq: 261.63, duration: 400 },
      { note: 'D4', freq: 293.66, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 400 },
      { note: 'E4', freq: 329.63, duration: 600 },
      { note: 'D4', freq: 293.66, duration: 200 },
      { note: 'D4', freq: 293.66, duration: 800 },
    ]
  }
];

const PIANO_KEYS = [
  { note: 'C4', freq: 261.63, label: 'C', isBlack: false },
  { note: 'C#4', freq: 277.18, label: 'C#', isBlack: true },
  { note: 'D4', freq: 293.66, label: 'D', isBlack: false },
  { note: 'D#4', freq: 311.13, label: 'D#', isBlack: true },
  { note: 'E4', freq: 329.63, label: 'E', isBlack: false },
  { note: 'F4', freq: 349.23, label: 'F', isBlack: false },
  { note: 'F#4', freq: 369.99, label: 'F#', isBlack: true },
  { note: 'G4', freq: 392.00, label: 'G', isBlack: false },
  { note: 'G#4', freq: 415.30, label: 'G#', isBlack: true },
  { note: 'A4', freq: 440.00, label: 'A', isBlack: false },
  { note: 'A#4', freq: 466.16, label: 'A#', isBlack: true },
  { note: 'B4', freq: 493.88, label: 'B', isBlack: false },
  { note: 'C5', freq: 523.25, label: 'C5', isBlack: false },
];

export const MusicStudioModal: React.FC<MusicStudioModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  initialTab = 'notes'
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'learn' | 'tempo' | 'repeat'>(initialTab);
  const [selectedMelody, setSelectedMelody] = useState<MelodySong>(MELODIES[0]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [isPlayingMelody, setIsPlayingMelody] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  
  // Repeat game state
  const [repeatSequence, setRepeatSequence] = useState<{ note: string; freq: number }[]>([]);
  const [userRepeatIndex, setUserRepeatIndex] = useState<number>(0);
  const [repeatScore, setRepeatScore] = useState<number>(0);
  const [repeatStage, setRepeatStage] = useState<'idle' | 'playing' | 'waiting' | 'success' | 'fail'>('idle');

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
  }, []);

  const playTone = (freq: number, duration = 400, type: OscillatorType = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio playback fallback
    }
  };

  const handleKeyPress = (note: string, freq: number) => {
    setActiveKey(note);
    playTone(freq, 400);
    setTimeout(() => setActiveKey(null), 200);

    // If in Learn Mode
    if (activeTab === 'learn' && isPlayingMelody) {
      const targetNote = selectedMelody.notes[currentNoteIndex];
      if (targetNote && targetNote.note === note) {
        const nextIdx = currentNoteIndex + 1;
        if (nextIdx >= selectedMelody.notes.length) {
          setIsPlayingMelody(false);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          onUpdateUser({ xp: user.xp + 30 });
        } else {
          setCurrentNoteIndex(nextIdx);
        }
      }
    }

    // If in Repeat Mode (Ear training)
    if (activeTab === 'repeat' && repeatStage === 'waiting') {
      const target = repeatSequence[userRepeatIndex];
      if (target && target.note === note) {
        const nextIdx = userRepeatIndex + 1;
        if (nextIdx >= repeatSequence.length) {
          setRepeatStage('success');
          setRepeatScore(prev => prev + 1);
          confetti({ particleCount: 50, spread: 60 });
          onUpdateUser({ xp: user.xp + 20 });
        } else {
          setUserRepeatIndex(nextIdx);
        }
      } else {
        setRepeatStage('fail');
      }
    }
  };

  const playFullMelody = async (melody: MelodySong) => {
    setIsPlayingMelody(true);
    setCurrentNoteIndex(0);
    for (let i = 0; i < melody.notes.length; i++) {
      setCurrentNoteIndex(i);
      playTone(melody.notes[i].freq, melody.notes[i].duration);
      await new Promise(r => setTimeout(r, melody.notes[i].duration + 100));
    }
    setIsPlayingMelody(false);
  };

  const startRepeatChallenge = () => {
    setRepeatStage('playing');
    setUserRepeatIndex(0);
    
    const generated: { note: string; freq: number }[] = [];
    const count = Math.min(3 + repeatScore, 7);
    for (let i = 0; i < count; i++) {
      const randKey = PIANO_KEYS[Math.floor(Math.random() * PIANO_KEYS.length)];
      generated.push({ note: randKey.note, freq: randKey.freq });
    }
    setRepeatSequence(generated);

    let delay = 0;
    generated.forEach((item, idx) => {
      setTimeout(() => {
        playTone(item.freq, 400);
        setActiveKey(item.note);
        setTimeout(() => setActiveKey(null), 300);
        if (idx === generated.length - 1) {
          setTimeout(() => setRepeatStage('waiting'), 500);
        }
      }, delay);
      delay += 600;
    });
  };

  if (!isOpen) return null;

  const isRu = user.language === 'ru';

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#131f24] border-2 border-pink-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 sm:p-6 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-3xl sm:text-4xl">🎵</span>
            <div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider">
                {isRu ? 'Музыкальная Студия DuoWindo6601' : 'DuoWindo6601 Music Studio'}
              </h2>
              <p className="text-[10px] sm:text-xs text-pink-200 font-bold uppercase tracking-widest">
                {isRu ? 'Мобильная и ПК версия • Теория и практика' : 'Mobile & PC Edition • Theory & Practice'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-[#18262c] p-2.5 sm:p-3 border-b border-gray-800 flex flex-wrap gap-1.5 sm:gap-2 justify-center shrink-0">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-pink-600 text-white shadow-lg border-b-4 border-pink-800'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>📖</span>
            <span>{isRu ? 'Изучить ноты' : 'Study Notes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('learn')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-pink-600 text-white shadow-lg border-b-4 border-pink-800'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>🎼</span>
            <span>{isRu ? 'Разучите мелодию' : 'Learn Melody'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tempo')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tempo'
                ? 'bg-pink-600 text-white shadow-lg border-b-4 border-pink-800'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>🎹</span>
            <span>{isRu ? 'Сыграйте в своём темпе' : 'Play at Your Tempo'}</span>
          </button>

          <button
            onClick={() => setActiveTab('repeat')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'repeat'
                ? 'bg-pink-600 text-white shadow-lg border-b-4 border-pink-800'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <span>🎧</span>
            <span>{isRu ? 'Повторите композицию' : 'Repeat Composition'}</span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center">

          {/* TAB 0: STUDY NOTES (ИЗУЧИТЬ НОТЫ) */}
          {activeTab === 'notes' && (
            <div className="w-full max-w-2xl flex flex-col items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 text-center">
                {isRu ? 'Азбука музыки: Изучение нот' : 'Music Alphabet: Study Notes'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 mb-4 sm:mb-6 text-center">
                {isRu 
                  ? 'Касайтесь нот на экране или на клавиатуре внизу, чтобы услышать их звучание.' 
                  : 'Tap notes on screen or on the keyboard below to hear sound.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mb-4">
                {NOTE_THEORY.map(item => (
                  <div
                    key={item.note}
                    onClick={() => {
                      playTone(item.freq, 500);
                      setActiveKey(item.note);
                      setTimeout(() => setActiveKey(null), 300);
                      confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
                      onUpdateUser({ xp: user.xp + 5 });
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center space-x-3 sm:space-x-4 shadow-lg ${
                      activeKey === item.note ? 'bg-pink-900 border-pink-400 ring-2 ring-pink-400' : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${item.color} flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md shrink-0`}>
                      {item.note}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white text-sm sm:text-base">{item.nameRu}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">{item.descriptionRu}</p>
                    </div>
                    <span className="text-pink-400 text-sm font-bold">🔊</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: LEARN MELODY */}
          {activeTab === 'learn' && (
            <div className="w-full max-w-2xl flex flex-col items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 text-center">
                {isRu ? 'Выберите мелодию для разучивания' : 'Choose a melody to learn'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-4 sm:mb-6">
                {MELODIES.map(song => (
                  <div
                    key={song.id}
                    onClick={() => { setSelectedMelody(song); setCurrentNoteIndex(0); }}
                    className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedMelody.id === song.id
                        ? 'bg-pink-950/60 border-pink-500 ring-2 ring-pink-500'
                        : 'bg-gray-800/80 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <h4 className="font-bold text-white text-xs sm:text-sm mb-1">{isRu ? song.titleRu : song.titleEn}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-2">{song.composer}</p>
                    <span className="text-[9px] sm:text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-black uppercase">
                      {song.difficulty}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border-2 border-gray-800 w-full p-4 sm:p-6 rounded-3xl mb-4 sm:mb-6 text-center shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                  <span className="text-xs sm:text-sm font-bold text-gray-400">
                    {isRu ? 'Песня:' : 'Song:'} <strong className="text-white">{isRu ? selectedMelody.titleRu : selectedMelody.titleEn}</strong>
                  </span>
                  <button
                    onClick={() => playFullMelody(selectedMelody)}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <VolumeIcon className="w-4 h-4" />
                    <span>{isRu ? 'Прослушать' : 'Play Full'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-4 sm:mb-6 max-h-28 overflow-y-auto p-1">
                  {selectedMelody.notes.map((n, idx) => (
                    <div
                      key={idx}
                      className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-black text-[11px] sm:text-xs transition-all ${
                        idx === currentNoteIndex
                          ? 'bg-yellow-400 text-gray-950 scale-110 ring-2 ring-yellow-200 shadow-lg'
                          : idx < currentNoteIndex
                          ? 'bg-duo-green text-white'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {n.note}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] sm:text-xs text-pink-300 font-bold">
                  {isRu 
                    ? `Нажимайте правильные клавиши ниже (${currentNoteIndex + 1} из ${selectedMelody.notes.length})` 
                    : `Press correct keys below (${currentNoteIndex + 1} of ${selectedMelody.notes.length})`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PLAY AT YOUR TEMPO (FREEPLAY) */}
          {activeTab === 'tempo' && (
            <div className="w-full max-w-2xl text-center flex flex-col items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                {isRu ? 'Сыграйте в своём темпе' : 'Play at Your Own Tempo'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 mb-4 sm:mb-6">
                {isRu 
                  ? 'Мобильная и ПК песочница фортепиано. Касайтесь клавиш для импровизации!' 
                  : 'Mobile & PC piano sandbox mode. Tap keys to improvise!'}
              </p>
              <div className="bg-pink-950/30 border border-pink-500/30 p-4 sm:p-6 rounded-3xl w-full mb-4">
                <span className="text-3xl sm:text-4xl mb-2 block">🎹</span>
                <p className="text-xs sm:text-sm text-pink-200 font-bold">
                  {isRu ? 'Интерактивный синтезатор DuoWindo6601 активен' : 'DuoWindo6601 interactive synthesizer is active'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REPEAT COMPOSITION (EAR TRAINING) */}
          {activeTab === 'repeat' && (
            <div className="w-full max-w-2xl text-center flex flex-col items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                {isRu ? 'Повторите композицию' : 'Repeat the Composition'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 mb-4 sm:mb-6">
                {isRu 
                  ? 'Слушайте мелодию от Duo и повторяйте её на клавиатуре!' 
                  : 'Listen to melody from Duo and repeat it on keyboard!'}
              </p>

              <div className="bg-gray-900 border-2 border-gray-800 p-4 sm:p-6 rounded-3xl w-full mb-4 flex flex-col items-center shadow-xl">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 sm:mb-2">🏆 {repeatScore}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">{isRu ? 'Успешных повторений' : 'Successful Repeats'}</p>

                {repeatStage === 'idle' && (
                  <button
                    onClick={startRepeatChallenge}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-duo-green hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-wider text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                  >
                    {isRu ? 'Начать испытание на слух' : 'Start Ear Training'}
                  </button>
                )}

                {repeatStage === 'playing' && (
                  <div className="text-yellow-400 font-bold animate-pulse text-xs sm:text-sm">
                    {isRu ? '🎵 Слушайте мелодию...' : '🎵 Listen to melody...'}
                  </div>
                )}

                {repeatStage === 'waiting' && (
                  <div className="text-pink-400 font-bold animate-bounce text-xs sm:text-sm">
                    {isRu ? '🎹 Ваша очередь повторять ноты!' : '🎹 Your turn to repeat notes!'} ({userRepeatIndex + 1}/{repeatSequence.length})
                  </div>
                )}

                {repeatStage === 'success' && (
                  <div className="flex flex-col items-center">
                    <span className="text-duo-green font-black text-base sm:text-lg mb-2">✨ Отлично! (+20 XP)</span>
                    <button
                      onClick={startRepeatChallenge}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      {isRu ? 'Следующая' : 'Next'}
                    </button>
                  </div>
                )}

                {repeatStage === 'fail' && (
                  <div className="flex flex-col items-center">
                    <span className="text-red-400 font-black text-base sm:text-lg mb-2">❌ Ошибка. Повторите попытку!</span>
                    <button
                      onClick={startRepeatChallenge}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      {isRu ? 'Повторить' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIRTUAL PIANO KEYBOARD (OPTIMIZED FOR MOBILE & PC) */}
          <div className="w-full bg-[#0a1014] p-3 sm:p-5 rounded-3xl border-2 border-gray-800 shadow-inner flex flex-col items-center shrink-0 mt-auto">
            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 sm:mb-3 flex items-center justify-between w-full px-2">
              <span>{isRu ? '🎹 Фортепиано (ПК & Мобильный)' : '🎹 Piano (PC & Mobile)'}</span>
              <span className="text-[9px] text-pink-400 lowercase">{isRu ? 'адаптивно под любое устройство' : 'responsive layout'}</span>
            </div>
            
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-pink-600 scrollbar-track-gray-900 flex justify-center">
              <div className="flex relative justify-center gap-0.5 sm:gap-1 bg-black p-2 sm:p-3 rounded-2xl shadow-2xl min-w-max">
                {PIANO_KEYS.map((k) => {
                  const isActive = activeKey === k.note;
                  if (k.isBlack) {
                    return (
                      <button
                        key={k.note}
                        onClick={() => handleKeyPress(k.note, k.freq)}
                        className={`w-7 sm:w-9 h-20 sm:h-24 rounded-b-lg sm:rounded-b-xl z-10 -mx-3.5 sm:-mx-4 transition-all cursor-pointer font-bold text-[8px] sm:text-[9px] pb-1.5 sm:pb-2 flex items-end justify-center select-none active:scale-95 touch-none ${
                          isActive ? 'bg-yellow-400 text-black shadow-lg scale-95' : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700'
                        }`}
                      >
                        {k.label}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={k.note}
                      onClick={() => handleKeyPress(k.note, k.freq)}
                      className={`w-10 sm:w-13 h-30 sm:h-36 rounded-xl transition-all cursor-pointer font-bold text-[11px] sm:text-xs pt-3 sm:pt-4 flex flex-col justify-between items-center border border-gray-700 select-none active:scale-95 touch-none ${
                        isActive ? 'bg-yellow-400 text-black shadow-lg scale-95' : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span>{k.label}</span>
                      <span className="text-[8px] sm:text-[9px] text-gray-400">{k.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-[#18262c] p-3 sm:p-4 border-t border-gray-800 flex justify-between items-center px-4 sm:px-6 shrink-0">
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-gray-400">
            <span>XP: <strong className="text-white">{user.xp}</strong></span>
            <span>•</span>
            <span className="text-pink-400 font-bold">{isRu ? 'Студия активна' : 'Studio active'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            {isRu ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

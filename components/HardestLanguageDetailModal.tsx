import React from 'react';
import { LanguageDetailInfo } from '../services/languageDetailsData';
import { Course } from '../types';
import { CheckCircleIcon, StarIcon } from './Icons';

interface HardestLanguageDetailModalProps {
  languageInfo: LanguageDetailInfo | null;
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  isRussian: boolean;
  playSound: (sound: any) => void;
}

export const HardestLanguageDetailModal: React.FC<HardestLanguageDetailModalProps> = ({
  languageInfo,
  course,
  isOpen,
  onClose,
  onSelectCourse,
  isRussian,
  playSound,
}) => {
  if (!isOpen || !course) return null;

  const info: LanguageDetailInfo = languageInfo || {
    id: course.id,
    name: course.name,
    localName: course.localName,
    family: isRussian ? 'Уникальная языковая система' : 'Unique language system',
    speakers: isRussian ? 'Многие носители' : 'Active speakers',
    writingSystem: isRussian ? 'Национальный алфавит' : 'National alphabet',
    grammarHighlights: [
      { ru: 'Сложная система грамматических форм и агглютинации.', en: 'Complex system of grammatical forms and agglutination.' },
      { ru: 'Уникальные фонетические особенности.', en: 'Unique phonetic characteristics.' }
    ],
    samplePhrases: [
      { orig: course.localName, transRu: course.name, transEn: course.name }
    ],
    funFact: {
      ru: 'Один из самых увлекательных и сложных языков в мировом каталоге DuoWindo6601.',
      en: 'One of the most fascinating and challenging languages in the DuoWindo6601 global catalog.'
    },
    difficultyRank: '#TOP',
    badge: '⚡ Топ Сложность'
  };

  const isEasiest = info.id === 'eo' || info.id === 'id' || info.id === 'es' || info.id === 'it' ||
    info.difficultyRank.toLowerCase().includes('лёгкий') ||
    info.difficultyRank.toLowerCase().includes('прост') ||
    info.difficultyRank.toLowerCase().includes('easy') ||
    info.badge.toLowerCase().includes('лёгк') ||
    info.badge.toLowerCase().includes('прост');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 border-2 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 text-left relative ${
        isEasiest ? 'border-emerald-500/60 shadow-emerald-500/20' : 'border-orange-500/50 shadow-orange-500/20'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={() => { playSound('click'); onClose(); }}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-black text-lg transition-colors cursor-pointer shadow-md"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={`https://flagcdn.com/w160/${course.flagCode}.png`}
            className="w-16 h-12 rounded-lg object-cover shadow-lg border border-gray-700 shrink-0"
            alt={info.name}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow ${
                isEasiest 
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-slate-950' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950'
              }`}>
                {info.badge}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                isEasiest 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                  : 'bg-orange-950/80 text-orange-300 border-orange-500/40'
              }`}>
                {info.difficultyRank} {isRussian ? (isEasiest ? 'в рейтинге' : 'в рейтинге сложности') : 'rank'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              {info.localName}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {info.name}
            </p>
          </div>
        </div>

        {/* Info Grid: Family & Speakers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-4">
            <span className={`text-[10px] uppercase font-black tracking-wider block mb-1 ${
              isEasiest ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {isRussian ? '🧬 Языковая система' : '🧬 Language Family'}
            </span>
            <p className="text-xs font-bold text-white">{info.family}</p>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-4">
            <span className={`text-[10px] uppercase font-black tracking-wider block mb-1 ${
              isEasiest ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {isRussian ? '👥 Носители и регион' : '👥 Speakers & Region'}
            </span>
            <p className="text-xs font-bold text-white">{info.speakers}</p>
          </div>
        </div>

        {/* Writing System */}
        <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 mb-6">
          <span className={`text-[10px] uppercase font-black tracking-wider block mb-1 ${
            isEasiest ? 'text-emerald-400' : 'text-orange-400'
          }`}>
            {isRussian ? '✍️ Письменность и алфавит' : '✍️ Writing System'}
          </span>
          <p className="text-xs font-bold text-gray-200">{info.writingSystem}</p>
        </div>

        {/* Grammar Highlights */}
        <div className="space-y-3 mb-6">
          <h4 className={`text-xs uppercase font-black tracking-wider ${
            isEasiest ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isRussian ? (isEasiest ? '⚡ Почему это самый лёгкий язык: грамматика' : '⚡ Особенности грамматики и сложности') : '⚡ Grammar Highlights'}
          </h4>
          <div className="space-y-2">
            {info.grammarHighlights.map((hl, idx) => (
              <div key={idx} className="flex items-start space-x-3 bg-gray-850/60 border border-gray-750 p-3 rounded-xl">
                <span className={`font-black text-sm ${isEasiest ? 'text-emerald-400' : 'text-orange-400'}`}>•</span>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  {isRussian ? hl.ru : hl.en}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Phrases */}
        <div className="space-y-3 mb-6">
          <h4 className={`text-xs uppercase font-black tracking-wider ${
            isEasiest ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isRussian ? '💬 Примеры фраз на этом языке' : '💬 Sample Phrases'}
          </h4>
          <div className="space-y-2">
            {info.samplePhrases.map((phrase, idx) => (
              <div key={idx} className="bg-black/50 border border-gray-800 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{phrase.orig}</span>
                  {phrase.translit && (
                    <span className="text-[10px] text-gray-400 font-mono italic">[{phrase.translit}]</span>
                  )}
                </div>
                <p className={`text-xs font-medium ${isEasiest ? 'text-emerald-200/90' : 'text-orange-200/90'}`}>
                  {isRussian ? phrase.transRu : phrase.transEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fun Fact */}
        <div className={`border rounded-2xl p-4 mb-8 ${
          isEasiest 
            ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-500/40' 
            : 'bg-gradient-to-r from-orange-950/60 to-purple-950/60 border-orange-500/30'
        }`}>
          <span className={`text-[10px] uppercase font-black tracking-wider block mb-1 ${
            isEasiest ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isRussian ? '💡 Интересный факт' : '💡 Fun Fact'}
          </span>
          <p className="text-xs font-bold text-gray-200 leading-relaxed">
            {isRussian ? info.funFact.ru : info.funFact.en}
          </p>
        </div>

        {/* Action Button: Start Learning */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playSound('select');
              onSelectCourse(course);
              onClose();
            }}
            className={`flex-1 py-4 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 cursor-pointer flex items-center justify-center gap-2 ${
              isEasiest 
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:brightness-110 text-slate-950 border-emerald-700' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 border-orange-700'
            }`}
          >
            <span>🚀</span>
            <span>{isRussian ? `Изучать ${info.localName.split(' ')[0]}` : `Learn ${info.name}`}</span>
          </button>
          
          <button
            type="button"
            onClick={() => { playSound('click'); onClose(); }}
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-xs uppercase tracking-wider rounded-2xl transition-all border-b-2 border-gray-900 cursor-pointer"
          >
            {isRussian ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

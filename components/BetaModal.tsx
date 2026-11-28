import React, { useState } from 'react';
import { UserProgress, Course } from '../types';
import { 
  CloseIcon, 
  ShieldIcon, 
  ActivityIcon, 
  StarIcon, 
  GemStoneIcon, 
  LightningIcon, 
  CheckCircleIcon,
  VolumeIcon
} from './Icons';
import { speakText } from '../services/geminiService';
import { playKlingonSpeech } from '../services/klingonSpeechService';
import { 
  getWorldLockedLanguages, 
  getCisLockedLanguages, 
  AVAILABLE_SWITCH_LANGUAGES,
  isLanguageSwitchLocked,
  getBetaWritingRestrictedCoursesList
} from '../services/languageLockService';
import { SPEAKER_LANGUAGES, getCoursesForSpeaker, getLocalizedCatalogTitle } from '../services/duowindo6601Catalog';

interface BetaModalProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onClose: () => void;
  onOpenAdmin: () => void;
  onOpenSystemInfo: () => void;
  onOpenFeedback: () => void;
  onOpenPoems?: () => void;
  onSelectCourse?: (course: Course) => void;
  onDismissBanner?: () => void;
  onGoToSettingsVersion?: () => void;
  onToggleBetaTesting?: (join: boolean) => void;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak' | string) => void;
  courses?: Course[];
  onAttemptSwitchLanguage?: (langCode: string) => boolean;
  onOpenLanguageLockModal?: (langCode?: string) => void;
}

const DEFAULT_BETA_COURSES: Course[] = [
  { id: 'eo', name: 'Esperanto', localName: 'Эсперанто (Esperanto)', flagCode: 'eu', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default', isBeta: true, betaTag: 'Международный', betaVersion: 'v0.9.4 Beta', betaFeedbackCount: 142, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'la', name: 'Latin', localName: 'Латынь (Lingua Latina)', flagCode: 'it', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default', isBeta: true, betaTag: 'Классический', betaVersion: 'v0.8.2 Beta', betaFeedbackCount: 98, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'sv', name: 'Swedish', localName: 'Шведский (Svenska)', flagCode: 'se', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default', isBeta: true, betaTag: 'Скандинавский', betaVersion: 'v0.9.1 Beta', betaFeedbackCount: 115, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'no', name: 'Norwegian', localName: 'Норвежский (Norsk)', flagCode: 'no', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default', isBeta: true, betaTag: 'Скандинавский', betaVersion: 'v0.9.0 Beta', betaFeedbackCount: 84, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'tt', name: 'Tatar', localName: 'Татарский (Татар теле)', flagCode: 'ru', themeColor: 'bg-teal-600', themeBorder: 'border-teal-800', mascotVariant: 'default', isBeta: true, betaTag: 'Тюркский', betaVersion: 'v0.9.5 Beta', betaFeedbackCount: 230, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'hv', name: 'High Valyrian', localName: 'Высокий валирийский (Valyrio)', flagCode: 'gb', themeColor: 'bg-purple-700', themeBorder: 'border-purple-900', mascotVariant: 'default', isBeta: true, betaTag: 'Вымышленный', betaVersion: 'v0.8.0 Beta', betaFeedbackCount: 76, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' },
  { id: 'tlh', name: 'Klingon', localName: 'Клингонский (tlhIngan Hol)', flagCode: 'us', themeColor: 'bg-stone-700', themeBorder: 'border-stone-900', mascotVariant: 'default', isBeta: true, betaTag: 'Вымышленный', betaVersion: 'v0.7.3 Beta', betaFeedbackCount: 63, writingRestrictionNotice: 'Ограничение: ВидеоЗвонок, Roleplays и речь во время урока отключены; доступно аудио hol.kag.org / SAM и раздел «Письмо»' },
  { id: 'yi', name: 'Yiddish', localName: 'Идиш (ייִדיш)', flagCode: 'il', themeColor: 'bg-indigo-600', themeBorder: 'border-indigo-800', mascotVariant: 'default', isBeta: true, betaTag: 'Германский / Еврейский', betaVersion: 'v0.9.2 Beta', betaFeedbackCount: 91, writingRestrictionNotice: 'Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год' }
];

export const BetaModal: React.FC<BetaModalProps> = ({
  user,
  setUser,
  onClose,
  onOpenAdmin,
  onOpenSystemInfo,
  onOpenFeedback,
  onOpenPoems,
  onSelectCourse,
  onDismissBanner,
  onGoToSettingsVersion,
  onToggleBetaTesting,
  playSound,
  courses = [],
  onAttemptSwitchLanguage,
  onOpenLanguageLockModal
}) => {
  const handleEnableVip = () => {
    playSound('correct');
    setUser(prev => ({
      ...prev,
      subscription: 'max',
      hearts: 5,
      infiniteHearts: true,
      gems: prev.gems + 99999,
      streak: Math.max(prev.streak, 100)
    }));
  };

  const handleAddGems = () => {
    playSound('correct');
    setUser(prev => ({
      ...prev,
      gems: prev.gems + 1000
    }));
  };

  const handleTestTts = async () => {
    playSound('click');
    try {
      await speakText('Добро пожаловать в Бета-Центр DuoWindo6601!', user.language || 'ru');
    } catch {
      playSound('correct');
    }
  };

  const [selectedSpeakerLang, setSelectedSpeakerLang] = useState<string>(user.language || 'ru');

  const betaCoursesToRender = React.useMemo(() => {
    const listFromProps = courses.filter(c => c.isBeta);
    if (listFromProps.length >= DEFAULT_BETA_COURSES.length) {
      return listFromProps;
    }
    const merged = [...listFromProps];
    for (const defCourse of DEFAULT_BETA_COURSES) {
      if (!merged.some(m => m.id === defCourse.id)) {
        merged.push(defCourse);
      }
    }
    return merged;
  }, [courses]);

  const speakerFilteredCatalog = React.useMemo(() => {
    return getCoursesForSpeaker(selectedSpeakerLang);
  }, [selectedSpeakerLang]);

  const handleEnrollBetaCourse = (course: Course) => {
    playSound('correct');
    const alreadyTested = user.betaTestedCourses?.includes(course.id);
    const bonusXp = alreadyTested ? 0 : 50;
    const bonusGems = alreadyTested ? 0 : 20;

    setUser(prev => {
      const currentTested = prev.betaTestedCourses || [];
      const updatedTested = currentTested.includes(course.id) ? currentTested : [...currentTested, course.id];
      return {
        ...prev,
        isBetaTester: true,
        betaTestedCourses: updatedTested,
        xp: prev.xp + bonusXp,
        gems: prev.gems + bonusGems
      };
    });

    if (onSelectCourse) {
      onSelectCourse(course);
    }
  };

  const isRu = user.language !== 'en';
  const isBetaMember = Boolean(user.isBetaTester);

  if (!isBetaMember) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <div className="bg-gradient-to-b from-gray-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label={isRu ? 'Закрыть' : 'Close'}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            <CloseIcon className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-lg">
              🔒
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {isRu ? 'Бета-тестирование не подключено' : 'App Beta Testing Not Joined'}
            </span>
            <h3 className="font-din font-black text-xl sm:text-2xl uppercase tracking-wider text-white">
              {isRu ? 'Функция бета-тестирования недоступна' : 'Beta Testing Feature Unavailable'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 font-semibold leading-relaxed">
              {isRu
                ? 'Вы ещё не присоединились к бета-тестированию приложения DuoWindo6601 Progressive Web App. Кто не присоединился к бета-тестированию — функции бета-тестирования недоступны.'
                : 'You have not joined DuoWindo6601 Progressive Web App Beta Testing yet. Beta testing features are unavailable until you join.'}
            </p>
          </div>

          <div className="bg-black/45 border border-gray-800 rounded-2xl p-4 space-y-2 text-xs text-gray-300 font-semibold">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              {isRu ? 'Заблокировано до присоединения:' : 'Locked until you join:'}
            </p>
            <p>🔒 {isRu ? 'Бета-Центр DuoWindo6601 и панель тестировщика' : 'DuoWindo6601 Beta Center & testing tools'}</p>
            <p>🔒 {isRu ? '8 экспериментальных бета-курсов языков' : '8 experimental beta language courses'}</p>
            <p>🔒 {isRu ? 'Ранний канал обновлений DuoWindo6601 PWA Beta' : 'Early DuoWindo6601 PWA Beta update channel'}</p>
          </div>

          <div className="bg-indigo-950/50 border border-indigo-500/40 rounded-2xl p-3.5 text-xs text-indigo-200 font-bold leading-relaxed">
            💡 {isRu
              ? 'Откройте Настройки → раздел «Версия Приложения DuoWindo6601» и нажмите «Присоединиться к бета-тестированию».'
              : 'Open Settings → "DuoWindo6601 App Version" and tap "Join App Beta Testing".'}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {onGoToSettingsVersion && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onGoToSettingsVersion();
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider border-b-4 border-indigo-950 active:border-b-0 active:translate-y-0.5 transition-all shadow-lg cursor-pointer text-center"
              >
                ⚙️ {isRu ? 'Настройки → Версия Приложения' : 'Settings → App Version'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="py-3 px-5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider border border-gray-700 transition-all cursor-pointer"
            >
              {isRu ? 'Закрыть' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-slate-950 border-2 border-purple-500/50 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar relative">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-purple-500/30 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg ring-2 ring-purple-400/40">
              🧪
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-din font-black text-xl md:text-2xl text-white tracking-wider uppercase">
                  DuoWindo6601 Бета-Центр
                </h3>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Beta v6601
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                Панель управления тестированием, диагностикой и функциями приложения
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Current Status Bar */}
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-gray-300">
              Статус подписки: <strong className="text-amber-400 uppercase">{user.subscription}</strong>
            </span>
            <span className="text-gray-500">|</span>
            <span className="font-bold text-gray-300">
              Кристаллы: <strong className="text-duo-blue">{user.gems} 💎</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {user.isBetaTester && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black text-[10px] uppercase">
                ✅ Бета-тестер ({user.betaTestedCourses?.length || 1} курсов)
              </span>
            )}
            <span className="font-bold text-gray-300">
              Язык: <strong className="text-emerald-400 uppercase">{user.language}</strong>
            </span>
          </div>
        </div>

        {/* SECTION: BETA TESTING LANGUAGE COURSES (TEST BENCH) */}
        <div className="bg-gradient-to-br from-purple-950/70 via-indigo-950/50 to-gray-900 border-2 border-purple-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/30 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl animate-pulse">🧪</span>
              <div>
                <h4 className="font-din font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Бета-тестирование языковых курсов</span>
                  <span className="bg-purple-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    8 курсов
                  </span>
                </h4>
                <p className="text-[11px] text-purple-200/80 font-medium">
                  Выберите курс для проверки уроков, словаря и генерации упражнений (+50 XP тестеру)
                </p>
              </div>
            </div>
            <button
              onClick={onOpenFeedback}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>⭐ Отзыв по курсу</span>
            </button>
          </div>

          {/* SPEAKER LANGUAGE SELECTOR: "Курсы для тех, кто говорит по..." */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>🗣️</span>
                <span>{user.language !== 'en' ? 'Курсы для тех, кто говорит по:' : 'Courses for those who speak:'}</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                {speakerFilteredCatalog.length} направлений
              </span>
            </div>
            <select
              value={selectedSpeakerLang}
              onChange={(e) => {
                const code = e.target.value;
                if (isLanguageSwitchLocked(code)) {
                  playSound('wrong');
                  if (onOpenLanguageLockModal) {
                    onOpenLanguageLockModal(code);
                  }
                  return;
                }
                playSound('click');
                setSelectedSpeakerLang(code);
                const mappedLang = code === 'zs' ? 'zh' : code;
                setUser(prev => ({
                  ...prev,
                  language: mappedLang as any
                }));
              }}
              className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
            >
              <optgroup label="✨ Сейчас доступны для переключения:">
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇺🇸 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="zs">🇨🇳 中文</option>
                <option value="ar">🇸🇦 العربية</option>
              </optgroup>
              <optgroup label="✨ Дополнительные языки мира — Полностью доступны:">
                <option value="pt">Português (Португальский)</option>
                <option value="it">Italiano (Итальянский)</option>
                <option value="tr">Türkçe (Турецкий)</option>
                <option value="ko">한국어 (Корейский)</option>
                <option value="hi">हिन्दी (Хинди)</option>
                <option value="pl">Polski (Польский)</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="bn">বাংলা (Бенгальский)</option>
                <option value="th">ไทย (Тайский)</option>
                <option value="vi">Tiếng Việt (Вьетнамский)</option>
              </optgroup>
              <optgroup label="✨ Языки СНГ — Раздел Письмо и уроки полностью доступны:">
                <option value="kk">Казахстан (Қазақша) — (казахский) 🇰🇿</option>
                <option value="uz">Узбекистан (Oʻzbekcha) — (узбекский) 🇺🇿</option>
                <option value="hy">Армения (Հայերեն) — (армянский) 🇦🇲</option>
                <option value="ka">Грузия (ქართული) — (грузинский) 🇬🇪</option>
                <option value="az">Азербайджан (Azərbaycan) — (азербайджанский) 🇦🇿</option>
              </optgroup>
              <optgroup label="🎉 Бета Курс Язык — Сняты все ограничения (Раздел Письмо полностью открыт):">
                <option value="eo">Эсперанто (Esperanto) — v1.0 Официальный</option>
                <option value="la">Латынь (Lingua Latina) — v0.8.2 Beta</option>
                <option value="sv">Шведский (Svenska) — v0.9.1 Beta</option>
                <option value="no">Норвежский (Norsk) — v0.9.0 Beta</option>
                <option value="tt">Татарский (Татар теле) — v0.9.5 Beta</option>
                <option value="hv">Высокий валирийский (Valyrio) — v0.8.0 Beta</option>
                <option value="tlh">Клингонский (tlhIngan Hol) — v0.7.3 Beta (Шрифт Klingon Font)</option>
                <option value="yi">Идиш (ייִдиш) — v0.9.2 Beta</option>
              </optgroup>
            </select>

            {speakerFilteredCatalog.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto no-scrollbar">
                {speakerFilteredCatalog.slice(0, 8).map(item => (
                  <span key={item.itemId} className="text-[10px] bg-purple-900/50 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-lg font-bold">
                    {getLocalizedCatalogTitle(item, user.language)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto no-scrollbar pr-1">
            {betaCoursesToRender.map(course => {
              const isTested = user.betaTestedCourses?.includes(course.id);
              return (
                <div
                  key={course.id}
                  className="p-3 bg-gray-850/90 hover:bg-gray-800 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl flex flex-col justify-between transition-all group shadow-md"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={`https://flagcdn.com/w80/${course.flagCode}.png`}
                      className="w-10 h-7 rounded-md object-cover shadow group-hover:scale-105 transition-transform shrink-0"
                      alt={course.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-sm text-white truncate">
                          {course.localName || course.name}
                        </span>
                        {isTested && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-black border border-emerald-500/40 shrink-0">
                            ✓ Тестирован
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold">
                        <span className="text-purple-300 font-mono">{course.betaVersion || 'Beta'}</span>
                        <span>•</span>
                        <span className="text-amber-300">{course.betaTag}</span>
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-300 font-bold flex items-center gap-1">
                        <span>🔒</span>
                        <span className="truncate">Ограничение раздел письма будут доступ до 1 ноября 2026 год</span>
                      </div>
                      {course.id === 'tlh' && (
                        <div className="mt-1 space-y-1">
                          <div className="px-2 py-0.5 rounded-lg bg-purple-900/40 border border-purple-500/40 text-[9px] text-purple-200 font-bold flex items-center justify-between">
                            <span className="font-klingon text-xs">tlhIngan Hol</span>
                            <span className="text-[8px] text-purple-300">Шрифт Klingon Font</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void playKlingonSpeech('nuqneH', false, 'hol');
                              }}
                              className="flex-1 px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-[9px] text-sky-300 hover:text-white font-bold flex items-center justify-between hover:bg-sky-900/60 transition-colors cursor-pointer"
                            >
                              <span>🎧 hol.kag.org (nuqneH)</span>
                              <span className="text-[8px]">▶</span>
                            </button>
                            <a
                              href="https://hol.kag.org/sentence/nuqneH"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-[9px] text-indigo-300 hover:text-white font-bold hover:bg-indigo-900/60 transition-colors"
                              title="https://hol.kag.org/sentence/nuqneH"
                            >
                              ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-750">
                    <button
                      type="button"
                      onClick={() => handleEnrollBetaCourse(course)}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer text-center active:scale-95"
                    >
                      {isTested ? 'Учить курс →' : 'Тестировать (+50 XP)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click');
                        onOpenFeedback();
                      }}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl border border-gray-700 text-xs font-bold cursor-pointer transition-colors"
                      title="Баг-репорт курса"
                    >
                      🐞
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testing Actions Grid */}
        <div className="space-y-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-purple-300 flex items-center space-x-2">
            <LightningIcon className="w-4 h-4 text-purple-400" />
            <span>Инструменты и функции для тестов</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Enable MAX VIP */}
            <button
              onClick={handleEnableVip}
              className="p-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/40 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-purple-950 rounded-xl border border-purple-500/30">
                👑
              </div>
              <div>
                <span className="font-black text-sm block text-purple-200 group-hover:text-white">
                  Активировать MAX VIP
                </span>
                <span className="text-[11px] text-gray-300 font-medium block mt-0.5">
                  Бесконечные жизни, 99k кристаллов и максимальный доступ
                </span>
              </div>
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={onOpenAdmin}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-purple-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🛠️
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Панель Управления (Admin)
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Управление базой данных, курсами и логами систем
                </span>
              </div>
            </button>

            {/* System & OS Compatibility */}
            <button
              onClick={onOpenSystemInfo}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-duo-blue/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🌐
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Проверка Браузера & ОС
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Тест Android, macOS, Linux, Windows и Браузеров
                </span>
              </div>
            </button>

            {/* Feedback & Reviews */}
            <button
              onClick={onOpenFeedback}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-amber-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                ⭐
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Отзывы и Тест-Репорты
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Просмотр сообщений от пользователей и отправка отзывов
                </span>
              </div>
            </button>

            {/* Test AI Voice / TTS */}
            <button
              onClick={handleTestTts}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-emerald-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🔊
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white flex items-center gap-1.5">
                  <span>Тест AI Озвучки</span>
                  <VolumeIcon className="w-4 h-4 text-emerald-400" />
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Проверить работу речи и аудиосинтезатора
                </span>
              </div>
            </button>

            {/* Add 1000 Gems */}
            <button
              onClick={handleAddGems}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-duo-yellow/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                💎
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  +1000 Кристаллов
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Пополнить баланс гемов для тестовых покупок
                </span>
              </div>
            </button>

            {/* Quick Theme Switcher */}
            <button
              onClick={() => {
                playSound('click');
                const isCurrentLight = user.theme === 'light' || (!user.theme && user.nightMode === false);
                const nextTheme = isCurrentLight ? 'dark' : 'light';
                setUser(prev => ({
                  ...prev,
                  theme: nextTheme,
                  nightMode: nextTheme === 'dark'
                }));
              }}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-amber-400/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3 cursor-pointer"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                {user.theme === 'light' || (!user.theme && user.nightMode === false) ? '☀️' : '🌙'}
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  {user.theme === 'light' || (!user.theme && user.nightMode === false) ? 'Тема: Светлая (Клик для Тёмной)' : 'Тема: Тёмная (Клик для Светлой)'}
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Быстрое переключение оформления интерфейса
                </span>
              </div>
            </button>

            {/* Poetry by Heart Trainer */}
            {onOpenPoems && (
              <button
                onClick={onOpenPoems}
                className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-900/60 hover:from-purple-850 hover:to-indigo-850 border border-purple-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3 cursor-pointer sm:col-span-2"
              >
                <div className="text-2xl p-2 bg-purple-950 rounded-xl border border-purple-400/40">
                  📜
                </div>
                <div>
                  <span className="font-black text-sm block text-purple-200 group-hover:text-white flex items-center gap-1.5">
                    <span>Выучить стихотворение наизусть</span>
                    <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase font-black">NEW</span>
                  </span>
                  <span className="text-[11px] text-gray-300 font-medium block mt-0.5">
                    Поэтический тренажёр: исчезающие слова, ритм, озвучка и проверка рецитации (+35 XP)
                  </span>
                </div>
              </button>
            )}

          </div>
        </div>

        {/* Beta Testing: Language Courses & Country Language Switcher */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-black text-xs uppercase tracking-wider text-purple-300 flex items-center space-x-2">
              <span>🌐</span>
              <span>Бета тестирование: Курс Язык & Переключить язык стран</span>
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              🔒 15 заблокировано до 1 ноября 2026 г.
            </span>
          </div>

          {/* Available Languages */}
          <div className="p-3 bg-sky-950/20 border border-sky-500/30 rounded-2xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block mb-2">
              ✨ Сейчас доступны для переключения:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SWITCH_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    playSound('click');
                    if (onAttemptSwitchLanguage) {
                      onAttemptSwitchLanguage(lang.code);
                    } else {
                      setUser(prev => ({ ...prev, language: lang.code as any }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    user.language === lang.code
                      ? 'bg-sky-500 text-black border-sky-300 shadow-md ring-2 ring-sky-400/50'
                      : 'bg-gray-800/90 hover:bg-gray-700 text-gray-200 border-gray-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Locked World Languages (10) */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>🌍</span>
                <span>Заблокированные языки мира (10):</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400">🔒 до 1 ноября 2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getWorldLockedLanguages().map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    playSound('select');
                    if (onAttemptSwitchLanguage) {
                      onAttemptSwitchLanguage(item.code);
                    }
                  }}
                  className="p-2.5 rounded-xl border border-emerald-500/30 bg-black/40 hover:bg-emerald-950/40 text-gray-200 hover:text-emerald-200 transition-all text-xs flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-base select-none shrink-0">{item.flagEmoji}</span>
                    <div className="truncate">
                      <div className="font-bold text-[11px] text-white group-hover:text-emerald-200 truncate">
                        {item.nameRu}
                      </div>
                      <div className="text-[9px] text-emerald-300/80 font-medium truncate">
                        {item.nativeName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 shrink-0 ml-1">✅</span>
                </button>
              ))}
            </div>
          </div>

          {/* CIS Countries List & Letters Section (5) */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-500/40 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 pb-1.5 border-b border-emerald-500/20">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span>🌍</span>
                <span>Языки мира и стран СНГ (5)</span>
              </span>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md self-start sm:self-auto">
                ✅ Раздел «Письмо» открыт (1 ноября 2026 г.)
              </span>
            </div>

            <div className="space-y-1.5">
              {getCisLockedLanguages().map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    playSound('select');
                    if (onAttemptSwitchLanguage) {
                      onAttemptSwitchLanguage(item.code);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-emerald-500/30 bg-black/50 hover:bg-emerald-950/50 text-gray-200 hover:text-emerald-200 transition-all text-xs flex items-center justify-between cursor-pointer group text-left"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-base select-none shrink-0">{item.flagEmoji}</span>
                    <div className="truncate">
                      <div className="font-bold text-[11px] text-emerald-100 group-hover:text-white truncate">
                        ✨ {item.fullLabelRu || `${item.nameRu} — (${item.nativeName})`}
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium">
                        ✅ Раздел «Письмо» открыт 1 ноября 2026 год
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 shrink-0 ml-1">✅</span>
                </button>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onClose();
                  onOpenFeedback();
                }}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold text-[11px] uppercase tracking-wider rounded-xl border border-amber-500/30 shadow cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>💬</span>
                <span>Отзывы: Заблокированные и доступные языки</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  if (onOpenLanguageLockModal) {
                    onOpenLanguageLockModal();
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-[11px] uppercase tracking-wider rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>ПОНЯТНО</span>
                <span>🔒</span>
              </button>
            </div>
          </div>

          {/* Dedicated Section: Бета Курс Язык — Снятие бета-ограничений */}
          <div className="p-4 bg-gradient-to-br from-emerald-950/40 via-purple-950/40 to-black/80 border-2 border-emerald-500/50 rounded-2xl space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-emerald-500/30">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎉</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-200">
                  Бета Курс Язык: Снятие бета-ограничений выполнено!
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shrink-0">
                🎉 Раздел Письмо и Уроки Открыты
              </span>
            </div>

            <p className="text-[11px] text-gray-200 font-medium leading-relaxed">
              Все бета-ограничения успешно сняты! Для всех курсов и языков мира доступно изучение слов, грамматики, озвучка и интерактивный раздел написания букв и прописей.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getBetaWritingRestrictedCoursesList().map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30 text-gray-200 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <img
                        src={`https://flagcdn.com/w80/${item.flagCode}.png`}
                        className="w-7 h-5 rounded object-cover shadow shrink-0"
                        alt={item.name}
                      />
                      <span className="font-black text-xs text-white truncate">
                        {item.localName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-900/60 border border-purple-500/40 px-1.5 py-0.2 rounded shrink-0">
                      {item.version}
                    </span>
                  </div>

                  <div className="mt-1.5 text-[9px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                    <span>🔒</span>
                    <span className="truncate">{item.restrictionNotice}</span>
                  </div>

                  {item.id === 'tlh' && (
                    <div className="mt-1 space-y-1">
                      <div className="text-[9px] text-emerald-300 font-bold bg-emerald-950/40 border border-emerald-500/40 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span className="font-klingon text-sm">tlhIngan Hol</span>
                        <span className="text-[8px] text-emerald-400">Шрифт Klingon Font активирован</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void playKlingonSpeech('nuqneH', false, 'hol');
                          }}
                          className="flex-1 text-[9px] text-sky-300 hover:text-white font-bold bg-sky-950/60 border border-sky-500/40 px-2 py-1 rounded-lg flex items-center justify-between hover:bg-sky-900/60 transition-colors cursor-pointer"
                        >
                          <span>🎧 hol.kag.org (nuqneH)</span>
                          <span className="text-[8px]">▶</span>
                        </button>
                        <a
                          href="https://hol.kag.org/sentence/nuqneH"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-indigo-300 hover:text-white font-bold bg-indigo-950/60 border border-indigo-500/40 px-2 py-1 rounded-lg hover:bg-indigo-900/60 transition-colors"
                          title="https://hol.kag.org/sentence/nuqneH"
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Footer Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            {onToggleBetaTesting && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onToggleBetaTesting(false);
                  onClose();
                }}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                {isRu ? '🚪 Выйти из бета-тестирования' : '🚪 Leave Beta Testing'}
              </button>
            )}
            {onDismissBanner && (
              <button
                type="button"
                onClick={onDismissBanner}
                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                {isRu ? 'Скрыть баннер бета-тестирования' : 'Hide Beta Banner'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {isRu ? 'Закрыть Бета-Центр' : 'Close Beta Center'}
          </button>
        </div>

      </div>
    </div>
  );
};

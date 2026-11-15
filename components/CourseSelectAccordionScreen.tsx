import React, { useState, useMemo } from 'react';
import { Mascot } from './Mascot';
import { 
  SPEAKER_LANGUAGES_31, 
  SpeakerLanguageOption, 
  NON_LANGUAGE_COURSES, 
  NonLanguageCourse, 
  getCoursesForSpeaker,
  getLocalizedCatalogTitle,
  getLocalizedLanguageName,
  DuoWindo6601CatalogItem
} from '../services/duowindo6601Catalog';
import { Course, SupportedAppLanguage } from '../types';

interface CourseSelectAccordionScreenProps {
  currentCourse: Course;
  allCourses: Course[];
  userLanguage: SupportedAppLanguage | string;
  onSelectCourse: (course: Course) => void;
  onSwitchLanguage?: (langCode: SupportedAppLanguage) => void;
  onClose: () => void;
  playSound: (type: 'click' | 'select' | 'correct' | 'wrong' | 'streak') => void;
  onOpenClassicCatalog?: () => void;
}

export const CourseSelectAccordionScreen: React.FC<CourseSelectAccordionScreenProps> = ({
  currentCourse,
  allCourses,
  userLanguage,
  onSelectCourse,
  onSwitchLanguage,
  onClose,
  playSound,
  onOpenClassicCatalog
}) => {
  // Accordion open/close states
  // 'new' is the "Новые курсы" section, or language code like 'ru', 'en', 'uk'
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    new: true,
    ru: false,
    uk: false,
    en: false
  });

  // Active sub-tab inside "Новые курсы" and each language accordion: 'languages' or 'non-language'
  const [newCoursesSubtab, setNewCoursesSubtab] = useState<'languages' | 'non_languages'>('languages');
  const [sectionSubtabs, setSectionSubtabs] = useState<Record<string, 'languages' | 'non_languages'>>({});

  // Pending selected course before clicking "ПРОДОЛЖИТЬ"
  const [selectedCourseCandidate, setSelectedCourseCandidate] = useState<Course>(currentCourse);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirmation dialog modal state when choosing course from another base language
  const [pendingSwitchSpeaker, setPendingSwitchSpeaker] = useState<{
    speaker: SpeakerLanguageOption;
    targetCourse: Course;
  } | null>(null);

  const toggleSection = (key: string) => {
    playSound('click');
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSectionSubtab = (sectionKey: string): 'languages' | 'non_languages' => {
    return sectionSubtabs[sectionKey] || 'languages';
  };

  const setSectionSubtab = (sectionKey: string, tab: 'languages' | 'non_languages') => {
    playSound('click');
    setSectionSubtabs(prev => ({
      ...prev,
      [sectionKey]: tab
    }));
  };

  // Convert non-language course item to Course type
  const nonLanguageToCourse = (item: NonLanguageCourse): Course => {
    const existing = allCourses.find(c => c.id === item.id);
    if (existing) return existing;
    return {
      id: item.id,
      name: item.name,
      localName: userLanguage === 'ru' ? item.localNameRu : item.localNameEn,
      flagCode: item.id,
      themeColor: item.themeColor,
      themeBorder: item.themeBorder,
      mascotVariant: item.mascotVariant
    };
  };

  // Convert catalog item to Course type
  const catalogItemToCourse = (item: DuoWindo6601CatalogItem): Course => {
    const existing = allCourses.find(c => c.id === item.learningLanguage);
    if (existing) return existing;
    return {
      id: item.learningLanguage,
      name: item.learningLanguageName,
      localName: item.title,
      flagCode: item.flagCode,
      themeColor: 'bg-duo-blue',
      themeBorder: 'border-duo-blueDark',
      mascotVariant: 'default'
    };
  };

  // Programming course as a non-language discipline: "Курс «Программирование (Курс не является языком • Навык/Игра)» относится к разделу «Предметы & Игры» (не языковой курс). В данном предмете нет алфавита или букв."
  const programmingCourseObj: Course = useMemo(() => {
    const existing = allCourses.find(c => c.id === 'coding');
    if (existing) {
      return {
        ...existing,
        localName: userLanguage === 'ru' 
          ? 'Программирование (Курс не является языком • Навык/Игра)'
          : 'Programming (Non-language course • Skill/Game)'
      };
    }
    return {
      id: 'coding',
      name: 'Programming',
      localName: userLanguage === 'ru' 
        ? 'Программирование (Курс не является языком • Навык/Игра)'
        : 'Programming (Non-language course • Skill/Game)',
      flagCode: 'coding',
      themeColor: 'bg-indigo-600',
      themeBorder: 'border-indigo-800',
      mascotVariant: 'default'
    };
  }, [allCourses, userLanguage]);

  // User clicked a course in the accordion
  const handleCourseClick = (course: Course, speaker?: SpeakerLanguageOption) => {
    // User requirement: "Для знающих переключить язык здесь тут не должно быть на английский и русской"
    // Russian ('ru') and English ('en') must NEVER trigger the language switch dialog!
    const isRuOrEn = speaker?.code === 'ru' || speaker?.code === 'en';

    // If speaker is provided and is NOT Russian and NOT English, and is DIFFERENT from user's current app language
    if (speaker && !isRuOrEn && speaker.code !== userLanguage) {
      playSound('select');
      setPendingSwitchSpeaker({
        speaker,
        targetCourse: course
      });
      return;
    }

    // Otherwise, select candidate directly without any confirmation dialog
    playSound('select');
    setSelectedCourseCandidate(course);
  };

  // User confirms switching base language in the Duolingo dialog
  const handleConfirmLanguageSwitch = () => {
    if (!pendingSwitchSpeaker) return;
    playSound('correct');

    const { speaker, targetCourse } = pendingSwitchSpeaker;

    // Switch app interface language
    if (onSwitchLanguage) {
      onSwitchLanguage(speaker.code as SupportedAppLanguage);
    }

    // Set candidate course
    setSelectedCourseCandidate(targetCourse);
    setPendingSwitchSpeaker(null);
  };

  const handleCancelLanguageSwitch = () => {
    playSound('click');
    setPendingSwitchSpeaker(null);
  };

  // User clicks bottom "ПРОДОЛЖИТЬ" button
  const handleContinue = () => {
    if (!selectedCourseCandidate) return;
    playSound('select');
    onSelectCourse(selectedCourseCandidate);
  };

  // New language courses curated list: includes Programming as a language course
  const trendingLanguageCourses: Course[] = useMemo(() => {
    const topIds = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'it', 'ko', 'ar', 'tr', 'eo', 'ka', 'sv', 'la'];
    const list: Course[] = [programmingCourseObj];
    topIds.forEach(id => {
      const match = allCourses.find(c => c.id === id);
      if (match && match.id !== 'coding') list.push(match);
    });
    return list;
  }, [allCourses, programmingCourseObj]);


  // Filtered speaker languages based on search query
  const filteredSpeakers = useMemo(() => {
    if (!searchQuery.trim()) return SPEAKER_LANGUAGES_31;
    const q = searchQuery.toLowerCase().trim();
    return SPEAKER_LANGUAGES_31.filter(sp => 
      sp.name.toLowerCase().includes(q) ||
      sp.englishName.toLowerCase().includes(q) ||
      (sp.ruGenitive && sp.ruGenitive.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const speechBubbleText = userLanguage === 'ru' 
    ? 'Что вы хотите изучать?' 
    : userLanguage === 'uk'
    ? 'Що ви хочете вивчати?'
    : 'What would you like to learn?';

  const isCandidateSelected = Boolean(selectedCourseCandidate);

  return (
    <div className="fixed inset-0 z-[100] bg-[#131f24] text-white overflow-y-auto flex flex-col font-sans select-none">
      {/* TOP HEADER BAR */}
      <div className="sticky top-0 z-30 bg-[#131f24]/95 backdrop-blur-md px-4 py-3 border-b border-gray-800/80 flex items-center justify-between max-w-4xl w-full mx-auto">
        <button
          type="button"
          onClick={() => { playSound('click'); onClose(); }}
          className="w-10 h-10 rounded-2xl bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xl font-bold"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center space-x-2">
          {onOpenClassicCatalog && (
            <button
              type="button"
              onClick={() => { playSound('click'); onOpenClassicCatalog(); }}
              className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-sky-400 border border-sky-500/30 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>🌐</span>
              <span>{userLanguage === 'ru' ? 'Каталог' : 'Catalog'}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-28">
        {/* MASCOT & SPEECH BUBBLE (Exact match to screenshot) */}
        <div className="flex items-center space-x-3 mb-6 animate-in fade-in slide-in-from-top-2">
          {/* Owl mascot reading book with react atom */}
          <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 relative">
            <Mascot emotion="neutral" variant="default" className="w-full h-full" />
          </div>

          {/* Speech bubble */}
          <div className="relative bg-[#1f2937] border-2 border-gray-700/80 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-xl max-w-xs">
            {/* Bubble pointer triangle */}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#1f2937]" />
            <p className="text-white font-black text-sm sm:text-base leading-tight">
              {speechBubbleText}
            </p>
          </div>
        </div>

        {/* SEARCH BAR (Optional helpful accessory) */}
        <div className="mb-5 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={userLanguage === 'ru' ? 'Поиск курса или языка...' : 'Search course or language...'}
            className="w-full bg-[#1a252b] border-2 border-gray-700/70 focus:border-sky-500 rounded-2xl px-4 py-2.5 text-sm font-bold text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-xs text-gray-400 hover:text-white font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* ACCORDION LIST */}
        <div className="space-y-3">
          {/* 1. "НОВЫЕ КУРСЫ" (NEW COURSES) SECTION */}
          {!searchQuery && (
            <div className="border-2 border-gray-800 bg-[#162127] rounded-2xl overflow-hidden transition-all shadow-md">
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection('new')}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">✨</span>
                  <span className="font-black text-base sm:text-lg text-white tracking-wide">
                    {userLanguage === 'ru' ? 'Новые курсы' : userLanguage === 'uk' ? 'Нові курси' : 'New courses'}
                  </span>
                </div>
                <span className="text-gray-400 font-bold text-sm transform transition-transform duration-200">
                  {openSections['new'] ? '▲' : '▼'}
                </span>
              </button>

              {/* Accordion Body */}
              {openSections['new'] && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-800/60 animate-in fade-in duration-150">
                  {/* TABS: КУРС ЯЗЫК VS КУРС НЕ ЯЗЫК */}
                  <div className="flex items-center space-x-2 mb-4 bg-[#11191d] p-1 rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => { playSound('click'); setNewCoursesSubtab('languages'); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        newCoursesSubtab === 'languages'
                          ? 'bg-duo-blue text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>🌐</span>
                      <span>{userLanguage === 'ru' ? 'Курс Язык' : userLanguage === 'uk' ? 'Курс Мова' : 'Language Courses'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { playSound('click'); setNewCoursesSubtab('non_languages'); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        newCoursesSubtab === 'non_languages'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>🧩</span>
                      <span>{userLanguage === 'ru' ? 'Курс не язык' : userLanguage === 'uk' ? 'Курс не мова' : 'Non-Language Courses'}</span>
                    </button>
                  </div>

                  {/* SUBTAB 1: КУРСЫ ЯЗЫКОВ */}
                  {newCoursesSubtab === 'languages' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {trendingLanguageCourses.map(course => {
                        const isSelected = selectedCourseCandidate?.id === course.id;
                        const isCoding = course.id === 'coding';
                        return (
                          <div
                            key={course.id}
                            onClick={() => handleCourseClick(course)}
                            className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                              isSelected
                                ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                                : 'bg-[#1b262d] border-gray-700/80 hover:border-gray-600 hover:bg-[#202d35]'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              {isCoding ? (
                                <div className="w-10 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-mono text-base font-black shadow shrink-0">
                                  &lt;/&gt;
                                </div>
                              ) : (
                                <img
                                  src={`https://flagcdn.com/w80/${course.flagCode}.png`}
                                  className="w-10 h-7 rounded-md object-cover shadow border border-white/10 shrink-0"
                                  alt={course.name}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <h4 className="font-black text-sm text-white truncate">
                                    {isCoding 
                                      ? (userLanguage === 'ru' ? 'Программирование (Курс не является языком • Навык/Игра)' : 'Programming (Non-language course • Skill/Game)')
                                      : (course.localName || course.name)}
                                  </h4>
                                  {isCoding && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                      {userLanguage === 'ru' ? 'Не язык' : 'Not a language'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-bold truncate">
                                  {isCoding 
                                    ? (userLanguage === 'ru' ? 'Предметы & Игры (не языковой курс) • Без алфавита и букв' : 'Subjects & Games (non-language) • No alphabet or letters')
                                    : course.name}
                                </p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                              isSelected ? 'bg-duo-green border-duo-green text-white' : 'border-gray-600'
                            }`}>
                              {isSelected && <span className="text-xs font-black">✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SUBTAB 2: КУРСЫ НЕ ЯЗЫК (MATH, MUSIC, CHESS, ART) */}
                  {newCoursesSubtab === 'non_languages' && (
                    <div className="space-y-2.5">
                      <div className="text-[11px] text-amber-300/90 font-bold px-1">
                        {userLanguage === 'ru' 
                          ? '💡 Неязыковые предметы DuoWindo6601: Программирование, Математика, Музыка, Шахматы и Рисование!' 
                          : '💡 Non-language disciplines in DuoWindo6601: Programming, Math, Music, Chess, and Art!'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {NON_LANGUAGE_COURSES.map(item => {
                          const courseObj = nonLanguageToCourse(item);
                          const isSelected = selectedCourseCandidate?.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleCourseClick(courseObj)}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between cursor-pointer group ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                                  : 'bg-[#1b262d] border-gray-700/80 hover:border-gray-600 hover:bg-[#202d35]'
                              }`}
                            >
                              <div className="flex items-start space-x-3 min-w-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black ${item.themeColor} text-white shadow-md shrink-0`}>
                                  {item.symbol}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-black text-sm text-white truncate">
                                      {userLanguage === 'ru' ? item.localNameRu : item.localNameEn}
                                    </h4>
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {userLanguage === 'ru' ? item.tagRu : item.tagEn}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-medium line-clamp-2 mt-0.5">
                                    {userLanguage === 'ru' ? item.descriptionRu : item.descriptionEn}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 mt-1 ${
                                isSelected ? 'bg-duo-green border-duo-green text-white' : 'border-gray-600'
                              }`}>
                                {isSelected && <span className="text-xs font-black">✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. THE 31 "ДЛЯ ЗНАЮЩИХ [ЯЗЫК]" SECTIONS */}
          {filteredSpeakers.map(speaker => {
            const sectionKey = speaker.code;
            const isOpen = openSections[sectionKey];
            const coursesForThisSpeaker = getCoursesForSpeaker(speaker.code);
            const activeSubtab = getSectionSubtab(sectionKey);

            // Russian accusative / genitive for label: "Для знающих русский"
            const labelText = userLanguage === 'ru'
              ? `Для знающих ${speaker.ruGenitive || speaker.name.toLowerCase()}`
              : userLanguage === 'uk'
              ? `Для знавців ${speaker.name.toLowerCase()}`
              : `For ${speaker.englishName} speakers`;

            return (
              <div 
                key={speaker.code}
                className="border-2 border-gray-800 bg-[#162127] rounded-2xl overflow-hidden transition-all shadow-md"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://flagcdn.com/w40/${speaker.flagCode}.png`} 
                      className="w-6 h-4 rounded-sm object-cover shadow"
                      alt={speaker.name}
                    />
                    <span className="font-black text-base sm:text-lg text-white tracking-wide">
                      {labelText}
                    </span>
                    {speaker.code === userLanguage && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {userLanguage === 'ru' ? 'Текущий' : 'Current'}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 font-bold text-sm transform transition-transform duration-200">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-800/60 animate-in fade-in duration-150">
                    {/* Subtabs inside this language: "Курсы языков" vs "Курсы не язык" */}
                    <div className="flex items-center space-x-2 mb-3.5 bg-[#11191d] p-1 rounded-xl border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setSectionSubtab(sectionKey, 'languages')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          activeSubtab === 'languages'
                            ? 'bg-duo-blue text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>🌐</span>
                        <span>{userLanguage === 'ru' ? 'Курсы языков' : 'Language Courses'}</span>
                        <span className="text-[10px] opacity-75">({coursesForThisSpeaker.length + 1})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionSubtab(sectionKey, 'non_languages')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          activeSubtab === 'non_languages'
                            ? 'bg-amber-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>🧩</span>
                        <span>{userLanguage === 'ru' ? 'Курсы не язык' : 'Non-Language Courses'}</span>
                        <span className="text-[10px] opacity-75">({NON_LANGUAGE_COURSES.length})</span>
                      </button>
                    </div>


                    {/* TAB 1: LANGUAGE COURSES FOR THIS SPEAKER */}
                    {activeSubtab === 'languages' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Programming as a Language Course */}
                        {(() => {
                          const isSelected = selectedCourseCandidate?.id === programmingCourseObj.id;
                          return (
                            <div
                              onClick={() => handleCourseClick(programmingCourseObj, speaker)}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                                isSelected
                                  ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                                  : 'bg-[#1b262d] border-gray-700/80 hover:border-gray-600 hover:bg-[#202d35]'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-mono text-base font-black shadow shrink-0">
                                  &lt;/&gt;
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                    <h4 className="font-black text-sm text-white truncate">
                                      {userLanguage === 'ru' ? 'Программирование' : 'Programming'}
                                    </h4>
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                      {userLanguage === 'ru' ? 'Не язык' : 'Not a language'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-bold truncate">
                                    {userLanguage === 'ru' ? 'Курс не язык является языком программирования • Алгоритмы' : 'Non-language course: Programming language • Algorithms'}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                                isSelected ? 'bg-duo-green border-duo-green text-white' : 'border-gray-600'
                              }`}>
                                {isSelected && <span className="text-xs font-black">✓</span>}
                              </div>
                            </div>
                          );
                        })()}
                        {coursesForThisSpeaker.map(item => {
                          const courseObj = catalogItemToCourse(item);
                          const isSelected = selectedCourseCandidate?.id === courseObj.id;
                          return (
                            <div
                              key={item.itemId}
                              onClick={() => handleCourseClick(courseObj, speaker)}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                                isSelected
                                  ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                                  : 'bg-[#1b262d] border-gray-700/80 hover:border-gray-600 hover:bg-[#202d35]'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={`https://flagcdn.com/w80/${item.flagCode}.png`}
                                  className="w-10 h-7 rounded-md object-cover shadow border border-white/10 shrink-0"
                                  alt={item.learningLanguageName}
                                />
                                <div className="min-w-0">
                                  <h4 className="font-black text-sm text-white truncate">
                                    {getLocalizedCatalogTitle(item, userLanguage)}
                                  </h4>
                                  <p className="text-[11px] text-sky-300 font-bold truncate">
                                    {getLocalizedLanguageName(item.learningLanguageName, userLanguage)}
                                    {item.numLearners > 0 && ` • ${(item.numLearners / 1000000).toFixed(1)}M`}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                                isSelected ? 'bg-duo-green border-duo-green text-white' : 'border-gray-600'
                              }`}>
                                {isSelected && <span className="text-xs font-black">✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TAB 2: NON-LANGUAGE COURSES FOR THIS SPEAKER */}
                    {activeSubtab === 'non_languages' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {NON_LANGUAGE_COURSES.map(item => {
                          const courseObj = nonLanguageToCourse(item);
                          const isSelected = selectedCourseCandidate?.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleCourseClick(courseObj, speaker)}
                              className={`p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between cursor-pointer group ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                                  : 'bg-[#1b262d] border-gray-700/80 hover:border-gray-600 hover:bg-[#202d35]'
                              }`}
                            >
                              <div className="flex items-start space-x-3 min-w-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black ${item.themeColor} text-white shadow-md shrink-0`}>
                                  {item.symbol}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <h4 className="font-black text-sm text-white truncate">
                                      {userLanguage === 'ru' ? item.localNameRu : item.localNameEn}
                                    </h4>
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {item.tagRu}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-medium line-clamp-2 mt-0.5">
                                    {item.descriptionRu}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 mt-1 ${
                                isSelected ? 'bg-duo-green border-duo-green text-white' : 'border-gray-600'
                              }`}>
                                {isSelected && <span className="text-xs font-black">✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRMATION MODAL: EXACT DUOLINGO LANGUAGE SWITCH CONFIRMATION FLOW */}
      {pendingSwitchSpeaker && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131f24] border-2 border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-150">
            {/* Mascot Icon illustration */}
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <Mascot emotion="thinking" variant="default" className="w-full h-full" />
            </div>

            {/* Title: exact requested wording */}
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
              {userLanguage === 'ru'
                ? `Язык приложения будет переключён на ${pendingSwitchSpeaker.speaker.ruAccusative || pendingSwitchSpeaker.speaker.name.toLowerCase()}`
                : `App language will be changed to ${pendingSwitchSpeaker.speaker.englishName}`}
            </h3>

            {/* Subtitle: exact requested wording */}
            <p className="text-gray-300 font-medium text-sm sm:text-base leading-relaxed mb-6">
              {userLanguage === 'ru'
                ? `Выбирайте эту опцию, только если уже знаете ${pendingSwitchSpeaker.speaker.ruAccusative || pendingSwitchSpeaker.speaker.name.toLowerCase()}.`
                : `Choose this option only if you already know ${pendingSwitchSpeaker.speaker.englishName}.`}
            </p>

            {/* Target Course Preview */}
            <div className="mb-6 p-3 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center space-x-3 text-left">
              <img 
                src={`https://flagcdn.com/w40/${pendingSwitchSpeaker.speaker.flagCode}.png`} 
                className="w-8 h-6 rounded-sm object-cover shadow"
                alt=""
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {userLanguage === 'ru' ? 'Выбранный курс:' : 'Selected course:'}
                </p>
                <p className="text-sm font-black text-white truncate">
                  {pendingSwitchSpeaker.targetCourse.localName || pendingSwitchSpeaker.targetCourse.name}
                </p>
              </div>
            </div>

            {/* Actions: Primary 3D Green Button & Cancel */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmLanguageSwitch}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider text-white bg-[#58cc02] hover:bg-[#46a302] border-b-4 border-[#58a700] active:border-b-0 active:translate-y-1 transition-all shadow-xl cursor-pointer"
              >
                {userLanguage === 'ru'
                  ? `ПЕРЕКЛЮЧИТЬСЯ НА ${(pendingSwitchSpeaker.speaker.ruAccusative || pendingSwitchSpeaker.speaker.name).toUpperCase()}`
                  : `SWITCH TO ${pendingSwitchSpeaker.speaker.englishName.toUpperCase()}`}
              </button>

              <button
                type="button"
                onClick={handleCancelLanguageSwitch}
                className="w-full py-3 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-sky-400 hover:text-sky-300 hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                {userLanguage === 'ru' ? 'Отменить' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM ACTION BAR WITH "ПРОДОЛЖИТЬ" BUTTON (Exact match to screenshot) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#131f24]/95 border-t border-gray-800/80 backdrop-blur-md p-4">
        <div className="max-w-2xl mx-auto w-full">
          <button
            type="button"
            disabled={!isCandidateSelected}
            onClick={handleContinue}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-xl cursor-pointer ${
              isCandidateSelected
                ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-b-4 border-[#58a700] active:border-b-0 active:translate-y-1'
                : 'bg-[#2b383f] text-[#52656d] border-b-4 border-[#222e34] cursor-not-allowed opacity-80'
            }`}
          >
            {userLanguage === 'ru' ? 'ПРОДОЛЖИТЬ' : userLanguage === 'uk' ? 'ПРОДОВЖИТИ' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
};

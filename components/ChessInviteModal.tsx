import React, { useState, useEffect } from 'react';
import { 
  CloseIcon, 
  SearchIcon, 
  CheckCircleIcon, 
  UserIcon,
  ActivityIcon,
  ShieldIcon
} from './Icons';

export interface ChessOpponent {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  elo: number;
  status: 'online' | 'in_game' | 'offline';
  games?: number;
  wins?: number;
  contactType?: string;
  contactDetail?: string;
}

export const getSampleChessOpponents = (isRu: boolean): ChessOpponent[] => [
  {
    id: 'friend-1',
    name: 'DuoWindo Master',
    username: '@duo_master',
    avatar: '🦉',
    elo: 1650,
    status: 'online',
    games: 142,
    wins: 98
  },
  {
    id: 'friend-2',
    name: isRu ? 'Анна Шахматистка' : 'Anna ChessPlayer',
    username: '@anna_chess',
    avatar: '👩🏼',
    elo: 1480,
    status: 'online',
    games: 86,
    wins: 54
  },
  {
    id: 'friend-3',
    name: isRu ? 'Александр К.' : 'Alexander K.',
    username: '@alex_k',
    avatar: '👨🏻',
    elo: 1390,
    status: 'online',
    games: 52,
    wins: 31
  },
  {
    id: 'friend-4',
    name: isRu ? 'Иван Гроссмейстер' : 'Ivan Grandmaster',
    username: '@ivan_gm',
    avatar: '👑',
    elo: 1720,
    status: 'online',
    games: 210,
    wins: 165
  },
  {
    id: 'friend-5',
    name: isRu ? 'Мария Соколова' : 'Maria Sokolova',
    username: '@maria_s',
    avatar: '👧🏻',
    elo: 1280,
    status: 'offline',
    games: 34,
    wins: 18
  }
];

export const getSearchableChessOpponents = (isRu: boolean): ChessOpponent[] => [
  ...getSampleChessOpponents(isRu),
  {
    id: 'user-search-1',
    name: isRu ? 'Виктор Таль' : 'Victor Tal',
    username: '@victor_tal',
    avatar: '⚡',
    elo: 1590,
    status: 'online',
    games: 94,
    wins: 62
  },
  {
    id: 'user-search-2',
    name: isRu ? 'Каспаров Jr' : 'Kasparov Jr',
    username: '@kasparov_jr',
    avatar: '🏆',
    elo: 1850,
    status: 'online',
    games: 340,
    wins: 290
  },
  {
    id: 'user-search-3',
    name: isRu ? 'Полина Шах' : 'Polina Chess',
    username: '@polina_shakh',
    avatar: '🌟',
    elo: 1410,
    status: 'online',
    games: 45,
    wins: 28
  }
];

interface ChessInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (opponent: ChessOpponent) => void;
  currentUserName: string;
  currentUserElo: number;
  language?: string;
  playSound?: (type?: string) => void;
}

export const ChessInviteModal: React.FC<ChessInviteModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
  currentUserName,
  currentUserElo,
  language = 'ru',
  playSound = (_type?: string) => {}
}) => {
  const isRu = language === 'ru';
  const [activeTab, setActiveTab] = useState<'link' | 'search' | 'contacts'>('link');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  
  // Privacy toggles for Contacts: Hide Phone, Hide Email & Hide Link
  const [hidePhones, setHidePhones] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('chess_hide_phones') === 'true';
    }
    return false;
  });

  const [hideEmails, setHideEmails] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('chess_hide_emails') === 'true';
    }
    return false;
  });

  const [hideLinks, setHideLinks] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('chess_hide_links') === 'true';
    }
    return false;
  });

  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});

  const toggleHidePhones = () => {
    setHidePhones(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chess_hide_phones', String(next));
      }
      return next;
    });
  };

  const toggleHideEmails = () => {
    setHideEmails(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chess_hide_emails', String(next));
      }
      return next;
    });
  };

  const toggleHideLinks = () => {
    setHideLinks(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chess_hide_links', String(next));
      }
      return next;
    });
  };

  const toggleContactReveal = (id: string) => {
    setRevealedContacts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatContactDetail = (contact: ChessOpponent) => {
    if (!contact.contactDetail) return '';
    const isRevealed = !!revealedContacts[contact.id];

    if (contact.contactType === 'phone') {
      if (hidePhones && !isRevealed) {
        const parts = contact.contactDetail.split(' ');
        if (parts.length >= 2) {
          return `${parts[0]} ••• •••-••-${contact.contactDetail.slice(-2)}`;
        }
        return contact.contactDetail.slice(0, 3) + ' ••••••• ' + contact.contactDetail.slice(-2);
      }
      return contact.contactDetail;
    }

    if (contact.contactType === 'email') {
      if (hideEmails && !isRevealed) {
        const [userPart, domain] = contact.contactDetail.split('@');
        if (userPart && domain) {
          const maskedUser = userPart.length > 2 ? `${userPart[0]}••••${userPart.slice(-1)}` : `${userPart[0]}••••`;
          return `${maskedUser}@${domain}`;
        }
        return '••••••••@••••••';
      }
      return contact.contactDetail;
    }

    if (contact.contactType === 'link' || contact.contactType === 'vk' || contact.contactType === 'telegram') {
      if (hideLinks && !isRevealed) {
        if (contact.contactDetail.startsWith('http')) {
          return 'https://••••••••';
        }
        if (contact.contactDetail.startsWith('vk.com/')) {
          return 'vk.com/••••••••';
        }
        if (contact.contactDetail.startsWith('@')) {
          return '@••••••••';
        }
        return '••••••••';
      }
      return contact.contactDetail;
    }

    if (hideLinks && !isRevealed && (contact.contactDetail.includes('/') || contact.contactDetail.includes('http') || contact.contactDetail.includes('vk.com'))) {
      return 'https://••••••••';
    }

    return contact.contactDetail;
  };

  // Generate unique room code on open
  useEffect(() => {
    if (isOpen) {
      const code = 'DW-' + Math.floor(100000 + Math.random() * 900000);
      setRoomCode(code);
      setCopied(false);
    }
  }, [isOpen]);

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}#chess-party?room=${roomCode}`
    : `https://duowindo6601.applet.run/#chess-party?room=${roomCode}`;

  const friendsList: ChessOpponent[] = getSampleChessOpponents(isRu);

  const contactsList: ChessOpponent[] = [
    {
      id: 'contact-1',
      name: isRu ? 'Дмитрий (Телефон)' : 'Dmitry (Phone)',
      username: '+7 999 123-45-67',
      avatar: '📱',
      elo: 1400,
      status: 'online',
      contactType: 'phone',
      contactDetail: '+7 999 123-45-67'
    },
    {
      id: 'contact-2',
      name: isRu ? 'Елена Васильева (Email)' : 'Elena V. (Email)',
      username: 'elena.v@example.com',
      avatar: '✉️',
      elo: 1350,
      status: 'online',
      contactType: 'email',
      contactDetail: 'elena.v@example.com'
    },
    {
      id: 'contact-3',
      name: isRu ? 'Михаил (Telegram)' : 'Mikhail (Telegram)',
      username: '@mikhail_chess',
      avatar: '✈️',
      elo: 1520,
      status: 'online',
      contactType: 'telegram',
      contactDetail: '@mikhail_chess'
    },
    {
      id: 'contact-4',
      name: isRu ? 'София Соколова (VK)' : 'Sofia (VK)',
      username: 'vk.com/sofia_player',
      avatar: '💬',
      elo: 1290,
      status: 'offline',
      contactType: 'vk',
      contactDetail: 'vk.com/sofia_player'
    },
    {
      id: 'contact-5',
      name: isRu ? 'Артем Г. (Контакты)' : 'Artem G. (Contacts)',
      username: '+7 903 555-01-23',
      avatar: '👤',
      elo: 1460,
      status: 'online',
      contactType: 'phone',
      contactDetail: '+7 903 555-01-23'
    }
  ];

  const searchResults: ChessOpponent[] = getSearchableChessOpponents(isRu).filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q));
  });

  const handleCopyLink = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(inviteUrl);
      }
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
    setCopied(true);
    playSound('success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    playSound('click');
    if (navigator?.share) {
      try {
        await navigator.share({
          title: isRu ? 'Партия в шахматы в DuoWindo6601!' : 'Chess match in DuoWindo6601!',
          text: isRu 
            ? `Сыграем партию в шахматы? Заходи по ссылке и получи +30 XP!` 
            : `Let's play a chess match! Join via link and get +30 XP!`,
          url: inviteUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    handleCopyLink();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200 font-din overflow-y-auto">
      <div className="bg-gray-900 border-2 border-gray-700 w-full max-w-xl rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl relative flex flex-col max-h-[92dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-duo-green flex items-center justify-center text-xl sm:text-2xl shadow-lg border-b-4 border-duo-greenDark shrink-0">
              ♟️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                  {isRu ? 'Пригласить сыграть партию' : 'Invite to Play a Match'}
                </h2>
              </div>
              <span className="inline-block bg-duo-green/20 text-duo-green text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border border-duo-green/40 uppercase tracking-widest mt-0.5">
                +30 {isRu ? 'очков опыта' : 'XP'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => { playSound('click'); onClose(); }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 3 Main Action Tabs */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 my-3 sm:my-4 bg-gray-800/80 p-1 sm:p-1.5 rounded-2xl border border-gray-700/60 flex-shrink-0">
          <button
            onClick={() => { playSound('select'); setActiveTab('link'); }}
            className={`py-2 sm:py-3 px-1 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-duo-blue text-white shadow-lg border-b-2 border-duo-blueDark font-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span>🔗</span>
            <span className="truncate">{isRu ? 'Ссылка' : 'Link'}</span>
          </button>

          <button
            onClick={() => { playSound('select'); setActiveTab('search'); }}
            className={`py-2 sm:py-3 px-1 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-duo-green text-white shadow-lg border-b-2 border-duo-greenDark font-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span>🔍</span>
            <span className="truncate">{isRu ? 'Поиск' : 'Search'}</span>
          </button>

          <button
            onClick={() => { playSound('select'); setActiveTab('contacts'); }}
            className={`py-2 sm:py-3 px-1 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-purple-600 text-white shadow-lg border-b-2 border-purple-800 font-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span>📱</span>
            <span className="truncate">{isRu ? 'Контакты' : 'Contacts'}</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
          
          {/* TAB 1: Отправить ссылку с приглашением */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-gray-800/90 rounded-3xl p-5 border-2 border-gray-700/80 shadow-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <h3 className="text-white font-bold text-base md:text-lg">
                      {isRu ? 'Отправить ссылку с приглашением' : 'Send match invitation link'}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold">
                      {isRu ? 'Поделитесь ссылкой с другом в любом мессенджере' : 'Share this unique match link in any messenger'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-700 flex items-center justify-between mb-4">
                  <div className="truncate text-xs md:text-sm text-gray-300 font-mono pr-2">
                    {inviteUrl}
                  </div>
                  <span className="bg-duo-blue/20 text-duo-blue text-[10px] font-black px-2 py-1 rounded-md border border-duo-blue/40 uppercase">
                    {roomCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyLink}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs md:text-sm tracking-wider transition-all flex items-center justify-center space-x-2 border-b-4 active:translate-y-1 active:border-b-0 shadow-lg ${
                      copied 
                        ? 'bg-emerald-600 border-emerald-800 text-white'
                        : 'bg-duo-blue hover:bg-blue-400 border-duo-blueDark text-white'
                    }`}
                  >
                    <span>{copied ? '✅' : '📋'}</span>
                    <span>{copied ? (isRu ? 'Ссылка скопирована!' : 'Link Copied!') : (isRu ? 'Скопировать ссылку' : 'Copy Link')}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-wider transition-all flex items-center justify-center space-x-2 border-b-4 border-gray-900 active:translate-y-1 active:border-b-0 shadow-lg"
                  >
                    <span>📤</span>
                    <span>{isRu ? 'Поделиться' : 'Share Link'}</span>
                  </button>
                </div>
              </div>

              {/* Local 2-Player Party Quick Action */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-gray-800/80 rounded-3xl p-5 border-2 border-emerald-500/40 shadow-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">👥</span>
                    <h4 className="text-white font-black text-sm md:text-base">
                      {isRu ? 'Партия на одном устройстве' : 'Pass & Play on One Device'}
                    </h4>
                  </div>
                  <p className="text-emerald-300/80 text-xs font-semibold mt-0.5">
                    {isRu ? 'Играйте по очереди (Белые / Черные) с начислением опыта' : 'Take turns on the same board with XP rewards'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    playSound('click');
                    onStartMatch({
                      id: 'local-player-2',
                      name: isRu ? 'Игрок 2' : 'Player 2',
                      username: '@player_2',
                      avatar: '👤',
                      elo: currentUserElo || 1400,
                      status: 'online'
                    });
                  }}
                  className="px-5 py-3 bg-duo-green hover:bg-emerald-400 text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-wider border-b-4 border-duo-greenDark active:translate-y-1 active:border-b-0 shadow-xl transition-all flex-shrink-0"
                >
                  {isRu ? 'Начать: +30 XP' : 'Start: +30 XP'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Поиск по имени */}
          {activeTab === 'search' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="relative">
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRu ? 'Поиск игроков по имени или @username...' : 'Search players by name or @username...'}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-500 font-bold text-sm focus:outline-none focus:border-duo-green transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold bg-gray-700 px-2 py-1 rounded-md"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {searchResults.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-gray-800/90 hover:bg-gray-750 p-4 rounded-2xl border-2 border-gray-700/70 hover:border-duo-green/60 transition-all flex items-center justify-between shadow-md group"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gray-700 border border-gray-600 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 relative">
                        {opp.avatar}
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-800 ${opp.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-black text-sm md:text-base truncate group-hover:text-duo-green transition-colors">
                          {opp.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                          <span className="text-gray-500">{opp.username}</span>
                          <span>•</span>
                          <span className="text-amber-400 flex items-center">
                            ⭐ {opp.elo} ELO
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playSound('click');
                        onStartMatch(opp);
                      }}
                      className="px-4 py-2.5 bg-duo-green hover:bg-emerald-400 text-white rounded-xl font-black uppercase text-xs tracking-wider border-b-4 border-duo-greenDark active:translate-y-1 active:border-b-0 shadow-lg transition-all flex-shrink-0"
                    >
                      {isRu ? 'Пригласить (+30 XP)' : 'Invite (+30 XP)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Из списка контактов */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header with Stats & Quick Actions */}
              <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-gray-300 font-bold shadow-inner">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📱</span>
                  <span>{isRu ? 'Синхронизированные контакты' : 'Synced Contacts'}</span>
                  <span className="text-purple-400 font-black bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-800/40">
                    {contactsList.length} {isRu ? 'контактов' : 'contacts'}
                  </span>
                </div>

                {/* Privacy Quick Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      toggleHidePhones();
                    }}
                    title={isRu ? (hidePhones ? 'Показать номера телефонов' : 'Скрыть номера телефонов') : (hidePhones ? 'Show phone numbers' : 'Hide phone numbers')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center space-x-1 shadow-sm active:scale-95 ${
                      hidePhones 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' 
                        : 'bg-gray-700/60 text-gray-300 border-gray-600/50 hover:bg-gray-700'
                    }`}
                  >
                    <span>{hidePhones ? '🔒' : '📱'}</span>
                    <span>{isRu ? (hidePhones ? 'Номера скрыты' : 'Скрыть номер') : (hidePhones ? 'Phones Hidden' : 'Hide Phones')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      toggleHideEmails();
                    }}
                    title={isRu ? (hideEmails ? 'Показать email адреса' : 'Скрыть email адреса') : (hideEmails ? 'Show email addresses' : 'Hide email addresses')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center space-x-1 shadow-sm active:scale-95 ${
                      hideEmails 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30' 
                        : 'bg-gray-700/60 text-gray-300 border-gray-600/50 hover:bg-gray-700'
                    }`}
                  >
                    <span>{hideEmails ? '🔒' : '✉️'}</span>
                    <span>{isRu ? (hideEmails ? 'Email скрыты' : 'Скрыть email') : (hideEmails ? 'Emails Hidden' : 'Hide Emails')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      toggleHideLinks();
                    }}
                    title={isRu ? (hideLinks ? 'Показать ссылки' : 'Скрыть ссылку') : (hideLinks ? 'Show links' : 'Hide links')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center space-x-1 shadow-sm active:scale-95 ${
                      hideLinks 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30' 
                        : 'bg-gray-700/60 text-gray-300 border-gray-600/50 hover:bg-gray-700'
                    }`}
                  >
                    <span>{hideLinks ? '🔒' : '🔗'}</span>
                    <span>{isRu ? (hideLinks ? 'Ссылка скрыта' : 'Скрыть ссылка') : (hideLinks ? 'Links Hidden' : 'Hide Links')}</span>
                  </button>
                </div>
              </div>

              {/* Privacy Status Banner if any is active */}
              {(hidePhones || hideEmails || hideLinks) && (
                <div className="bg-purple-950/40 border border-purple-600/30 p-2.5 rounded-xl flex items-center justify-between text-xs text-purple-200 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <span>🛡️</span>
                    <span>
                      {isRu ? 'Режим приватности активен: ' : 'Privacy mode active: '}
                      <span className="font-bold text-white">
                        {[
                          hidePhones && (isRu ? 'телефоны скрыты' : 'phones masked'),
                          hideEmails && (isRu ? 'почта скрыта' : 'emails masked'),
                          hideLinks && (isRu ? 'ссылки скрыты' : 'links masked')
                        ].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-semibold">{isRu ? 'Нажмите 👁️ на контакте для просмотра' : 'Click 👁️ to reveal'}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {contactsList.map((c) => {
                  const isContactPhone = c.contactType === 'phone';
                  const isContactEmail = c.contactType === 'email';
                  const isContactLink = c.contactType === 'link' || c.contactType === 'vk' || c.contactType === 'telegram' || (c.contactDetail && (c.contactDetail.startsWith('http') || c.contactDetail.startsWith('vk.com')));
                  const isMasked = (isContactPhone && hidePhones && !revealedContacts[c.id]) || 
                                   (isContactEmail && hideEmails && !revealedContacts[c.id]) ||
                                   (isContactLink && hideLinks && !revealedContacts[c.id]);

                  return (
                    <div
                      key={c.id}
                      className="bg-gray-800/90 hover:bg-gray-750 p-4 rounded-2xl border-2 border-gray-700/70 hover:border-purple-500/60 transition-all flex items-center justify-between shadow-md"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-700/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-black text-sm md:text-base truncate">
                              {c.name}
                            </h4>
                            {isMasked && (
                              <span className="bg-gray-700 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-600">
                                🔒 {isRu ? 'Скрыто' : 'Hidden'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-0.5">
                            <p className="text-xs font-semibold text-gray-400 font-mono truncate">
                              {formatContactDetail(c)}
                            </p>
                            
                            {/* Toggle single contact reveal */}
                            {(isContactPhone || isContactEmail || isContactLink) && (hidePhones || hideEmails || hideLinks) && (
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  toggleContactReveal(c.id);
                                }}
                                className="text-gray-400 hover:text-purple-300 text-xs p-1 rounded-md hover:bg-purple-950/60 transition-colors"
                                title={revealedContacts[c.id] ? (isRu ? 'Скрыть данные' : 'Hide details') : (isRu ? 'Показать данные' : 'Show details')}
                              >
                                {revealedContacts[c.id] ? '🙈' : '👁️'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playSound('click');
                          onStartMatch(c);
                        }}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase text-xs tracking-wider border-b-4 border-purple-800 active:translate-y-1 active:border-b-0 shadow-lg transition-all flex-shrink-0"
                      >
                        {isRu ? 'Сыграть (+30 XP)' : 'Play (+30 XP)'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: ВАШИ ДРУЗЬЯ (YOUR FRIENDS) */}
          <div className="pt-4 border-t-2 border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">👑</span>
                <h3 className="text-base md:text-lg font-black text-amber-400 uppercase tracking-widest">
                  {isRu ? 'ВАШИ ДРУЗЬЯ' : 'YOUR FRIENDS'}
                </h3>
              </div>
              <span className="bg-amber-400/20 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/40 uppercase">
                {friendsList.filter(f => f.status === 'online').length} {isRu ? 'в сети' : 'online'}
              </span>
            </div>

            <div className="space-y-2.5">
              {friendsList.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-gray-800/90 hover:bg-gray-750 p-4 rounded-2xl border-2 border-gray-700/80 hover:border-amber-400/60 transition-all flex items-center justify-between shadow-md group"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 relative">
                      {friend.avatar}
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-800 ${
                        friend.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-black text-sm md:text-base truncate group-hover:text-amber-400 transition-colors">
                          {friend.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                        <span className="text-amber-300 font-mono">{friend.elo} ELO</span>
                        <span>•</span>
                        <span className={friend.status === 'online' ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                          {friend.status === 'online' ? (isRu ? '🟢 В сети' : '🟢 Online') : (isRu ? '⚪ Не в сети' : '⚪ Offline')}
                        </span>
                        {friend.wins && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">{friend.wins} {isRu ? 'побед' : 'wins'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playSound('click');
                      onStartMatch(friend);
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-black uppercase text-xs tracking-wider border-b-4 border-amber-700 active:translate-y-1 active:border-b-0 shadow-lg transition-all flex items-center space-x-1.5 flex-shrink-0"
                  >
                    <span>⚔️</span>
                    <span>{isRu ? 'Сыграть (+30 XP)' : 'Play (+30 XP)'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default ChessInviteModal;

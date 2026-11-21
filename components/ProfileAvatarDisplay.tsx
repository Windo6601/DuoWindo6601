import React from 'react';
import { CharacterAvatarConfig, UserProgress } from '../types';

export interface DuoWindoCharacterPreset {
  id: string;
  nameRu: string;
  nameEn: string;
  subtitleRu: string;
  subtitleEn: string;
  species: 'owl' | 'fox' | 'bot';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultBg: string;
}

export const DUOWINDO_CHARACTER_PRESETS: DuoWindoCharacterPreset[] = [
  {
    id: 'owl-classic',
    nameRu: 'Сова DuoWindo6601',
    nameEn: 'Owl DuoWindo6601',
    subtitleRu: 'Фирменный талисман',
    subtitleEn: 'Signature Owl',
    species: 'owl',
    primaryColor: '#0056D2',
    secondaryColor: '#003C96',
    accentColor: '#38BDF8',
    defaultBg: 'bg-duo-blue'
  },
  {
    id: 'owl-emerald',
    nameRu: 'Сова-Полиглот',
    nameEn: 'Polyglot Owl',
    subtitleRu: 'Мастер языков',
    subtitleEn: 'Language Master',
    species: 'owl',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    accentColor: '#6EE7B7',
    defaultBg: 'bg-emerald-600'
  },
  {
    id: 'owl-super',
    nameRu: 'Сова Super',
    nameEn: 'Super Owl',
    subtitleRu: 'Звёздный стиль',
    subtitleEn: 'Cosmic Super',
    species: 'owl',
    primaryColor: '#7C3AED',
    secondaryColor: '#4C1D95',
    accentColor: '#F472B6',
    defaultBg: 'bg-purple-600'
  },
  {
    id: 'owl-max',
    nameRu: 'Сова Max',
    nameEn: 'Max Owl',
    subtitleRu: 'Неоновый премиум',
    subtitleEn: 'Neon Premium',
    species: 'owl',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0F172A',
    accentColor: '#22D3EE',
    defaultBg: 'bg-slate-800'
  },
  {
    id: 'owl-coder',
    nameRu: 'Сова-Кодер',
    nameEn: 'Coder Owl',
    subtitleRu: 'Программирование & APK',
    subtitleEn: 'Coding & Dev',
    species: 'owl',
    primaryColor: '#F59E0B',
    secondaryColor: '#B45309',
    accentColor: '#FDE68A',
    defaultBg: 'bg-amber-600'
  },
  {
    id: 'owl-chess',
    nameRu: 'Сова-Гроссмейстер',
    nameEn: 'Grandmaster Owl',
    subtitleRu: 'Шахматная стратегия',
    subtitleEn: 'Chess Tactician',
    species: 'owl',
    primaryColor: '#14B8A6',
    secondaryColor: '#115E59',
    accentColor: '#FBBF24',
    defaultBg: 'bg-teal-600'
  },
  {
    id: 'fox-polyglot',
    nameRu: 'Лис-Путешественник',
    nameEn: 'Traveler Fox',
    subtitleRu: 'Спутник DuoWindo6601',
    subtitleEn: 'DuoWindo6601 Companion',
    species: 'fox',
    primaryColor: '#F97316',
    secondaryColor: '#C2410C',
    accentColor: '#FFF7ED',
    defaultBg: 'bg-rose-600'
  },
  {
    id: 'bot-6601',
    nameRu: 'Бот-Ассистент 6601',
    nameEn: 'Assistant Bot 6601',
    subtitleRu: 'Цифровой наставник',
    subtitleEn: 'Digital Mentor',
    species: 'bot',
    primaryColor: '#6366F1',
    secondaryColor: '#312E81',
    accentColor: '#38BDF8',
    defaultBg: 'bg-indigo-600'
  }
];

export const DEFAULT_CHARACTER_AVATAR: CharacterAvatarConfig = {
  characterId: 'human-builder',
  bgColor: 'bg-slate-200',
  bgHex: '#E5E7EB',
  bgPattern: 'solid',
  avatarFrame: 'none',
  expression: 'happy',
  accessory: 'none',
  headwear: 'none',
  skinColor: '#723B32',
  headShape: 'rounded',
  earStyle: 'normal',
  bodyStyle: 'medium',
  eyeColor: '#2B2B2B',
  eyeStyle: 'classic',
  eyebrowColor: '#3F3F46',
  eyebrowStyle: 'none',
  noseStyle: 'drop',
  faceStyle: 'smile',
  cheekStyle: 'none',
  faceMark: 'none',
  hairColor: '#3F3F46',
  hairStyle: 'none',
  bangsStyle: 'none',
  glassesColor: '#2563EB',
  glassesStyle: 'none',
  facialHairColor: '#3F3F46',
  facialHairStyle: 'none',
  earringStyle: 'none',
  neckwearStyle: 'none',
  faceAccessory: 'none',
  hatColor: '#A855F7',
  hatStyle: 'none',
  outfitColor: '#C084CC',
  outfitDecal: 'none',
  auraEffect: 'none',
  shoulderPet: 'none'
};

function darkenHex(hex: string, amount: number = 0.22): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#4A251F';
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Clean geometric custom character avatar builder SVG
 * (uses original DuoWindo6601 styling — zero Duolingo trademarked characters)
 */
export const HumanBuilderAvatarSvg: React.FC<{
  config: CharacterAvatarConfig;
  className?: string;
  viewBox?: string;
  includeBgPattern?: boolean;
}> = ({ config, className = 'w-full h-full', viewBox = '0 0 160 160', includeBgPattern = false }) => {
  const skin = config.skinColor || '#723B32';
  const skinShade = darkenHex(skin, 0.25);
  const headShape = config.headShape || 'rounded';
  const earStyle = config.earStyle || 'normal';
  const outfit = config.outfitColor || '#C084CC';
  const outfitShade = darkenHex(outfit, 0.2);
  const eyeCol = config.eyeColor || '#27272A';
  const eyeStyle = config.eyeStyle || (config.faceStyle === 'wink' ? 'wink' : config.faceStyle === 'calm' ? 'calm' : 'classic');
  const browCol = config.eyebrowColor || config.hairColor || '#3F3F46';
  const browStyle = config.eyebrowStyle || 'none';
  const noseStyle = config.noseStyle || 'drop';
  const face = config.faceStyle || 'smile';
  const cheek = config.cheekStyle || 'none';
  const faceMark = config.faceMark || 'none';
  const hairCol = config.hairColor || '#3F3F46';
  const hair = config.hairStyle || 'none';
  const bangs = config.bangsStyle || 'none';
  const glassesCol = config.glassesColor || '#2563EB';
  const glasses = config.glassesStyle || 'none';
  const beardCol = config.facialHairColor || '#3F3F46';
  const beard = config.facialHairStyle || 'none';
  const earring = config.earringStyle || 'none';
  const neckwear = config.neckwearStyle || 'none';
  const faceAcc = config.faceAccessory || 'none';
  const hatCol = config.hatColor || '#A855F7';
  const hatShade = darkenHex(hatCol, 0.2);
  const hat = config.hatStyle || 'none';
  const body = config.bodyStyle || 'medium';
  const decal = config.outfitDecal || 'none';
  const aura = config.auraEffect || 'none';
  const pet = config.shoulderPet || 'none';
  const bgPattern = config.bgPattern || 'solid';
  const frame = config.avatarFrame || 'none';

  const hasLongBackHair =
    hat === 'none' &&
    (hair === 'bob' ||
      hair === 'long' ||
      hair === 'twintails' ||
      hair === 'afro' ||
      hair === 'curly' ||
      hair === 'bun' ||
      hair === 'ponytail' ||
      hair === 'dreads' ||
      hair === 'wavy');

  return (
    <svg viewBox={viewBox} className={className} aria-label="Custom Character Avatar">
      {includeBgPattern && bgPattern === 'dots' && (
        <g fill="white" fillOpacity="0.28">
          <circle cx="24" cy="24" r="4" /><circle cx="64" cy="18" r="3" /><circle cx="104" cy="22" r="4" /><circle cx="140" cy="28" r="3" />
          <circle cx="18" cy="64" r="3.5" /><circle cx="142" cy="68" r="4" /><circle cx="26" cy="112" r="4" /><circle cx="136" cy="116" r="3" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'stripes' && (
        <g stroke="white" strokeOpacity="0.22" strokeWidth="10">
          <line x1="-20" y1="40" x2="60" y2="-40" />
          <line x1="-20" y1="90" x2="110" y2="-40" />
          <line x1="-20" y1="140" x2="160" y2="-40" />
          <line x1="20" y1="170" x2="180" y2="10" />
          <line x1="70" y1="170" x2="190" y2="50" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'rays' && (
        <g fill="white" fillOpacity="0.18">
          <polygon points="80,80 58,-10 102,-10" />
          <polygon points="80,80 170,12 170,56" />
          <polygon points="80,80 170,114 170,158" />
          <polygon points="80,80 -10,12 -10,56" />
          <polygon points="80,80 -10,114 -10,158" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'grid' && (
        <g stroke="white" strokeOpacity="0.2" strokeWidth="1.5">
          <line x1="0" y1="32" x2="160" y2="32" /><line x1="0" y1="64" x2="160" y2="64" /><line x1="0" y1="96" x2="160" y2="96" /><line x1="0" y1="128" x2="160" y2="128" />
          <line x1="32" y1="0" x2="32" y2="160" /><line x1="64" y1="0" x2="64" y2="160" /><line x1="96" y1="0" x2="96" y2="160" /><line x1="128" y1="0" x2="128" y2="160" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'sparkles' && (
        <g fill="white" fillOpacity="0.45">
          <path d="M24 22 L27 29 L34 32 L27 35 L24 42 L21 35 L14 32 L21 29 Z" />
          <path d="M134 26 L136 31 L141 33 L136 35 L134 40 L132 35 L127 33 L132 31 Z" />
          <path d="M20 110 L22 115 L27 117 L22 119 L20 124 L18 119 L13 117 L18 115 Z" />
          <path d="M138 96 L141 102 L147 105 L141 108 L138 114 L135 108 L129 105 L135 102 Z" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'hearts' && (
        <g fill="#FB7185" fillOpacity="0.35">
          <path d="M26 32 C22 29 20 26 22 24 C23.5 22.5 25.5 23 26 24.5 C26.5 23 28.5 22.5 30 24 C32 26 30 29 26 32 Z" />
          <path d="M134 44 C130 41 128 38 130 36 C131.5 34.5 133.5 35 134 36.5 C134.5 35 136.5 34.5 138 36 C140 38 138 41 134 44 Z" />
          <path d="M22 118 C18 115 16 112 18 110 C19.5 108.5 21.5 109 22 110.5 C22.5 109 24.5 108.5 26 110 C28 112 26 115 22 118 Z" />
        </g>
      )}
      {includeBgPattern && bgPattern === 'waves' && (
        <g fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round">
          <path d="M0 30 Q20 20 40 30 T80 30 T120 30 T160 30" />
          <path d="M0 70 Q20 60 40 70 T80 70 T120 70 T160 70" />
          <path d="M0 110 Q20 100 40 110 T80 110 T120 110 T160 110" />
        </g>
      )}

      {/* AURA / WINGS BEHIND CHARACTER */}
      {aura === 'angelWings' && (
        <g fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2">
          <path d="M46 112 C12 96, 6 58, 22 44 C32 54, 42 74, 52 94 Z" />
          <path d="M114 112 C148 96, 154 58, 138 44 C128 54, 118 74, 108 94 Z" />
        </g>
      )}
      {aura === 'dragonWings' && (
        <g fill="#4C1D95" stroke="#8B5CF6" strokeWidth="2">
          <path d="M48 114 L12 62 L24 46 L42 64 L54 96 Z" />
          <path d="M112 114 L148 62 L136 46 L118 64 L106 96 Z" />
        </g>
      )}
      {aura === 'cyberRing' && (
        <circle cx="80" cy="76" r="56" fill="none" stroke="#22D3EE" strokeWidth="4" strokeDasharray="10 6" opacity="0.85" />
      )}
      {aura === 'flame' && (
        <path d="M24 140 C16 104, 34 78, 38 48 C48 60, 56 32, 80 16 C104 32, 112 60, 122 48 C126 78, 144 104, 136 140 Z" fill="#FB923C" fillOpacity="0.45" />
      )}
      {aura === 'rainbow' && (
        <g fill="none" strokeWidth="5" opacity="0.55">
          <path d="M22 108 A58 58 0 0 1 138 108" stroke="#F43F5E" />
          <path d="M28 108 A52 52 0 0 1 132 108" stroke="#FACC15" />
          <path d="M34 108 A46 46 0 0 1 126 108" stroke="#22C55E" />
          <path d="M40 108 A40 40 0 0 1 120 108" stroke="#3B82F6" />
        </g>
      )}
      {aura === 'stars' && (
        <g fill="#FACC15">
          <polygon points="24,42 26,48 32,48 27,52 29,58 24,54 19,58 21,52 16,48 22,48" />
          <polygon points="136,42 138,48 144,48 139,52 141,58 136,54 131,58 133,52 128,48 134,48" />
          <circle cx="30" cy="90" r="3" /><circle cx="130" cy="90" r="3" />
        </g>
      )}

      {/* BACK HAIR LAYER */}
      {hasLongBackHair && hair === 'bob' && (
        <path d="M40 58 C34 86, 36 105, 48 112 L112 112 C124 105, 126 86, 120 58 Z" fill={hairCol} />
      )}
      {hasLongBackHair && hair === 'long' && (
        <path d="M37 56 C30 92, 31 124, 42 138 L118 138 C129 124, 130 92, 123 56 Z" fill={hairCol} />
      )}
      {hasLongBackHair && hair === 'wavy' && (
        <path d="M36 58 C26 76, 38 96, 32 116 C30 128, 38 140, 48 140 L112 140 C122 140, 130 128, 128 116 C122 96, 134 76, 124 58 Z" fill={hairCol} />
      )}
      {hasLongBackHair && hair === 'dreads' && (
        <g fill={hairCol}>
          <rect x="33" y="54" width="9" height="74" rx="4.5" />
          <rect x="40" y="50" width="9" height="80" rx="4.5" />
          <rect x="118" y="54" width="9" height="74" rx="4.5" />
          <rect x="111" y="50" width="9" height="80" rx="4.5" />
        </g>
      )}
      {hasLongBackHair && hair === 'ponytail' && (
        <path d="M108 46 C128 48, 138 82, 126 112 C116 110, 114 86, 108 66 Z" fill={hairCol} />
      )}
      {hasLongBackHair && hair === 'twintails' && (
        <g fill={hairCol}>
          <path d="M42 52 C26 56, 22 92, 28 118 C36 118, 42 100, 44 74 Z" />
          <path d="M118 52 C134 56, 138 92, 132 118 C124 118, 118 100, 116 74 Z" />
          <circle cx="40" cy="54" r="5" fill={hatCol} />
          <circle cx="120" cy="54" r="5" fill={hatCol} />
        </g>
      )}
      {hasLongBackHair && hair === 'bun' && (
        <circle cx="80" cy="24" r="15" fill={hairCol} />
      )}
      {hasLongBackHair && hair === 'curly' && (
        <g fill={hairCol}>
          <circle cx="46" cy="46" r="16" />
          <circle cx="80" cy="36" r="18" />
          <circle cx="114" cy="46" r="16" />
          <circle cx="40" cy="64" r="12" />
          <circle cx="120" cy="64" r="12" />
        </g>
      )}
      {hasLongBackHair && hair === 'afro' && (
        <g fill={hairCol}>
          <circle cx="80" cy="54" r="46" />
          <circle cx="44" cy="52" r="22" />
          <circle cx="116" cy="52" r="22" />
        </g>
      )}

      {/* BODY / TORSO SILHOUETTES */}
      <g>
        <rect x="66" y="102" width="28" height="18" fill={skin} />
        {body === 'slim' && (
          <path d="M56 160 L63 116 Q80 113 97 116 L104 160 Z" fill={outfit} />
        )}
        {body === 'medium' && (
          <path d="M42 160 L54 118 Q80 114 106 118 L118 160 Z" fill={outfit} />
        )}
        {body === 'broad' && (
          <path d="M32 160 L44 118 Q80 113 116 118 L128 160 Z" fill={outfit} />
        )}
        {body === 'collar' && (
          <>
            <path d="M40 160 L52 117 Q80 113 108 117 L120 160 Z" fill={outfit} />
            <polygon points="64,116 80,130 72,116" fill={outfitShade} />
            <polygon points="96,116 80,130 88,116" fill={outfitShade} />
          </>
        )}
        {body === 'hoodie' && (
          <>
            <path d="M38 160 L50 117 Q80 113 110 117 L122 160 Z" fill={outfit} />
            <path d="M58 116 Q80 128 102 116" fill="none" stroke={outfitShade} strokeWidth="5" strokeLinecap="round" />
            <line x1="71" y1="122" x2="71" y2="142" stroke="white" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="89" y1="122" x2="89" y2="142" stroke="white" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {body === 'wide' && (
          <path d="M24 160 L38 122 Q80 116 122 122 L136 160 Z" fill={outfit} />
        )}
        {body === 'jacket' && (
          <>
            <path d="M36 160 L48 117 Q80 113 112 117 L124 160 Z" fill={outfit} />
            <path d="M68 116 L75 160 L85 160 L92 116 Z" fill="white" fillOpacity="0.88" />
            <polygon points="62,116 72,135 66,116" fill={outfitShade} />
            <polygon points="98,116 88,135 94,116" fill={outfitShade} />
          </>
        )}
        {body === 'sweater' && (
          <>
            <path d="M39 160 L50 118 Q80 113 110 118 L121 160 Z" fill={outfit} />
            <rect x="61" y="110" width="38" height="11" rx="5.5" fill={outfitShade} />
            <line x1="48" y1="138" x2="112" y2="138" stroke="white" strokeOpacity="0.32" strokeWidth="4" />
          </>
        )}
        {body === 'scarf' && (
          <>
            <path d="M40 160 L52 118 Q80 114 108 118 L120 160 Z" fill={outfit} />
            <rect x="57" y="111" width="46" height="14" rx="7" fill={hatCol} />
            <path d="M88 122 L100 122 L103 149 L91 149 Z" fill={hatShade} />
          </>
        )}
        {body === 'turtleneck' && (
          <>
            <path d="M40 160 L52 117 Q80 113 108 117 L120 160 Z" fill={outfit} />
            <rect x="64" y="106" width="32" height="14" rx="4" fill={outfitShade} />
          </>
        )}

        {/* NECKWEAR */}
        {neckwear === 'tie' && (
          <g fill="#E11D48">
            <polygon points="75,116 85,116 82,123 78,123" />
            <polygon points="78,123 82,123 85,147 80,153 75,147" />
          </g>
        )}
        {neckwear === 'bowtie' && (
          <g fill="#E11D48">
            <polygon points="66,113 78,119 66,125" />
            <polygon points="94,113 82,119 94,125" />
            <circle cx="80" cy="119" r="3.5" fill="#9F1239" />
          </g>
        )}
        {neckwear === 'chain' && (
          <path d="M63 116 Q80 133 97 116" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 3" />
        )}
        {neckwear === 'pendant' && (
          <g>
            <path d="M64 115 Q80 132 96 115" fill="none" stroke="#FACC15" strokeWidth="2.4" />
            <polygon points="80,126 85,132 80,138 75,132" fill="#38BDF8" stroke="#FACC15" strokeWidth="1.5" />
          </g>
        )}
        {neckwear === 'choker' && (
          <g>
            <rect x="65" y="108" width="30" height="6" rx="3" fill="#18181B" />
            <circle cx="80" cy="115" r="2.5" fill="#FACC15" />
          </g>
        )}
        {neckwear === 'scarf' && (
          <g>
            <rect x="58" y="111" width="44" height="13" rx="6.5" fill="#EF4444" />
            <path d="M88 122 L99 122 L102 146 L90 146 Z" fill="#B91C1C" />
          </g>
        )}

        {decal === 'owl66' && (
          <text x="80" y="144" textAnchor="middle" fill="white" fillOpacity="0.92" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif">
            66
          </text>
        )}
        {decal === 'star' && (
          <polygon points="80,127 83.2,133.5 90.4,134.5 85.2,139.6 86.4,146.8 80,143.4 73.6,146.8 74.8,139.6 69.6,134.5 76.8,133.5" fill="#FACC15" />
        )}
        {decal === 'lightning' && (
          <polygon points="82,126 73,139 80,139 77,150 87,136 80,136" fill="#FDE047" />
        )}
        {decal === 'heart' && (
          <path d="M80 146 C73 141, 69 136, 72 132 C74.5 129, 78.5 130, 80 133 C81.5 130, 85.5 129, 88 132 C91 136, 87 141, 80 146 Z" fill="#FB7185" />
        )}
        {decal === 'code' && (
          <text x="80" y="143" textAnchor="middle" fill="white" fillOpacity="0.92" fontSize="12" fontWeight="900" fontFamily="monospace">
            &lt;/&gt;
          </text>
        )}
        {decal === 'music' && (
          <text x="80" y="145" textAnchor="middle" fill="white" fillOpacity="0.92" fontSize="15" fontWeight="900">
            ♪
          </text>
        )}
        {decal === 'chess' && (
          <text x="80" y="145" textAnchor="middle" fill="white" fillOpacity="0.92" fontSize="15" fontWeight="900">
            ♛
          </text>
        )}
        {decal === 'globe' && (
          <g stroke="white" strokeOpacity="0.9" fill="none" strokeWidth="1.8">
            <circle cx="80" cy="138" r="8" />
            <ellipse cx="80" cy="138" rx="3.8" ry="8" />
            <line x1="72" y1="138" x2="88" y2="138" />
          </g>
        )}
      </g>

      {/* EARS */}
      {earStyle === 'small' && (
        <>
          <circle cx="43" cy="74" r="5.5" fill={skin} />
          <circle cx="117" cy="74" r="5.5" fill={skin} />
        </>
      )}
      {earStyle === 'large' && (
        <>
          <circle cx="40" cy="74" r="10.5" fill={skin} />
          <circle cx="120" cy="74" r="10.5" fill={skin} />
        </>
      )}
      {earStyle === 'elf' && (
        <>
          <polygon points="46,68 25,60 44,80" fill={skin} />
          <polygon points="114,68 135,60 116,80" fill={skin} />
        </>
      )}
      {earStyle === 'cat' && (
        <>
          <polygon points="46,45 50,21 67,39" fill={skin} />
          <polygon points="114,45 110,21 93,39" fill={skin} />
          <polygon points="50,42 52,27 63,39" fill="#FDA4AF" />
          <polygon points="110,42 108,27 97,39" fill="#FDA4AF" />
        </>
      )}
      {earStyle === 'cyber' && (
        <>
          <rect x="36" y="64" width="9" height="20" rx="3" fill="#334155" stroke="#38BDF8" strokeWidth="1.8" />
          <rect x="115" y="64" width="9" height="20" rx="3" fill="#334155" stroke="#38BDF8" strokeWidth="1.8" />
        </>
      )}
      {(earStyle === 'normal' || !earStyle) && (
        <>
          <circle cx="42" cy="74" r="8" fill={skin} />
          <circle cx="118" cy="74" r="8" fill={skin} />
        </>
      )}

      {/* EARRINGS */}
      {(earring === 'studs' || faceAcc === 'studEarrings') && (
        <g fill="#FACC15">
          <circle cx="41" cy="80" r="2.7" />
          <circle cx="119" cy="80" r="2.7" />
        </g>
      )}
      {(earring === 'hoops' || faceAcc === 'hoopEarrings') && (
        <g fill="none" stroke="#FACC15" strokeWidth="2.4">
          <circle cx="40" cy="83" r="4.8" />
          <circle cx="120" cy="83" r="4.8" />
        </g>
      )}
      {earring === 'stars' && (
        <g fill="#FACC15">
          <polygon points="41,78 42.3,81 45.5,81 43,83 44,86 41,84 38,86 39,83 36.5,81 39.7,81" />
          <polygon points="119,78 120.3,81 123.5,81 121,83 122,86 119,84 116,86 117,83 114.5,81 117.7,81" />
        </g>
      )}
      {earring === 'drops' && (
        <g fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1">
          <polygon points="41,79 44,85 41,90 38,85" />
          <polygon points="119,79 122,85 119,90 116,85" />
        </g>
      )}
      {earring === 'double' && (
        <g fill="#E2E8F0">
          <circle cx="40" cy="78" r="2.2" /><circle cx="41" cy="83" r="2.2" />
          <circle cx="120" cy="78" r="2.2" /><circle cx="119" cy="83" r="2.2" />
        </g>
      )}

      {/* HEAD SHAPE */}
      {headShape === 'round' && <rect x="44" y="38" width="72" height="69" rx="34" fill={skin} />}
      {headShape === 'oval' && <rect x="46" y="36" width="68" height="72" rx="30" fill={skin} />}
      {headShape === 'chiseled' && <rect x="45" y="38" width="70" height="69" rx="12" fill={skin} />}
      {headShape === 'tall' && <rect x="47" y="32" width="66" height="76" rx="22" fill={skin} />}
      {headShape === 'heart' && <path d="M44 58 C44 42, 58 38, 80 38 C102 38, 116 42, 116 58 C116 86, 98 106, 80 107 C62 106, 44 86, 44 58 Z" fill={skin} />}
      {(headShape === 'rounded' || !headShape) && <rect x="44" y="38" width="72" height="69" rx="22" fill={skin} />}

      {/* HAIR TOP STYLES */}
      {hat === 'none' && hair === 'buzz' && (
        <path d="M44 57 C44 39, 58 35, 80 35 C102 35, 116 39, 116 57 C106 49, 94 46, 80 46 C66 46, 54 49, 44 57 Z" fill={hairCol} />
      )}
      {hat === 'none' && hair === 'fade' && (
        <path d="M45 55 C45 36, 62 32, 80 32 C98 32, 115 36, 115 55 C104 45, 92 43, 80 43 C68 43, 56 45, 45 55 Z" fill={hairCol} />
      )}
      {hat === 'none' && hair === 'curl' && (
        <path d="M78 38 C76 28, 86 22, 91 28 C95 33, 87 38, 83 34" fill="none" stroke={hairCol} strokeWidth="4.2" strokeLinecap="round" />
      )}
      {hat === 'none' && hair === 'pomp' && (
        <path d="M48 48 C46 28, 70 20, 96 26 C110 29, 114 39, 110 48 C96 42, 64 42, 48 48 Z" fill={hairCol} />
      )}
      {hat === 'none' && hair === 'side' && (
        <path d="M44 56 C44 35, 62 29, 86 30 C108 31, 116 40, 116 54 C104 44, 84 44, 64 48 C54 50, 48 53, 44 56 Z" fill={hairCol} />
      )}
      {hat === 'none' && (hair === 'bob' || hair === 'long' || hair === 'twintails' || hair === 'ponytail' || hair === 'wavy' || hair === 'dreads') && (
        <path d="M44 56 C44 34, 62 31, 80 31 C98 31, 116 34, 116 56 C104 46, 92 44, 80 48 C68 44, 56 46, 44 56 Z" fill={hairCol} />
      )}
      {hat === 'none' && hair === 'spiky' && (
        <path d="M46 49 L52 30 L64 38 L75 21 L86 37 L98 25 L106 39 L115 31 L114 51 C100 44, 60 44, 46 49 Z" fill={hairCol} strokeLinejoin="round" />
      )}
      {hat === 'none' && hair === 'mohawk' && (
        <path d="M70 46 L72 19 L80 25 L88 18 L90 46 Z" fill={hairCol} />
      )}
      {hat === 'none' && hair === 'undercut' && (
        <path d="M50 48 C52 29, 72 24, 96 27 C108 29, 112 38, 108 47 C92 41, 66 43, 50 48 Z" fill={hairCol} />
      )}

      {/* BANGS OVERLAY */}
      {hat === 'none' && bangs === 'straight' && (
        <path d="M46 48 C54 38, 106 38, 114 48 L114 56 H46 Z" fill={hairCol} />
      )}
      {hat === 'none' && bangs === 'side' && (
        <path d="M46 49 C60 35, 96 36, 114 47 C94 54, 66 56, 46 58 Z" fill={hairCol} />
      )}
      {hat === 'none' && bangs === 'curtains' && (
        <g fill={hairCol}>
          <path d="M45 55 C45 38, 62 36, 78 40 C70 50, 56 56, 45 60 Z" />
          <path d="M115 55 C115 38, 98 36, 82 40 C90 50, 104 56, 115 60 Z" />
        </g>
      )}
      {hat === 'none' && bangs === 'curly' && (
        <g fill={hairCol}>
          <circle cx="56" cy="48" r="8" /><circle cx="72" cy="46" r="8" /><circle cx="88" cy="46" r="8" /><circle cx="104" cy="48" r="8" />
        </g>
      )}
      {hat === 'none' && bangs === 'strand' && (
        <path d="M78 38 C76 49, 70 56, 65 60" stroke={hairCol} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}

      {/* CHEEKS / BLUSH / FRECKLES */}
      {(cheek === 'blush' || cheek === 'blushFreckles') && (
        <g fill="#FB7185" fillOpacity="0.45">
          <ellipse cx="56" cy="79" rx="7" ry="4" />
          <ellipse cx="104" cy="79" rx="7" ry="4" />
        </g>
      )}
      {(cheek === 'freckles' || cheek === 'blushFreckles') && (
        <g fill={skinShade} fillOpacity="0.75">
          <circle cx="53" cy="77" r="1.2" /><circle cx="58" cy="79" r="1.2" /><circle cx="55" cy="82" r="1.2" />
          <circle cx="107" cy="77" r="1.2" /><circle cx="102" cy="79" r="1.2" /><circle cx="105" cy="82" r="1.2" />
        </g>
      )}
      {cheek === 'bandaid' && (
        <g transform="rotate(-14 103 80)">
          <rect x="94" y="76" width="18" height="8" rx="3" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1" />
          <line x1="100" y1="76" x2="100" y2="84" stroke="#FDBA74" strokeWidth="1" />
          <line x1="106" y1="76" x2="106" y2="84" stroke="#FDBA74" strokeWidth="1" />
        </g>
      )}
      {cheek === 'mole' && <circle cx="96" cy="84" r="1.8" fill={skinShade} />}
      {cheek === 'hearts' && (
        <g fill="#F43F5E">
          <path d="M56 81 C53 79 52 76.5 53.5 75 C54.5 74 55.5 74.5 56 75.5 C56.5 74.5 57.5 74 58.5 75 C60 76.5 59 79 56 81 Z" />
          <path d="M104 81 C101 79 100 76.5 101.5 75 C102.5 74 103.5 74.5 104 75.5 C104.5 74.5 105.5 74 106.5 75 C108 76.5 107 79 104 81 Z" />
        </g>
      )}
      {cheek === 'stripes' && (
        <g stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round">
          <line x1="51" y1="78" x2="60" y2="78" /><line x1="51" y1="83" x2="60" y2="83" />
          <line x1="100" y1="78" x2="109" y2="78" /><line x1="100" y1="83" x2="109" y2="83" />
        </g>
      )}

      {/* FACE MARKS / MAKEUP */}
      {faceMark === 'scar' && (
        <path d="M95 50 L102 74" stroke={skinShade} strokeWidth="2.5" strokeLinecap="round" />
      )}
      {faceMark === 'eyeshadow' && (
        <g fill="#C084FC" fillOpacity="0.65">
          <ellipse cx="68.5" cy="56" rx="9.5" ry="4.5" />
          <ellipse cx="91.5" cy="56" rx="9.5" ry="4.5" />
        </g>
      )}
      {faceMark === 'eyeliner' && (
        <g stroke="#18181B" strokeWidth="2.4" strokeLinecap="round">
          <path d="M58 56 L62 55" /><path d="M102 56 L98 55" />
        </g>
      )}
      {faceMark === 'starMark' && (
        <polygon points="103,75 104.5,79 108.5,79 105.2,81.5 106.5,85.5 103,83 99.5,85.5 100.8,81.5 97.5,79 101.5,79" fill="#FACC15" />
      )}
      {faceMark === 'heartMark' && (
        <path d="M103 83 C99 80 98 77 100 75.5 C101.2 74.5 102.5 75 103 76.5 C103.5 75 104.8 74.5 106 75.5 C108 77 107 80 103 83 Z" fill="#EC4899" />
      )}
      {faceMark === 'whiskers' && (
        <g stroke={skinShade} strokeWidth="2" strokeLinecap="round">
          <line x1="48" y1="78" x2="60" y2="80" /><line x1="48" y1="84" x2="60" y2="84" />
          <line x1="112" y1="78" x2="100" y2="80" /><line x1="112" y1="84" x2="100" y2="84" />
        </g>
      )}

      {/* FACIAL HAIR */}
      {beard === 'stubble' && (
        <path d="M45 83 Q80 106 115 83 L115 89 Q115 107 94 107 L66 107 Q45 107 45 89 Z" fill={beardCol} fillOpacity="0.35" />
      )}
      {beard === 'fullbeard' && (
        <path d="M44 79 C46 95, 58 112, 80 112 C102 112, 114 95, 116 79 C104 82, 94 82, 80 82 C66 82, 56 82, 44 79 Z" fill={beardCol} />
      )}
      {beard === 'bushy' && (
        <path d="M42 78 C42 104, 56 118, 80 118 C104 118, 118 104, 118 78 C106 83, 94 84, 80 84 C66 84, 54 83, 42 78 Z" fill={beardCol} />
      )}
      {(beard === 'goatee' || beard === 'vandyke' || beard === 'anchor') && (
        <path d="M68 92 Q80 89 92 92 L90 107 Q80 111 70 107 Z" fill={beardCol} />
      )}
      {beard === 'mutton' && (
        <g fill={beardCol}>
          <path d="M44 72 H55 V98 Q46 96 44 86 Z" />
          <path d="M105 72 H116 V86 Q114 96 105 98 Z" />
        </g>
      )}

      {/* EYES */}
      <g>
        {eyeStyle === 'happy' ? (
          <>
            <path d="M61 66 Q69 57 77 66" stroke={skinShade} strokeWidth="3.8" fill="none" strokeLinecap="round" />
            <path d="M83 66 Q91 57 99 66" stroke={skinShade} strokeWidth="3.8" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect
              x="60"
              y={eyeStyle === 'wide' ? 51 : 54}
              width="17"
              height={eyeStyle === 'wide' ? 25 : 22}
              rx="8.5"
              fill="white"
            />
            <rect
              x="83"
              y={eyeStyle === 'wide' ? 51 : 54}
              width="17"
              height={eyeStyle === 'wide' ? 25 : 22}
              rx="8.5"
              fill="white"
            />
            {eyeStyle === 'lashes' && (
              <g stroke={skinShade} strokeWidth="2.4" strokeLinecap="round">
                <line x1="60" y1="57" x2="56" y2="54" />
                <line x1="63" y1="54" x2="60" y2="50" />
                <line x1="100" y1="57" x2="104" y2="54" />
                <line x1="97" y1="54" x2="100" y2="50" />
              </g>
            )}
            {eyeStyle === 'wink' ? (
              <>
                <circle cx="70" cy="65" r="5" fill={eyeCol} />
                <circle cx="72" cy="63" r="1.8" fill="white" />
                <path d="M85 65 Q91 59 97 65" stroke={skinShade} strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            ) : eyeStyle === 'calm' ? (
              <>
                <circle cx="70" cy="66" r="4.8" fill={eyeCol} />
                <circle cx="92" cy="66" r="4.8" fill={eyeCol} />
                <path d="M60 61 H77" stroke={skinShade} strokeWidth="3.5" strokeLinecap="round" />
                <path d="M83 61 H100" stroke={skinShade} strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : eyeStyle === 'focused' ? (
              <>
                <circle cx="69" cy="65" r="4.2" fill={eyeCol} />
                <circle cx="91" cy="65" r="4.2" fill={eyeCol} />
                <path d="M60 58 L77 62" stroke={skinShade} strokeWidth="3.2" strokeLinecap="round" />
                <path d="M100 58 L83 62" stroke={skinShade} strokeWidth="3.2" strokeLinecap="round" />
              </>
            ) : eyeStyle === 'starry' ? (
              <>
                <circle cx="69" cy="65" r="5.6" fill={eyeCol} />
                <circle cx="91" cy="65" r="5.6" fill={eyeCol} />
                <circle cx="71" cy="62.5" r="2.2" fill="white" />
                <circle cx="93" cy="62.5" r="2.2" fill="white" />
                <circle cx="66.5" cy="68" r="1.2" fill="white" />
                <circle cx="88.5" cy="68" r="1.2" fill="white" />
              </>
            ) : eyeStyle === 'heart' ? (
              <>
                <path d="M68.5 70 C63 66 61.5 62.5 64 60 C65.8 58.5 67.8 59.5 68.5 61.5 C69.2 59.5 71.2 58.5 73 60 C75.5 62.5 74 66 68.5 70 Z" fill="#EC4899" />
                <path d="M91.5 70 C86 66 84.5 62.5 87 60 C88.8 58.5 90.8 59.5 91.5 61.5 C92.2 59.5 94.2 58.5 96 60 C98.5 62.5 97 66 91.5 70 Z" fill="#EC4899" />
              </>
            ) : eyeStyle === 'cyber' ? (
              <>
                <rect x="61" y="61" width="15" height="6" rx="2" fill="#22D3EE" />
                <rect x="84" y="61" width="15" height="6" rx="2" fill="#22D3EE" />
              </>
            ) : (
              <>
                <circle cx="70" cy="65" r={eyeStyle === 'wide' ? 5.6 : 5} fill={eyeCol} />
                <circle cx="92" cy="65" r={eyeStyle === 'wide' ? 5.6 : 5} fill={eyeCol} />
                <circle cx="72" cy="63" r="1.8" fill="white" />
                <circle cx="94" cy="63" r="1.8" fill="white" />
              </>
            )}
          </>
        )}
      </g>

      {/* EYEBROWS */}
      {browStyle === 'natural' && (
        <g stroke={browCol} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M61 50 Q68.5 47 76 50" />
          <path d="M84 50 Q91.5 47 99 50" />
        </g>
      )}
      {browStyle === 'thick' && (
        <g stroke={browCol} strokeWidth="4.8" fill="none" strokeLinecap="round">
          <path d="M60 49.5 Q68.5 47 76.5 49.5" />
          <path d="M83.5 49.5 Q91.5 47 100 49.5" />
        </g>
      )}
      {browStyle === 'arched' && (
        <g stroke={browCol} strokeWidth="2.8" fill="none" strokeLinecap="round">
          <path d="M60 51 Q68 44 76 50" />
          <path d="M84 50 Q92 44 100 51" />
        </g>
      )}
      {browStyle === 'serious' && (
        <g stroke={browCol} strokeWidth="3.6" fill="none" strokeLinecap="round">
          <path d="M60 47 L76 51.5" />
          <path d="M100 47 L84 51.5" />
        </g>
      )}
      {browStyle === 'raised' && (
        <g stroke={browCol} strokeWidth="3.2" fill="none" strokeLinecap="round">
          <path d="M61 50 Q68.5 48 76 50" />
          <path d="M84 46 Q91.5 42 99 47" />
        </g>
      )}
      {browStyle === 'unibrow' && (
        <path d="M60 50 Q80 46 100 50" stroke={browCol} strokeWidth="4.2" fill="none" strokeLinecap="round" />
      )}
      {browStyle === 'slit' && (
        <g stroke={browCol} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M60 49.5 H69" /><path d="M73 49.5 H77" />
          <path d="M84 49.5 H99" />
        </g>
      )}

      {/* NOSE STYLES */}
      {noseStyle === 'drop' && (
        <path d="M80 73 C84 79, 85 83, 80 83 C75 83, 76 79, 80 73 Z" fill={skinShade} />
      )}
      {noseStyle === 'button' && (
        <ellipse cx="80" cy="80" rx="4.2" ry="2.8" fill={skinShade} />
      )}
      {noseStyle === 'round' && (
        <circle cx="80" cy="79" r="4" fill={skinShade} />
      )}
      {noseStyle === 'bridge' && (
        <path d="M80 68 L80 82 Q83 83 84 80" stroke={skinShade} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      )}
      {noseStyle === 'wide' && (
        <path d="M75 81 Q80 76 85 81 Q80 85 75 81 Z" fill={skinShade} />
      )}
      {noseStyle === 'pointed' && (
        <polygon points="80,71 84,82 76,82" fill={skinShade} />
      )}
      {noseStyle === 'upturned' && (
        <path d="M76 80 Q80 76 84 80" stroke={skinShade} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {noseStyle === 'diamond' && (
        <polygon points="80,73 84,78 80,83 76,78" fill={skinShade} />
      )}

      {/* MOUTH / EXPRESSION */}
      {face === 'smile' && (
        <path d="M71 89 Q77 95 85 90" stroke={skinShade} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      )}
      {face === 'smirk' && (
        <path d="M74 91 Q84 93 90 87" stroke={skinShade} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      )}
      {face === 'grin' && (
        <path d="M70 88 Q80 99 90 88 Z" fill="#EF4444" stroke={skinShade} strokeWidth="2.4" strokeLinejoin="round" />
      )}
      {face === 'wink' && (
        <path d="M71 89 Q80 96 89 89" stroke={skinShade} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      )}
      {face === 'surprised' && (
        <ellipse cx="80" cy="92" rx="5.5" ry="6.5" fill={skinShade} />
      )}
      {face === 'calm' && (
        <path d="M73 91 Q80 93 87 91" stroke={skinShade} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      )}
      {face === 'tongue' && (
        <g>
          <path d="M70 89 Q80 94 90 89" stroke={skinShade} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M76 91 V96 C76 99, 84 99, 84 96 V91 Z" fill="#FB7185" />
        </g>
      )}
      {face === 'cat' && (
        <path d="M70 89 Q75 94 80 89 Q85 94 90 89" stroke={skinShade} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {face === 'whistle' && (
        <circle cx="83" cy="92" r="3.6" fill={skinShade} />
      )}
      {face === 'kiss' && (
        <path d="M75 90 Q78 88 80 90 Q82 88 85 90 Q82 95 80 93 Q78 95 75 90 Z" fill="#F43F5E" />
      )}
      {face === 'vampire' && (
        <g>
          <path d="M70 89 Q80 95 90 89" stroke={skinShade} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <polygon points="73,90 76,90 74.5,96" fill="white" />
          <polygon points="84,90 87,90 85.5,96" fill="white" />
        </g>
      )}
      {face === 'yawn' && (
        <ellipse cx="80" cy="93" rx="6" ry="7" fill="#FB7185" stroke={skinShade} strokeWidth="2.2" />
      )}

      {/* MUSTACHE */}
      {(beard === 'mustache' || beard === 'fullbeard' || beard === 'bushy' || beard === 'vandyke' || beard === 'anchor') && (
        <path d="M63 87 Q71 80 80 85 Q89 80 97 87 Q89 91 80 88 Q71 91 63 87 Z" fill={beardCol} />
      )}
      {beard === 'handlebar' && (
        <path d="M56 85 C62 93, 72 89, 80 85 C88 89, 98 93, 104 85 C98 83, 90 82, 80 84 C70 82, 62 83, 56 85 Z" fill={beardCol} />
      )}

      {/* GLASSES */}
      {glasses === 'round' && (
        <g stroke={glassesCol} strokeWidth="3.4" fill="white" fillOpacity="0.14">
          <circle cx="69" cy="65" r="11.5" />
          <circle cx="91" cy="65" r="11.5" />
          <line x1="79.5" y1="65" x2="80.5" y2="65" />
          <line x1="44" y1="63" x2="57.5" y2="65" />
          <line x1="102.5" y1="65" x2="116" y2="63" />
        </g>
      )}
      {glasses === 'square' && (
        <g stroke={glassesCol} strokeWidth="3.4" fill="white" fillOpacity="0.14">
          <rect x="57" y="55" width="21" height="17" rx="4" />
          <rect x="82" y="55" width="21" height="17" rx="4" />
          <line x1="78" y1="63" x2="82" y2="63" />
          <line x1="44" y1="61" x2="57" y2="62" />
          <line x1="103" y1="62" x2="116" y2="61" />
        </g>
      )}
      {glasses === 'half' && (
        <g stroke={glassesCol} strokeWidth="3.5" fill="none">
          <path d="M58 58 H77 V69 Q67.5 72 58 69 Z" fill="white" fillOpacity="0.14" />
          <path d="M83 58 H102 V69 Q92.5 72 83 69 Z" fill="white" fillOpacity="0.14" />
          <line x1="77" y1="62" x2="83" y2="62" />
        </g>
      )}
      {glasses === 'shades' && (
        <g>
          <rect x="56" y="54" width="22" height="18" rx="5" fill="#18181B" stroke={glassesCol} strokeWidth="2.5" />
          <rect x="82" y="54" width="22" height="18" rx="5" fill="#18181B" stroke={glassesCol} strokeWidth="2.5" />
          <line x1="78" y1="61" x2="82" y2="61" stroke={glassesCol} strokeWidth="3" />
          <line x1="60" y1="58" x2="67" y2="67" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="58" x2="93" y2="67" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {glasses === 'oval' && (
        <g stroke={glassesCol} strokeWidth="3.2" fill="white" fillOpacity="0.14">
          <ellipse cx="68" cy="65" rx="10.5" ry="9" />
          <ellipse cx="92" cy="65" rx="10.5" ry="9" />
          <line x1="78.5" y1="64" x2="81.5" y2="64" />
        </g>
      )}
      {glasses === 'aviator' && (
        <g stroke={glassesCol} strokeWidth="3" fill={glassesCol} fillOpacity="0.22">
          <path d="M56 56 H78 L75 72 Q66 77 58 70 Z" />
          <path d="M82 56 H104 L102 70 Q94 77 85 72 Z" />
          <line x1="78" y1="58" x2="82" y2="58" />
        </g>
      )}
      {glasses === 'catEye' && (
        <g stroke={glassesCol} strokeWidth="3.2" fill="white" fillOpacity="0.14">
          <path d="M54 55 L77 59 L75 71 Q64 74 57 67 Z" />
          <path d="M106 55 L83 59 L85 71 Q96 74 103 67 Z" />
          <line x1="77" y1="62" x2="83" y2="62" />
        </g>
      )}
      {glasses === 'pixel' && (
        <g fill="#18181B">
          <rect x="56" y="57" width="22" height="11" />
          <rect x="82" y="57" width="22" height="11" />
          <rect x="78" y="59" width="4" height="3" />
          <rect x="59" y="60" width="4" height="2" fill="white" />
          <rect x="85" y="60" width="4" height="2" fill="white" />
        </g>
      )}
      {glasses === 'monocle' && (
        <g>
          <circle cx="92" cy="65" r="11" stroke="#FACC15" strokeWidth="3" fill="white" fillOpacity="0.16" />
          <path d="M102 68 Q106 88 102 106" stroke="#FACC15" strokeWidth="1.8" fill="none" />
        </g>
      )}

      {/* FACE / HEAD ACCESSORIES */}
      {faceAcc === 'headphones' && (
        <g>
          <path d="M36 74 V56 C36 28, 55 18, 80 18 C105 18, 124 28, 124 56 V74" stroke="#F8FAFC" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="30" y="62" width="12" height="24" rx="6" fill="#38BDF8" stroke="white" strokeWidth="2" />
          <rect x="118" y="62" width="12" height="24" rx="6" fill="#38BDF8" stroke="white" strokeWidth="2" />
        </g>
      )}
      {faceAcc === 'mic' && (
        <g>
          <path d="M38 74 V56 C38 30, 56 20, 80 20 C104 20, 122 30, 122 56 V74" stroke="#334155" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="32" y="64" width="11" height="20" rx="5" fill="#1CB0F6" />
          <path d="M37 82 Q52 94 74 93" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="76" cy="93" r="3.5" fill="#1CB0F6" />
        </g>
      )}
      {faceAcc === 'headband' && (
        <path d="M44 48 Q80 41 116 48 L116 55 Q80 48 44 55 Z" fill={hatCol} />
      )}
      {faceAcc === 'flower' && (
        <g transform="translate(112, 46)">
          <circle cx="0" cy="-6" r="4.5" fill="#F472B6" />
          <circle cx="6" cy="-1" r="4.5" fill="#F472B6" />
          <circle cx="3" cy="6" r="4.5" fill="#F472B6" />
          <circle cx="-4" cy="6" r="4.5" fill="#F472B6" />
          <circle cx="-6" cy="-1" r="4.5" fill="#F472B6" />
          <circle cx="0" cy="1" r="3.5" fill="#FACC15" />
        </g>
      )}
      {faceAcc === 'crown' && (
        <path d="M54 39 L58 20 L70 30 L80 16 L90 30 L102 20 L106 39 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round" />
      )}
      {faceAcc === 'horns' && (
        <g fill="#E11D48" stroke="#9F1239" strokeWidth="1.8">
          <path d="M50 42 C40 30, 42 18, 52 14 C48 24, 53 32, 60 39 Z" />
          <path d="M110 42 C120 30, 118 18, 108 14 C112 24, 107 32, 100 39 Z" />
        </g>
      )}
      {faceAcc === 'halo' && (
        <ellipse cx="80" cy="20" rx="26" ry="7" fill="none" stroke="#FACC15" strokeWidth="4.5" />
      )}

      {/* HEADWEAR / HATS */}
      {hat === 'cap' && (
        <g>
          <path d="M43 48 C45 27, 62 22, 80 22 C98 22, 115 27, 117 48 Z" fill={hatCol} />
          <path d="M41 47 Q80 40 124 49 Q110 53 41 49 Z" fill={hatShade} />
        </g>
      )}
      {hat === 'duocap' && (
        <g>
          <path d="M43 48 C45 26, 62 21, 80 21 C98 21, 115 26, 117 48 Z" fill={hatCol} />
          <path d="M40 47 Q80 39 124 49 Q108 53 40 49 Z" fill={hatShade} />
          <text x="80" y="39" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif">
            66
          </text>
        </g>
      )}
      {hat === 'sidecap' && (
        <g>
          <path d="M44 48 C46 27, 64 22, 84 23 C103 24, 115 31, 116 48 Z" fill={hatCol} />
          <rect x="35" y="42" width="44" height="7" rx="3.5" fill={hatShade} />
        </g>
      )}
      {hat === 'beanie' && (
        <g>
          <path d="M43 49 C45 27, 60 21, 80 21 C100 21, 115 27, 117 49 Z" fill={hatCol} />
          <rect x="41" y="42" width="78" height="11" rx="5.5" fill={hatShade} />
          <line x1="56" y1="44" x2="56" y2="51" stroke={hatCol} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="44" x2="68" y2="51" stroke={hatCol} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="44" x2="80" y2="51" stroke={hatCol} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="92" y1="44" x2="92" y2="51" stroke={hatCol} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="104" y1="44" x2="104" y2="51" stroke={hatCol} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {hat === 'tophat' && (
        <g>
          <rect x="54" y="12" width="52" height="31" rx="6" fill={hatCol} />
          <rect x="54" y="34" width="52" height="6" fill={hatShade} />
          <rect x="40" y="40" width="80" height="7" rx="3.5" fill={hatCol} />
        </g>
      )}
      {hat === 'beret' && (
        <g>
          <path d="M40 46 C38 26, 64 17, 94 23 C114 28, 118 41, 108 46 Z" fill={hatCol} />
          <line x1="78" y1="20" x2="81" y2="14" stroke={hatShade} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {hat === 'gradcap' && (
        <g>
          <polygon points="80,14 38,29 80,43 122,29" fill={hatCol} />
          <rect x="56" y="36" width="48" height="11" rx="4" fill={hatShade} />
          <line x1="115" y1="30" x2="117" y2="50" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
          <circle cx="117" cy="52" r="3.5" fill="#FACC15" />
        </g>
      )}
      {hat === 'wizard' && (
        <g>
          <polygon points="80,6 52,44 108,44" fill={hatCol} />
          <ellipse cx="80" cy="44" rx="42" ry="6" fill={hatShade} />
          <polygon points="80,22 82,27 87,27 83,30 85,35 80,32 75,35 77,30 73,27 78,27" fill="#FACC15" />
        </g>
      )}
      {hat === 'ushanka' && (
        <g>
          <path d="M42 46 C42 25, 60 20, 80 20 C100 20, 118 25, 118 46 Z" fill={hatCol} />
          <rect x="34" y="44" width="12" height="32" rx="6" fill={hatShade} />
          <rect x="114" y="44" width="12" height="32" rx="6" fill={hatShade} />
          <rect x="46" y="32" width="68" height="16" rx="6" fill={hatShade} />
        </g>
      )}
      {hat === 'astronaut' && (
        <g>
          <circle cx="80" cy="70" r="46" fill="#E0F2FE" fillOpacity="0.22" stroke="#94A3B8" strokeWidth="4" />
          <path d="M44 50 Q58 34 80 34" stroke="white" strokeOpacity="0.55" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {hat === 'chef' && (
        <g fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2">
          <circle cx="62" cy="24" r="13" />
          <circle cx="80" cy="20" r="15" />
          <circle cx="98" cy="24" r="13" />
          <rect x="48" y="32" width="64" height="15" rx="4" />
        </g>
      )}

      {/* SHOULDER PET COMPANIONS */}
      {pet === 'owl' && (
        <g transform="translate(110, 96)">
          <path d="M6 12 L4 4 L12 8 Z" fill="#003C96" />
          <path d="M26 12 L28 4 L20 8 Z" fill="#003C96" />
          <ellipse cx="16" cy="20" rx="12" ry="13" fill="#0056D2" />
          <circle cx="11.5" cy="17" r="4" fill="white" /><circle cx="20.5" cy="17" r="4" fill="white" />
          <circle cx="12" cy="17" r="2" fill="#0F172A" /><circle cx="20" cy="17" r="2" fill="#0F172A" />
          <polygon points="14,20 18,20 16,24" fill="#FBBF24" />
        </g>
      )}
      {pet === 'cat' && (
        <g transform="translate(110, 96)">
          <polygon points="6,14 8,4 14,10" fill="#FB923C" />
          <polygon points="26,14 24,4 18,10" fill="#FB923C" />
          <circle cx="16" cy="20" r="11.5" fill="#FDBA74" />
          <circle cx="12" cy="18" r="1.8" fill="#18181B" /><circle cx="20" cy="18" r="1.8" fill="#18181B" />
          <polygon points="15,21 17,21 16,23" fill="#F43F5E" />
        </g>
      )}
      {pet === 'dog' && (
        <g transform="translate(110, 96)">
          <ellipse cx="6" cy="19" rx="4" ry="8" fill="#92400E" />
          <ellipse cx="26" cy="19" rx="4" ry="8" fill="#92400E" />
          <circle cx="16" cy="20" r="11" fill="#D97706" />
          <circle cx="12" cy="18" r="1.8" fill="#18181B" /><circle cx="20" cy="18" r="1.8" fill="#18181B" />
          <ellipse cx="16" cy="22" rx="2.6" ry="1.8" fill="#18181B" />
        </g>
      )}
      {pet === 'drone' && (
        <g transform="translate(110, 88)">
          <line x1="16" y1="4" x2="16" y2="10" stroke="#94A3B8" strokeWidth="2.5" />
          <circle cx="16" cy="3" r="2.5" fill="#22D3EE" />
          <rect x="6" y="10" width="20" height="16" rx="6" fill="#334155" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="12" cy="18" r="2.2" fill="#38BDF8" /><circle cx="20" cy="18" r="2.2" fill="#38BDF8" />
        </g>
      )}
      {pet === 'butterfly' && (
        <g transform="translate(116, 86)">
          <ellipse cx="9" cy="12" rx="7" ry="9" transform="rotate(-25 9 12)" fill="#F472B6" />
          <ellipse cx="21" cy="12" rx="7" ry="9" transform="rotate(25 21 12)" fill="#F472B6" />
          <rect x="14" y="8" width="2" height="14" rx="1" fill="#18181B" />
        </g>
      )}

      {/* OPTIONAL AVATAR FRAME OVERLAY */}
      {includeBgPattern && frame === 'double' && (
        <rect x="4" y="4" width="152" height="152" rx="24" fill="none" stroke="white" strokeOpacity="0.8" strokeWidth="4" />
      )}
      {includeBgPattern && frame === 'neon' && (
        <rect x="4" y="4" width="152" height="152" rx="24" fill="none" stroke="#22D3EE" strokeWidth="5" />
      )}
      {includeBgPattern && frame === 'gold' && (
        <rect x="4" y="4" width="152" height="152" rx="24" fill="none" stroke="#FACC15" strokeWidth="6" />
      )}
      {includeBgPattern && frame === 'stars' && (
        <g fill="#FACC15">
          <circle cx="14" cy="14" r="4" /><circle cx="146" cy="14" r="4" />
          <circle cx="14" cy="146" r="4" /><circle cx="146" cy="146" r="4" />
          <rect x="4" y="4" width="152" height="152" rx="24" fill="none" stroke="#FACC15" strokeWidth="3" strokeDasharray="8 6" />
        </g>
      )}
      {includeBgPattern && frame === 'comic' && (
        <rect x="4" y="4" width="152" height="152" rx="16" fill="none" stroke="#18181B" strokeWidth="7" />
      )}
    </svg>
  );
};

export const CharacterAvatarSvg: React.FC<{
  config: CharacterAvatarConfig;
  className?: string;
  includeBgPattern?: boolean;
}> = ({ config, className = 'w-full h-full', includeBgPattern = false }) => {
  if (!config.characterId || config.characterId === 'human-builder') {
    return <HumanBuilderAvatarSvg config={config} className={className} includeBgPattern={includeBgPattern} />;
  }

  const preset =
    DUOWINDO_CHARACTER_PRESETS.find((p) => p.id === config.characterId) ||
    DUOWINDO_CHARACTER_PRESETS[0];

  return (
    <svg viewBox="0 0 120 120" className={className} aria-label={preset.nameEn}>
      <circle cx="60" cy="64" r="48" fill="white" fillOpacity="0.08" />

      {config.headwear === 'helmet' && (
        <circle cx="60" cy="64" r="46" fill="#E0F2FE" fillOpacity="0.22" stroke="#BAE6FD" strokeWidth="3" />
      )}

      {preset.species === 'owl' && (
        <g>
          <path d="M27 42 L22 23 L42 33 Z" fill={preset.secondaryColor} />
          <path d="M93 42 L98 23 L78 33 Z" fill={preset.secondaryColor} />
          <ellipse cx="22" cy="79" rx="10" ry="20" transform="rotate(14 22 79)" fill={preset.secondaryColor} />
          <ellipse cx="98" cy="79" rx="10" ry="20" transform="rotate(-14 98 79)" fill={preset.secondaryColor} />
          <path d="M24 72 C24 38, 38 26, 60 26 C82 26, 96 38, 96 72 C96 102, 82 114, 60 114 C38 114, 24 102, 24 72 Z" fill={preset.primaryColor} />
          <ellipse cx="60" cy="94" rx="22" ry="17" fill={preset.accentColor} fillOpacity="0.28" />
          <path d="M30 56 C30 42, 46 37, 60 48 C74 37, 90 42, 90 56 C90 70, 76 76, 60 76 C44 76, 30 70, 30 56 Z" fill={preset.accentColor} fillOpacity="0.22" />
          <circle cx="45" cy="56" r="12.5" fill="white" />
          <circle cx="75" cy="56" r="12.5" fill="white" />
          {config.expression === 'happy' && (
            <>
              <circle cx="46" cy="56" r="6.2" fill="#0F172A" />
              <circle cx="74" cy="56" r="6.2" fill="#0F172A" />
              <circle cx="48" cy="53.5" r="2.2" fill="white" />
              <circle cx="76" cy="53.5" r="2.2" fill="white" />
            </>
          )}
          {config.expression === 'cool' && (
            <>
              <circle cx="46" cy="57" r="6" fill="#0F172A" />
              <circle cx="74" cy="57" r="6" fill="#0F172A" />
              <path d="M34 48 L55 51" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M86 48 L65 51" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}
          {config.expression === 'smart' && (
            <>
              <circle cx="45" cy="55" r="5.5" fill="#0F172A" />
              <circle cx="75" cy="55" r="5.5" fill="#0F172A" />
              <circle cx="47" cy="53" r="2" fill="white" />
              <circle cx="77" cy="53" r="2" fill="white" />
              <path d="M35 44 Q45 40 55 44" stroke="#0F172A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <path d="M65 44 Q75 40 85 44" stroke="#0F172A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </>
          )}
          {config.expression === 'wink' && (
            <>
              <circle cx="46" cy="56" r="6.2" fill="#0F172A" />
              <circle cx="48" cy="53.5" r="2.2" fill="white" />
              <path d="M66 56 Q75 49 84 56" stroke="#0F172A" strokeWidth="3.8" fill="none" strokeLinecap="round" />
            </>
          )}
          <path d="M54 63 L66 63 L60 73 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}

      {preset.species === 'fox' && (
        <g>
          <path d="M26 48 L22 18 L48 34 Z" fill={preset.primaryColor} />
          <path d="M94 48 L98 18 L72 34 Z" fill={preset.primaryColor} />
          <path d="M29 41 L27 25 L41 35 Z" fill="#FFF7ED" />
          <path d="M91 41 L93 25 L79 35 Z" fill="#FFF7ED" />
          <path d="M26 74 C26 42, 42 32, 60 32 C78 32, 94 42, 94 74 C94 102, 79 112, 60 112 C41 112, 26 102, 26 74 Z" fill={preset.primaryColor} />
          <path d="M28 70 Q44 64 60 80 Q76 64 92 70 Q90 98 60 106 Q30 98 28 70 Z" fill="#FFF7ED" />
          <circle cx="45" cy="58" r="7.5" fill="white" />
          <circle cx="75" cy="58" r="7.5" fill="white" />
          <circle cx="45" cy="58" r="4.5" fill="#0F172A" />
          {config.expression === 'wink' ? (
            <path d="M68 58 Q75 52 82 58" stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            <circle cx="75" cy="58" r="4.5" fill="#0F172A" />
          )}
          <circle cx="46.5" cy="56" r="1.6" fill="white" />
          {config.expression !== 'wink' && <circle cx="76.5" cy="56" r="1.6" fill="white" />}
          <ellipse cx="60" cy="73" rx="5.5" ry="4" fill="#1E293B" />
          <path d="M52 82 Q60 89 68 82" stroke="#1E293B" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </g>
      )}

      {preset.species === 'bot' && (
        <g>
          <line x1="60" y1="16" x2="60" y2="30" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="14" r="5.5" fill="#38BDF8" />
          <rect x="26" y="30" width="68" height="60" rx="18" fill={preset.primaryColor} stroke={preset.secondaryColor} strokeWidth="3" />
          <rect x="34" y="92" width="52" height="22" rx="10" fill={preset.secondaryColor} />
          <rect x="34" y="42" width="52" height="34" rx="11" fill="#0F172A" />
          <circle cx="48" cy="57" r="5.5" fill="#38BDF8" />
          {config.expression === 'wink' ? (
            <path d="M66 57 H78" stroke="#38BDF8" strokeWidth="3.8" strokeLinecap="round" />
          ) : (
            <circle cx="72" cy="57" r="5.5" fill="#38BDF8" />
          )}
          <path d="M50 67 Q60 73 70 67" stroke="#22D3EE" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}

      {config.accessory === 'glasses' && (
        <g stroke="#1E293B" strokeWidth="3" fill="white" fillOpacity="0.18">
          <circle cx="45" cy="56" r="13.5" />
          <circle cx="75" cy="56" r="13.5" />
          <line x1="58.5" y1="56" x2="61.5" y2="56" />
        </g>
      )}
      {config.accessory === 'sunglasses' && (
        <g>
          <rect x="30" y="46" width="27" height="17" rx="5" fill="#0F172A" stroke="#F8FAFC" strokeWidth="2" />
          <rect x="63" y="46" width="27" height="17" rx="5" fill="#0F172A" stroke="#F8FAFC" strokeWidth="2" />
          <line x1="57" y1="53" x2="63" y2="53" stroke="#F8FAFC" strokeWidth="2.5" />
        </g>
      )}
      {config.accessory === 'visor' && (
        <g>
          <rect x="29" y="45" width="62" height="18" rx="8" fill="#06B6D4" fillOpacity="0.72" stroke="#CFFAFE" strokeWidth="2.5" />
        </g>
      )}
      {config.accessory === 'headphones' && (
        <g>
          <path d="M21 62 V50 C21 26, 37 16, 60 16 C83 16, 99 26, 99 50 V62" stroke="#F8FAFC" strokeWidth="6.5" fill="none" strokeLinecap="round" />
          <rect x="13" y="48" width="14" height="26" rx="7" fill="#38BDF8" stroke="white" strokeWidth="2" />
          <rect x="93" y="48" width="14" height="26" rx="7" fill="#38BDF8" stroke="white" strokeWidth="2" />
        </g>
      )}

      {config.headwear === 'crown' && (
        <path
          d="M38 30 L42 13 L53 23 L60 10 L67 23 L78 13 L82 30 Z"
          fill="#FACC15"
          stroke="#CA8A04"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}
      {config.headwear === 'gradcap' && (
        <g>
          <polygon points="60,8 28,20 60,31 92,20" fill="#1E293B" stroke="#334155" strokeWidth="2" />
          <rect x="44" y="24" width="32" height="8" rx="3" fill="#0F172A" />
          <line x1="86" y1="21" x2="88" y2="36" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="88" cy="37" r="2.8" fill="#FACC15" />
        </g>
      )}
      {config.headwear === 'beret' && (
        <g>
          <path d="M32 32 C30 17, 52 10, 74 15 C90 19, 92 29, 84 33 Z" fill="#EC4899" stroke="#9D174D" strokeWidth="2" />
          <line x1="59" y1="12" x2="61" y2="7" stroke="#9D174D" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

interface ProfileAvatarDisplayProps {
  user: Pick<UserProgress, 'name' | 'avatarColor' | 'avatarUrl' | 'avatarImage' | 'avatarIcon' | 'avatarMode' | 'characterAvatar'>;
  className?: string;
  textClassName?: string;
}

export const ProfileAvatarDisplay: React.FC<ProfileAvatarDisplayProps> = ({
  user,
  className = 'w-14 h-14',
  textClassName = 'text-2xl'
}) => {
  const savedPhoto = user.avatarUrl || user.avatarImage;
  const effectiveMode =
    user.avatarMode ||
    (savedPhoto ? 'photo' : user.characterAvatar ? 'character' : user.avatarIcon ? 'icon' : 'icon');

  const isCharMode = effectiveMode === 'character' && Boolean(user.characterAvatar);
  const customBgHex = isCharMode ? user.characterAvatar?.bgHex : undefined;
  const bgClass =
    isCharMode && user.characterAvatar?.bgColor
      ? user.characterAvatar.bgColor
      : user.avatarColor || 'bg-duo-blue';

  return (
    <div
      className={`${customBgHex ? '' : bgClass} ${className} flex items-center justify-center font-bold overflow-hidden select-none`}
      style={customBgHex ? { backgroundColor: customBgHex } : undefined}
    >
      {isCharMode && user.characterAvatar ? (
        user.characterAvatar.customImageUrl ? (
          <img
            src={user.characterAvatar.customImageUrl}
            alt={user.name || 'Character Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <CharacterAvatarSvg
            config={user.characterAvatar}
            includeBgPattern={true}
            className={`w-full h-full ${user.characterAvatar.characterId === 'human-builder' || !user.characterAvatar.characterId ? '' : 'p-1'}`}
          />
        )
      ) : effectiveMode === 'photo' && savedPhoto ? (
        <img src={savedPhoto} alt={user.name || 'Profile Photo'} className="w-full h-full object-cover" />
      ) : savedPhoto && effectiveMode !== 'icon' ? (
        <img src={savedPhoto} alt={user.name || 'Profile Photo'} className="w-full h-full object-cover" />
      ) : user.avatarIcon ? (
        <span className={textClassName}>{user.avatarIcon}</span>
      ) : (
        <span className={textClassName}>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
      )}
    </div>
  );
};

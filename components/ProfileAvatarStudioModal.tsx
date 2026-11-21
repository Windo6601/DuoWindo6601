import React, { useState, useRef, useEffect } from 'react';
import { CharacterAvatarConfig, UserProgress } from '../types';
import { CloseIcon, CameraIcon, SparklesIcon, TrashIcon } from './Icons';
import {
  CharacterAvatarSvg,
  HumanBuilderAvatarSvg,
  DEFAULT_CHARACTER_AVATAR,
  DUOWINDO_CHARACTER_PRESETS
} from './ProfileAvatarDisplay';

interface ProfileAvatarStudioModalProps {
  isOpen: boolean;
  initialTab?: 'character' | 'photo';
  onClose: () => void;
  user: UserProgress;
  onApplyAvatar: (patch: {
    avatarMode: 'photo' | 'character' | 'icon';
    avatarColor: string;
    avatarUrl?: string;
    avatarImage?: string;
    characterAvatar: CharacterAvatarConfig;
  }) => Promise<void> | void;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  isLightMode?: boolean;
}

type BuilderCategory =
  | 'skin'
  | 'headShape'
  | 'ears'
  | 'body'
  | 'eyes'
  | 'brows'
  | 'nose'
  | 'mouth'
  | 'cheeks'
  | 'marks'
  | 'hair'
  | 'bangs'
  | 'glasses'
  | 'facialHair'
  | 'earrings'
  | 'neckwear'
  | 'accessories'
  | 'hat'
  | 'outfit'
  | 'aura'
  | 'pet'
  | 'bg';

const SKIN_SWATCHES = [
  '#4B231D', '#5A2D26', '#6D3830', '#723B32', '#7A3F32', '#8D4B22',
  '#9E5338', '#9A5E28', '#AE6D47', '#BD7B3A', '#D0835A', '#DC946B',
  '#EC9D7C', '#EA9B52', '#FDA172', '#F8B296', '#FFC2A1', '#FFBDB2',
  '#FED4AE', '#FFE4D6', '#A78BFA', '#6EE7B7', '#7DD3FC', '#F9A8D4'
];

const EYE_SWATCHES = [
  '#27272A', '#3F3F46', '#713F12', '#9A3412', '#A16207', '#4D7C0F',
  '#0D9488', '#0284C7', '#1D4ED8', '#7C3AED', '#DB2777', '#E11D48'
];

const HAIR_AND_BEARD_SWATCHES = [
  '#18181B', '#3F3F46', '#5C3A21', '#6E2822', '#7C3D18', '#9A3412',
  '#B1403D', '#8E6E64', '#D97706', '#FACC15', '#D1D5DB', '#F8FAFC',
  '#3B82F6', '#06B6D4', '#EC4899', '#8B5CF6'
];

const GLASSES_SWATCHES = [
  '#18181B', '#8B5CF6', '#1D4ED8', '#0284C7', '#0D9488',
  '#65A30D', '#F59E0B', '#EF4444', '#F472B6', '#FACC15', '#E2E8F0', '#FFFFFF'
];

const HAT_SWATCHES = [
  '#9333EA', '#0284C7', '#1CB0F6', '#65A30D', '#FACC15', '#F97316',
  '#BE123C', '#EC4899', '#18181B', '#0D9488', '#4F46E5', '#F8FAFC'
];

const OUTFIT_SWATCHES = [
  '#C084CC', '#3B9ED8', '#1CB0F6', '#76B82A', '#FACC15', '#F59E0B',
  '#BE2A4F', '#FBCFE8', '#F1F5F9', '#3F3F46', '#1E293B', '#0D9488',
  '#4F46E5', '#EC4899', '#EA580C', '#06B6D4'
];

const BG_HEX_SWATCHES = [
  '#E5E7EB', '#CBD5E1', '#B8B8B8', '#525252', '#1E293B', '#0F172A',
  '#F3E8FF', '#D8B4FE', '#8B5CF6', '#4C1D95',
  '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#1D4ED8',
  '#D1FAE5', '#6EE7B7', '#4ADE80', '#059669',
  '#D9F99D', '#A3E635', '#65A30D', '#FEF08A',
  '#FCD34D', '#D97706', '#FFE4E6', '#FCA5A5', '#FB7185'
];

const PRESET_BG_COLORS = [
  { labelRu: 'Синий', labelEn: 'Blue', value: 'bg-duo-blue' },
  { labelRu: 'Зелёный', labelEn: 'Green', value: 'bg-duo-green' },
  { labelRu: 'Фиолетовый', labelEn: 'Purple', value: 'bg-purple-600' },
  { labelRu: 'Розовый', labelEn: 'Rose', value: 'bg-rose-600' },
  { labelRu: 'Янтарный', labelEn: 'Amber', value: 'bg-amber-500' },
  { labelRu: 'Индиго', labelEn: 'Indigo', value: 'bg-indigo-600' },
  { labelRu: 'Бирюзовый', labelEn: 'Teal', value: 'bg-teal-600' },
  { labelRu: 'Тёмный', labelEn: 'Slate', value: 'bg-slate-800' }
];

const HEAD_SHAPES: { id: NonNullable<CharacterAvatarConfig['headShape']>; ru: string; en: string }[] = [
  { id: 'rounded', ru: 'Классика', en: 'Classic' },
  { id: 'round', ru: 'Круглое', en: 'Round' },
  { id: 'oval', ru: 'Овальное', en: 'Oval' },
  { id: 'chiseled', ru: 'Чёткое', en: 'Square' },
  { id: 'tall', ru: 'Вытянутое', en: 'Tall' },
  { id: 'heart', ru: 'Сердце', en: 'Heart' }
];

const EAR_OPTIONS: { id: NonNullable<CharacterAvatarConfig['earStyle']>; ru: string; en: string }[] = [
  { id: 'normal', ru: 'Обычные', en: 'Normal' },
  { id: 'small', ru: 'Маленькие', en: 'Small' },
  { id: 'large', ru: 'Большие', en: 'Large' },
  { id: 'elf', ru: 'Эльфийские', en: 'Elf' },
  { id: 'cat', ru: 'Кошачьи', en: 'Cat' },
  { id: 'cyber', ru: 'Кибер-уши', en: 'Cyber' }
];

const BODY_OPTIONS: { id: NonNullable<CharacterAvatarConfig['bodyStyle']>; ru: string; en: string }[] = [
  { id: 'slim', ru: 'Узкие плечи', en: 'Slim' },
  { id: 'medium', ru: 'Средние', en: 'Medium' },
  { id: 'broad', ru: 'Широкие', en: 'Broad' },
  { id: 'collar', ru: 'Рубашка', en: 'Collar' },
  { id: 'hoodie', ru: 'Худи', en: 'Hoodie' },
  { id: 'wide', ru: 'Объёмный', en: 'Wide' },
  { id: 'jacket', ru: 'Пиджак', en: 'Jacket' },
  { id: 'sweater', ru: 'Свитер', en: 'Sweater' },
  { id: 'scarf', ru: 'С шарфом', en: 'Scarf' },
  { id: 'turtleneck', ru: 'Водолазка', en: 'Turtleneck' }
];

const EYE_STYLE_OPTIONS: { id: NonNullable<CharacterAvatarConfig['eyeStyle']>; ru: string; en: string }[] = [
  { id: 'classic', ru: 'Обычные', en: 'Classic' },
  { id: 'happy', ru: 'Весёлые', en: 'Happy' },
  { id: 'wink', ru: 'Подмиг.', en: 'Wink' },
  { id: 'calm', ru: 'Спокойные', en: 'Calm' },
  { id: 'wide', ru: 'Широкие', en: 'Wide' },
  { id: 'lashes', ru: 'С ресницами', en: 'Lashes' },
  { id: 'starry', ru: 'Блестящие', en: 'Starry' },
  { id: 'focused', ru: 'Строгие', en: 'Focused' },
  { id: 'heart', ru: 'Сердечки', en: 'Hearts' },
  { id: 'cyber', ru: 'Кибер-глаза', en: 'Cyber' }
];

const BROW_OPTIONS: { id: NonNullable<CharacterAvatarConfig['eyebrowStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Без бровей', en: 'None' },
  { id: 'natural', ru: 'Обычные', en: 'Natural' },
  { id: 'thick', ru: 'Густые', en: 'Thick' },
  { id: 'arched', ru: 'Дугой', en: 'Arched' },
  { id: 'serious', ru: 'Серьёзные', en: 'Serious' },
  { id: 'raised', ru: 'Удивлённые', en: 'Raised' },
  { id: 'unibrow', ru: 'Монобровь', en: 'Unibrow' },
  { id: 'slit', ru: 'С пробором', en: 'Slit' }
];

const NOSE_OPTIONS: { id: NonNullable<CharacterAvatarConfig['noseStyle']>; ru: string; en: string }[] = [
  { id: 'drop', ru: 'Капелька', en: 'Drop' },
  { id: 'button', ru: 'Кнопка', en: 'Button' },
  { id: 'round', ru: 'Круглый', en: 'Round' },
  { id: 'bridge', ru: 'Линия', en: 'Bridge' },
  { id: 'wide', ru: 'Широкий', en: 'Wide' },
  { id: 'pointed', ru: 'Острый', en: 'Pointed' },
  { id: 'upturned', ru: 'Курносый', en: 'Upturned' },
  { id: 'diamond', ru: 'Геометрия', en: 'Diamond' }
];

const MOUTH_OPTIONS: { id: NonNullable<CharacterAvatarConfig['faceStyle']>; ru: string; en: string }[] = [
  { id: 'smile', ru: 'Улыбка', en: 'Smile' },
  { id: 'smirk', ru: 'Ухмылка', en: 'Smirk' },
  { id: 'grin', ru: 'Смех', en: 'Grin' },
  { id: 'wink', ru: 'Довольный', en: 'Happy' },
  { id: 'surprised', ru: 'Ого!', en: 'Surprised' },
  { id: 'calm', ru: 'Спокойный', en: 'Calm' },
  { id: 'tongue', ru: 'Язычок', en: 'Playful' },
  { id: 'cat', ru: 'Котик :3', en: 'Cat :3' },
  { id: 'whistle', ru: 'Свист', en: 'Whistle' },
  { id: 'kiss', ru: 'Поцелуй', en: 'Kiss' },
  { id: 'vampire', ru: 'Клычки', en: 'Fangs' },
  { id: 'yawn', ru: 'Зевок', en: 'Yawn' }
];

const CHEEK_OPTIONS: { id: NonNullable<CharacterAvatarConfig['cheekStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Чисто', en: 'None' },
  { id: 'blush', ru: 'Румянец', en: 'Blush' },
  { id: 'freckles', ru: 'Веснушки', en: 'Freckles' },
  { id: 'blushFreckles', ru: 'Румянец+', en: 'Both' },
  { id: 'bandaid', ru: 'Пластырь', en: 'Bandaid' },
  { id: 'mole', ru: 'Родинка', en: 'Mole' },
  { id: 'hearts', ru: 'Сердечки', en: 'Hearts' },
  { id: 'stripes', ru: 'Полоски', en: 'Stripes' }
];

const MARK_OPTIONS: { id: NonNullable<CharacterAvatarConfig['faceMark']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'eyeshadow', ru: 'Тени век', en: 'Eyeshadow' },
  { id: 'eyeliner', ru: 'Стрелки', en: 'Eyeliner' },
  { id: 'scar', ru: 'Шрам', en: 'Scar' },
  { id: 'starMark', ru: 'Звёздочка', en: 'Star' },
  { id: 'heartMark', ru: 'Сердечко', en: 'Heart' },
  { id: 'whiskers', ru: 'Усики', en: 'Whiskers' }
];

const HAIR_OPTIONS: { id: NonNullable<CharacterAvatarConfig['hairStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'Bald' },
  { id: 'buzz', ru: 'Ёжик', en: 'Buzz' },
  { id: 'fade', ru: 'Фейд', en: 'Fade' },
  { id: 'curl', ru: 'Завиток', en: 'Curl' },
  { id: 'pomp', ru: 'Кок', en: 'Pomp' },
  { id: 'side', ru: 'Пробор', en: 'Side' },
  { id: 'bob', ru: 'Каре', en: 'Bob' },
  { id: 'curly', ru: 'Кудри', en: 'Curly' },
  { id: 'bun', ru: 'Пучок', en: 'Bun' },
  { id: 'twintails', ru: 'Хвостики', en: 'Twintails' },
  { id: 'spiky', ru: 'Шипы', en: 'Spiky' },
  { id: 'long', ru: 'Длинные', en: 'Long' },
  { id: 'afro', ru: 'Афро', en: 'Afro' },
  { id: 'mohawk', ru: 'Ирокез', en: 'Mohawk' },
  { id: 'undercut', ru: 'Андеркат', en: 'Undercut' },
  { id: 'ponytail', ru: 'Хвост', en: 'Ponytail' },
  { id: 'dreads', ru: 'Дреды', en: 'Dreads' },
  { id: 'wavy', ru: 'Волны', en: 'Wavy' }
];

const BANGS_OPTIONS: { id: NonNullable<CharacterAvatarConfig['bangsStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Без чёлки', en: 'None' },
  { id: 'straight', ru: 'Прямая', en: 'Straight' },
  { id: 'side', ru: 'Косая', en: 'Side' },
  { id: 'curtains', ru: 'Шторка', en: 'Curtains' },
  { id: 'curly', ru: 'Кудрявая', en: 'Curly' },
  { id: 'strand', ru: 'Пряди', en: 'Strand' }
];

const GLASSES_OPTIONS: { id: NonNullable<CharacterAvatarConfig['glassesStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Без очков', en: 'None' },
  { id: 'round', ru: 'Круглые', en: 'Round' },
  { id: 'square', ru: 'Квадратные', en: 'Square' },
  { id: 'half', ru: 'Половинки', en: 'Half-Rim' },
  { id: 'shades', ru: 'Солнечные', en: 'Shades' },
  { id: 'oval', ru: 'Овальные', en: 'Oval' },
  { id: 'aviator', ru: 'Авиаторы', en: 'Aviator' },
  { id: 'catEye', ru: 'Кошачий глаз', en: 'Cat Eye' },
  { id: 'pixel', ru: 'Пиксельные', en: 'Pixel' },
  { id: 'monocle', ru: 'Монокль', en: 'Monocle' }
];

const FACIAL_HAIR_OPTIONS: { id: NonNullable<CharacterAvatarConfig['facialHairStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'mustache', ru: 'Усы', en: 'Mustache' },
  { id: 'fullbeard', ru: 'Борода', en: 'Full Beard' },
  { id: 'goatee', ru: 'Эспаньолка', en: 'Goatee' },
  { id: 'stubble', ru: 'Щетина', en: 'Stubble' },
  { id: 'bushy', ru: 'Густая', en: 'Bushy' },
  { id: 'handlebar', ru: 'Закрученные', en: 'Handlebar' },
  { id: 'vandyke', ru: 'Ван Дайк', en: 'Van Dyke' },
  { id: 'anchor', ru: 'Якорь', en: 'Anchor' },
  { id: 'mutton', ru: 'Бакенбарды', en: 'Sideburns' }
];

const EARRING_OPTIONS: { id: NonNullable<CharacterAvatarConfig['earringStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'studs', ru: 'Гвоздики', en: 'Studs' },
  { id: 'hoops', ru: 'Кольца', en: 'Hoops' },
  { id: 'stars', ru: 'Звёзды', en: 'Stars' },
  { id: 'drops', ru: 'Подвески', en: 'Drops' },
  { id: 'double', ru: 'Двойные', en: 'Double' }
];

const NECKWEAR_OPTIONS: { id: NonNullable<CharacterAvatarConfig['neckwearStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'tie', ru: 'Галстук', en: 'Tie' },
  { id: 'bowtie', ru: 'Бабочка', en: 'Bowtie' },
  { id: 'chain', ru: 'Цепочка', en: 'Chain' },
  { id: 'pendant', ru: 'Кулон', en: 'Pendant' },
  { id: 'choker', ru: 'Чокер', en: 'Choker' },
  { id: 'scarf', ru: 'Шарф', en: 'Scarf' }
];

const ACCESSORY_OPTIONS: { id: NonNullable<CharacterAvatarConfig['faceAccessory']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'headphones', ru: 'Наушники', en: 'Headphones' },
  { id: 'mic', ru: 'Гарнитура', en: 'Headset' },
  { id: 'studEarrings', ru: 'Гвоздики', en: 'Studs' },
  { id: 'hoopEarrings', ru: 'Кольца', en: 'Hoops' },
  { id: 'headband', ru: 'Повязка', en: 'Headband' },
  { id: 'flower', ru: 'Цветок', en: 'Flower' },
  { id: 'crown', ru: 'Корона', en: 'Crown' },
  { id: 'horns', ru: 'Рожки', en: 'Horns' },
  { id: 'halo', ru: 'Нимб', en: 'Halo' }
];

const HAT_OPTIONS: { id: NonNullable<CharacterAvatarConfig['hatStyle']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'cap', ru: 'Кепка', en: 'Cap' },
  { id: 'duocap', ru: 'Кепка 66', en: '66 Cap' },
  { id: 'sidecap', ru: 'Набок', en: 'Side Cap' },
  { id: 'beanie', ru: 'Шапка', en: 'Beanie' },
  { id: 'tophat', ru: 'Цилиндр', en: 'Top Hat' },
  { id: 'beret', ru: 'Берет', en: 'Beret' },
  { id: 'gradcap', ru: 'Магистр', en: 'Grad Cap' },
  { id: 'wizard', ru: 'Колпак', en: 'Wizard' },
  { id: 'ushanka', ru: 'Ушанка', en: 'Ushanka' },
  { id: 'astronaut', ru: 'Шлем', en: 'Helmet' },
  { id: 'chef', ru: 'Поварской', en: 'Chef' }
];

const DECAL_OPTIONS: { id: NonNullable<CharacterAvatarConfig['outfitDecal']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Без принта', en: 'Plain' },
  { id: 'owl66', ru: 'Эмблема 66', en: '66 Badge' },
  { id: 'star', ru: 'Звезда', en: 'Star' },
  { id: 'lightning', ru: 'Молния', en: 'Bolt' },
  { id: 'heart', ru: 'Сердце', en: 'Heart' },
  { id: 'code', ru: 'Код </>', en: 'Code </>' },
  { id: 'music', ru: 'Нота ♪', en: 'Music ♪' },
  { id: 'chess', ru: 'Шахматы ♞', en: 'Chess' },
  { id: 'globe', ru: 'Глобус 🌐', en: 'Globe' }
];

const AURA_OPTIONS: { id: NonNullable<CharacterAvatarConfig['auraEffect']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'angelWings', ru: 'Крылья', en: 'Angel Wings' },
  { id: 'dragonWings', ru: 'Крылья+', en: 'Dragon Wings' },
  { id: 'cyberRing', ru: 'Неон-круг', en: 'Cyber Ring' },
  { id: 'flame', ru: 'Пламя', en: 'Flame' },
  { id: 'rainbow', ru: 'Радуга', en: 'Rainbow' },
  { id: 'stars', ru: 'Звёзды', en: 'Stars' }
];

const PET_OPTIONS: { id: NonNullable<CharacterAvatarConfig['shoulderPet']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Нет', en: 'None' },
  { id: 'owl', ru: 'Мини-сова', en: 'Mini Owl' },
  { id: 'cat', ru: 'Котик', en: 'Kitty' },
  { id: 'dog', ru: 'Щенок', en: 'Puppy' },
  { id: 'drone', ru: 'Дрон 66', en: 'Drone' },
  { id: 'butterfly', ru: 'Бабочка', en: 'Butterfly' }
];

const BG_PATTERN_OPTIONS: { id: NonNullable<CharacterAvatarConfig['bgPattern']>; ru: string; en: string }[] = [
  { id: 'solid', ru: 'Однотонный', en: 'Solid' },
  { id: 'dots', ru: 'Точки', en: 'Dots' },
  { id: 'stripes', ru: 'Полосы', en: 'Stripes' },
  { id: 'rays', ru: 'Лучи', en: 'Rays' },
  { id: 'grid', ru: 'Сетка', en: 'Grid' },
  { id: 'sparkles', ru: 'Искры', en: 'Sparkles' },
  { id: 'hearts', ru: 'Сердечки', en: 'Hearts' },
  { id: 'waves', ru: 'Волны', en: 'Waves' }
];

const FRAME_OPTIONS: { id: NonNullable<CharacterAvatarConfig['avatarFrame']>; ru: string; en: string }[] = [
  { id: 'none', ru: 'Без рамки', en: 'None' },
  { id: 'double', ru: 'Двойная', en: 'Double' },
  { id: 'neon', ru: 'Неон', en: 'Neon' },
  { id: 'gold', ru: 'Золото', en: 'Gold' },
  { id: 'stars', ru: 'Звёзды', en: 'Stars' },
  { id: 'comic', ru: 'Комикс', en: 'Comic' }
];

const CategoryTabIcon: React.FC<{ id: BuilderCategory; active: boolean }> = ({ id, active }) => {
  const strokeColor = active ? '#1CB0F6' : '#6B7D86';
  switch (id) {
    case 'skin':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="16" cy="16" r="9.5" fill="none" stroke={strokeColor} strokeWidth="2.2" />
          <circle cx="12.5" cy="13.5" r="1.5" fill={strokeColor} />
          <circle cx="19" cy="12" r="1.5" fill={strokeColor} />
          <circle cx="20" cy="18.5" r="1.8" fill={strokeColor} />
        </svg>
      );
    case 'headShape':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path
            d="M8 12 C8 8.5 10.5 6.5 14 6.5 L18 6.5 C21.5 6.5 24 8.5 24 12 L24 20 C24 23.5 21 26 16 26 C11 26 8 23.5 8 20 Z"
            fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinejoin="round"
          />
        </svg>
      );
    case 'ears':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M11 11 C11 7 19 6 21 11 C23 16 19 25 14 25 C11.5 25 10.5 23 11.5 21" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
          <path d="M14.5 12 C16.5 11.5 18 14 16.5 16.5 C15 18.5 14.5 18 14.5 20" fill="none" stroke={strokeColor} strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'body':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="16" cy="11" r="4.8" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <path d="M6.5 26 C7.5 19.5 11.5 17.5 16 17.5 C20.5 17.5 24.5 19.5 25.5 26" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'eyes':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <ellipse cx="11" cy="16" rx="4" ry="5.5" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <ellipse cx="21" cy="16" rx="4" ry="5.5" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <circle cx="12" cy="16" r="1.4" fill={strokeColor} />
          <circle cx="22" cy="16" r="1.4" fill={strokeColor} />
        </svg>
      );
    case 'brows':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M5 13 Q9.5 9.5 14 13" fill="none" stroke={strokeColor} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M18 13 Q22.5 9.5 27 13" fill="none" stroke={strokeColor} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="10" cy="19" r="1.8" fill={strokeColor} />
          <circle cx="22" cy="19" r="1.8" fill={strokeColor} />
        </svg>
      );
    case 'nose':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M16 9 C19.5 15, 20.5 21, 16 21 C11.5 21, 12.5 15, 16 9 Z" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
    case 'mouth':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M7 15 Q16 24 25 15" fill="none" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 15 H23" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'cheeks':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="10" cy="17" r="4" fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx="22" cy="17" r="4" fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx="9" cy="17" r="0.9" fill={strokeColor} /><circle cx="11.5" cy="18" r="0.9" fill={strokeColor} />
          <circle cx="21" cy="17" r="0.9" fill={strokeColor} /><circle cx="23.5" cy="18" r="0.9" fill={strokeColor} />
        </svg>
      );
    case 'marks':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M16 6 L18.5 12.5 L25.5 13 L20 17.5 L21.8 24.5 L16 20.5 L10.2 24.5 L12 17.5 L6.5 13 L13.5 12.5 Z" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'hair':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M7 12 L21 6 C23 5 25 6.5 24.5 8.5 L22 11 M7 12 L12 24 M11 10.5 L15.5 21.5 M15 9 L19.5 19.5 M19 7.5 L23 17" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'bangs':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M6 12 C8 6 24 6 26 12 L23 20 L19 14 L16 21 L12 14 L9 20 Z" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'glasses':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <rect x="4.5" y="11" width="9.5" height="8" rx="3.5" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <rect x="18" y="11" width="9.5" height="8" rx="3.5" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <line x1="14" y1="14.5" x2="18" y2="14.5" stroke={strokeColor} strokeWidth="2.1" />
        </svg>
      );
    case 'facialHair':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M5 17 C6 21 11 22 16 19.5 C21 22 26 21 27 17 C27 14 23 12.5 19.5 14.5 C18 15.3 17 15.5 16 14.5 C15 15.5 14 15.3 12.5 14.5 C9 12.5 5 14 5 17 Z" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinejoin="round" />
        </svg>
      );
    case 'earrings':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="11" cy="11" r="2.2" fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx="11" cy="19.5" r="4.5" fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx="22" cy="11" r="2.2" fill="none" stroke={strokeColor} strokeWidth="2" />
          <path d="M22 13.5 L25 19 L22 24.5 L19 19 Z" fill="none" stroke={strokeColor} strokeWidth="1.9" strokeLinejoin="round" />
        </svg>
      );
    case 'neckwear':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M7 11 L15 15.5 L7 20 Z M25 11 L17 15.5 L25 20 Z" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinejoin="round" />
          <circle cx="16" cy="15.5" r="2.3" fill="none" stroke={strokeColor} strokeWidth="2" />
        </svg>
      );
    case 'accessories':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M7 18 V15 C7 10 11 7 16 7 C21 7 25 10 25 15 V18" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
          <rect x="5" y="16" width="4.5" height="8" rx="2" fill="none" stroke={strokeColor} strokeWidth="2" />
          <rect x="22.5" y="16" width="4.5" height="8" rx="2" fill="none" stroke={strokeColor} strokeWidth="2" />
        </svg>
      );
    case 'hat':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <circle cx="16" cy="7.5" r="2" fill="none" stroke={strokeColor} strokeWidth="1.9" />
          <path d="M8 19 C8 13.5 11.5 10 16 10 C20.5 10 24 13.5 24 19" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <rect x="6.5" y="19" width="19" height="6" rx="2.5" fill="none" stroke={strokeColor} strokeWidth="2.1" />
        </svg>
      );
    case 'outfit':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M11 7 L6 10.5 L8 15.5 L10.5 14.5 L10.5 25 H21.5 V14.5 L24 15.5 L26 10.5 L21 7 C19.5 9.5 12.5 9.5 11 7 Z" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinejoin="round" />
        </svg>
      );
    case 'aura':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M15 20 C10 19 6 14 5 8 C10 9 14 12 16 16 C18 12 22 9 27 8 C26 14 22 19 17 20" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="23" r="2.2" fill="none" stroke={strokeColor} strokeWidth="2" />
        </svg>
      );
    case 'pet':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <path d="M8 10 L10 16 C10 21 12.5 24 16 24 C19.5 24 22 21 22 16 L24 10 L19.5 12 C18.2 11.4 13.8 11.4 12.5 12 Z" fill="none" stroke={strokeColor} strokeWidth="2.1" strokeLinejoin="round" />
          <circle cx="13.5" cy="17" r="1.2" fill={strokeColor} />
          <circle cx="18.5" cy="17" r="1.2" fill={strokeColor} />
        </svg>
      );
    case 'bg':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5">
          <rect x="6" y="7" width="20" height="18" rx="3" fill="none" stroke={strokeColor} strokeWidth="2.1" />
          <rect x="9" y="10" width="14" height="12" rx="1.5" fill="none" stroke={strokeColor} strokeWidth="1.7" />
          <line x1="12" y1="19" x2="20" y2="12" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};

export const ProfileAvatarStudioModal: React.FC<ProfileAvatarStudioModalProps> = ({
  isOpen,
  initialTab = 'character',
  onClose,
  user,
  onApplyAvatar,
  playSound,
  setToast,
  isLightMode = false
}) => {
  const isRu = user.language !== 'en';
  const [studioMode, setStudioMode] = useState<'builder' | 'presets' | 'photo'>(
    initialTab === 'photo'
      ? 'photo'
      : user.characterAvatar?.characterId && user.characterAvatar.characterId !== 'human-builder'
        ? 'presets'
        : 'builder'
  );
  const [builderTab, setBuilderTab] = useState<BuilderCategory>('skin');
  const [showAllTabsGrid, setShowAllTabsGrid] = useState<boolean>(true);

  const buildInitialCharConfig = (): CharacterAvatarConfig => {
    const base = { ...DEFAULT_CHARACTER_AVATAR };
    if (user.characterAvatar) {
      return {
        ...base,
        ...user.characterAvatar
      };
    }
    return base;
  };

  const [charConfig, setCharConfig] = useState<CharacterAvatarConfig>(buildInitialCharConfig);
  const [photoUrl, setPhotoUrl] = useState<string>(user.avatarUrl || user.avatarImage || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const characterFileRef = useRef<HTMLInputElement>(null);
  const profilePhotoFileRef = useRef<HTMLInputElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const nextChar = buildInitialCharConfig();
      setCharConfig(nextChar);
      setPhotoUrl(user.avatarUrl || user.avatarImage || '');
      if (initialTab === 'photo') {
        setStudioMode('photo');
      } else if (nextChar.characterId && nextChar.characterId !== 'human-builder' && !nextChar.customImageUrl) {
        setStudioMode('presets');
      } else {
        setStudioMode('builder');
      }
    }
  }, [isOpen, initialTab, user.characterAvatar, user.avatarUrl, user.avatarImage]);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'character' | 'photo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast(isRu ? 'Размер файла не должен превышать 5 МБ' : 'File size must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        playSound('select');
        if (target === 'character') {
          setCharConfig((prev) => ({
            ...prev,
            customImageUrl: reader.result as string
          }));
          setToast(
            isRu
              ? '🎭 Аватар-персонаж загружен! Нажмите «ГОТОВО», чтобы применить.'
              : '🎭 Character image uploaded! Tap DONE to apply.'
          );
        } else {
          setPhotoUrl(reader.result);
          setToast(
            isRu
              ? '📷 Фотография профиля загружена! Нажмите «ГОТОВО», чтобы сохранить.'
              : '📷 Profile photo uploaded! Tap DONE to save.'
          );
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetBuilder = () => {
    playSound('click');
    setCharConfig({ ...DEFAULT_CHARACTER_AVATAR });
    setToast(isRu ? 'Аватар сброшен к базовому виду' : 'Avatar reset to default');
  };

  const handleRandomize = () => {
    playSound('select');
    if (studioMode === 'presets') {
      const randPreset =
        DUOWINDO_CHARACTER_PRESETS[Math.floor(Math.random() * DUOWINDO_CHARACTER_PRESETS.length)];
      const expressions: CharacterAvatarConfig['expression'][] = ['happy', 'cool', 'smart', 'wink'];
      const accessories: CharacterAvatarConfig['accessory'][] = ['none', 'glasses', 'sunglasses', 'headphones', 'visor'];
      const headwears: CharacterAvatarConfig['headwear'][] = ['none', 'crown', 'gradcap', 'beret', 'helmet'];
      const randBg = PRESET_BG_COLORS[Math.floor(Math.random() * PRESET_BG_COLORS.length)];
      setCharConfig((prev) => ({
        ...prev,
        characterId: randPreset.id,
        bgColor: randBg.value,
        bgHex: undefined,
        expression: expressions[Math.floor(Math.random() * expressions.length)],
        accessory: accessories[Math.floor(Math.random() * accessories.length)],
        headwear: headwears[Math.floor(Math.random() * headwears.length)],
        customImageUrl: undefined
      }));
    } else {
      const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
      setCharConfig((prev) => ({
        ...prev,
        characterId: 'human-builder',
        customImageUrl: undefined,
        skinColor: pick(SKIN_SWATCHES.slice(0, 20)),
        headShape: pick(HEAD_SHAPES).id,
        earStyle: pick(EAR_OPTIONS).id,
        bodyStyle: pick(BODY_OPTIONS).id,
        eyeColor: pick(EYE_SWATCHES),
        eyeStyle: pick(EYE_STYLE_OPTIONS).id,
        eyebrowColor: pick(HAIR_AND_BEARD_SWATCHES),
        eyebrowStyle: pick(BROW_OPTIONS).id,
        noseStyle: pick(NOSE_OPTIONS).id,
        faceStyle: pick(MOUTH_OPTIONS).id,
        cheekStyle: Math.random() < 0.45 ? 'none' : pick(CHEEK_OPTIONS).id,
        faceMark: Math.random() < 0.6 ? 'none' : pick(MARK_OPTIONS).id,
        hairColor: pick(HAIR_AND_BEARD_SWATCHES),
        hairStyle: pick(HAIR_OPTIONS).id,
        bangsStyle: Math.random() < 0.55 ? 'none' : pick(BANGS_OPTIONS).id,
        glassesColor: pick(GLASSES_SWATCHES),
        glassesStyle: Math.random() < 0.45 ? 'none' : pick(GLASSES_OPTIONS).id,
        facialHairColor: pick(HAIR_AND_BEARD_SWATCHES),
        facialHairStyle: Math.random() < 0.65 ? 'none' : pick(FACIAL_HAIR_OPTIONS).id,
        earringStyle: Math.random() < 0.65 ? 'none' : pick(EARRING_OPTIONS).id,
        neckwearStyle: Math.random() < 0.55 ? 'none' : pick(NECKWEAR_OPTIONS).id,
        faceAccessory: Math.random() < 0.65 ? 'none' : pick(ACCESSORY_OPTIONS).id,
        hatColor: pick(HAT_SWATCHES),
        hatStyle: Math.random() < 0.6 ? 'none' : pick(HAT_OPTIONS).id,
        outfitColor: pick(OUTFIT_SWATCHES),
        outfitDecal: Math.random() < 0.45 ? 'none' : pick(DECAL_OPTIONS).id,
        auraEffect: Math.random() < 0.65 ? 'none' : pick(AURA_OPTIONS).id,
        shoulderPet: Math.random() < 0.6 ? 'none' : pick(PET_OPTIONS).id,
        bgHex: pick(BG_HEX_SWATCHES),
        bgPattern: Math.random() < 0.4 ? 'solid' : pick(BG_PATTERN_OPTIONS).id,
        avatarFrame: Math.random() < 0.6 ? 'none' : pick(FRAME_OPTIONS).id
      }));
    }
  };

  const handleSaveAndApply = async () => {
    if (studioMode === 'photo' && !photoUrl.trim()) {
      setToast(
        isRu
          ? 'Сначала загрузите фотографию профиля или выберите вкладку «Конструктор»'
          : 'Upload a profile photo first or switch to Avatar Builder'
      );
      return;
    }

    setIsSaving(true);
    try {
      playSound('success');
      const finalCharacterConfig: CharacterAvatarConfig =
        studioMode === 'builder'
          ? {
              ...charConfig,
              characterId: 'human-builder',
              bgHex: charConfig.bgHex || '#E5E7EB'
            }
          : studioMode === 'presets'
            ? {
                ...charConfig,
                characterId:
                  charConfig.characterId && charConfig.characterId !== 'human-builder'
                    ? charConfig.characterId
                    : DUOWINDO_CHARACTER_PRESETS[0].id,
                bgHex: undefined
              }
            : charConfig;

      await Promise.resolve(
        onApplyAvatar({
          avatarMode: studioMode === 'photo' ? 'photo' : 'character',
          avatarColor:
            studioMode === 'presets'
              ? finalCharacterConfig.bgColor
              : user.avatarColor || 'bg-duo-blue',
          avatarUrl: photoUrl.trim() || undefined,
          avatarImage: photoUrl.trim() || undefined,
          characterAvatar: finalCharacterConfig
        })
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const updateBuilder = (patch: Partial<CharacterAvatarConfig>) => {
    playSound('click');
    setCharConfig((prev) => ({
      ...prev,
      characterId: 'human-builder',
      customImageUrl: undefined,
      ...patch
    }));
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabStripRef.current) return;
    tabStripRef.current.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    });
  };

  const renderSwatchGrid = (
    colors: string[],
    selectedColor: string | undefined,
    onSelect: (hex: string) => void,
    columnsClass: string = 'grid-cols-6'
  ) => (
    <div className={`grid ${columnsClass} gap-2`}>
      {colors.map((hex) => {
        const isSelected = (selectedColor || '').toUpperCase() === hex.toUpperCase();
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onSelect(hex)}
            aria-label={hex}
            className={`h-11 sm:h-12 rounded-2xl p-1.5 flex items-center justify-center border-2 transition-all cursor-pointer ${
              isSelected
                ? 'border-[#1CB0F6] bg-[#1E3542] shadow-[0_0_0_2px_rgba(28,176,246,0.25)] scale-[1.03]'
                : isLightMode
                  ? 'border-slate-200 bg-slate-100 hover:border-slate-300'
                  : 'border-[#2B3D47] bg-[#16232A] hover:border-[#415966]'
            }`}
          >
            <span
              className="w-full h-full rounded-xl shadow-inner border border-black/10"
              style={{ backgroundColor: hex }}
            />
          </button>
        );
      })}
    </div>
  );

  const renderHorizontalSwatches = (
    colors: string[],
    selectedColor: string | undefined,
    onSelect: (hex: string) => void
  ) => (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
      {colors.map((hex) => {
        const isSelected = (selectedColor || '').toUpperCase() === hex.toUpperCase();
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onSelect(hex)}
            aria-label={hex}
            className={`w-11 h-11 shrink-0 rounded-2xl p-1.5 flex items-center justify-center border-2 transition-all cursor-pointer ${
              isSelected
                ? 'border-[#1CB0F6] bg-[#1E3542]'
                : isLightMode
                  ? 'border-slate-200 bg-slate-100 hover:border-slate-300'
                  : 'border-[#2B3D47] bg-[#16232A] hover:border-[#415966]'
            }`}
          >
            <span
              className="w-full h-full rounded-xl shadow-inner border border-black/10"
              style={{ backgroundColor: hex }}
            />
          </button>
        );
      })}
    </div>
  );

  const renderPreviewCardGrid = <T extends string>(
    options: T[],
    selected: T | undefined,
    onSelect: (val: T) => void,
    patchBuilder: (val: T) => Partial<CharacterAvatarConfig>,
    viewBox: string,
    labelResolver?: (val: T) => string,
    includePatternPreview: boolean = false
  ) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {options.map((opt) => {
        const isSelected = selected === opt;
        const previewConfig: CharacterAvatarConfig = {
          ...charConfig,
          characterId: 'human-builder',
          ...patchBuilder(opt)
        };
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 overflow-hidden transition-all cursor-pointer ${
              isSelected
                ? 'border-[#1CB0F6] bg-[#1D3544] shadow-[0_0_0_2px_rgba(28,176,246,0.2)]'
                : isLightMode
                  ? 'border-slate-200 bg-slate-100 hover:border-slate-300'
                  : 'border-[#2B3D47] bg-[#16232A] hover:border-[#415966]'
            }`}
          >
            <div
              className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden"
              style={includePatternPreview ? { backgroundColor: previewConfig.bgHex || '#E5E7EB' } : undefined}
            >
              <HumanBuilderAvatarSvg
                config={previewConfig}
                className="w-full h-full"
                viewBox={viewBox}
                includeBgPattern={includePatternPreview}
              />
            </div>
            {labelResolver && (
              <span
                className={`text-[11px] font-bold truncate w-full text-center ${
                  isSelected ? 'text-[#1CB0F6]' : isLightMode ? 'text-slate-700' : 'text-gray-300'
                }`}
              >
                {labelResolver(opt)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const builderCategoryOrder: {
    id: BuilderCategory;
    shortRu: string;
    shortEn: string;
    titleRu: string;
    titleEn: string;
  }[] = [
    { id: 'skin', shortRu: 'Кожа', shortEn: 'Skin', titleRu: 'Цвет кожи', titleEn: 'Skin Tone' },
    { id: 'headShape', shortRu: 'Форма', shortEn: 'Shape', titleRu: 'Форма лица', titleEn: 'Face Shape' },
    { id: 'ears', shortRu: 'Уши', shortEn: 'Ears', titleRu: 'Форма ушей', titleEn: 'Ear Style' },
    { id: 'body', shortRu: 'Тело', shortEn: 'Body', titleRu: 'Тело и воротник', titleEn: 'Body & Fit' },
    { id: 'eyes', shortRu: 'Глаза', shortEn: 'Eyes', titleRu: 'Цвет и форма глаз', titleEn: 'Eyes' },
    { id: 'brows', shortRu: 'Брови', shortEn: 'Brows', titleRu: 'Брови', titleEn: 'Eyebrows' },
    { id: 'nose', shortRu: 'Нос', shortEn: 'Nose', titleRu: 'Форма носа', titleEn: 'Nose' },
    { id: 'mouth', shortRu: 'Рот', shortEn: 'Mouth', titleRu: 'Выражение лица', titleEn: 'Expression' },
    { id: 'cheeks', shortRu: 'Щёки', shortEn: 'Cheeks', titleRu: 'Румянец и веснушки', titleEn: 'Cheeks' },
    { id: 'marks', shortRu: 'Метки', shortEn: 'Marks', titleRu: 'Макияж и метки', titleEn: 'Marks & Makeup' },
    { id: 'hair', shortRu: 'Волосы', shortEn: 'Hair', titleRu: 'Волосы и причёска', titleEn: 'Hair' },
    { id: 'bangs', shortRu: 'Чёлка', shortEn: 'Bangs', titleRu: 'Чёлка и пряди', titleEn: 'Bangs' },
    { id: 'glasses', shortRu: 'Очки', shortEn: 'Glasses', titleRu: 'Очки и монокли', titleEn: 'Eyewear' },
    { id: 'facialHair', shortRu: 'Борода', shortEn: 'Beard', titleRu: 'Борода и усы', titleEn: 'Facial Hair' },
    { id: 'earrings', shortRu: 'Серьги', shortEn: 'Ears+', titleRu: 'Серьги', titleEn: 'Earrings' },
    { id: 'neckwear', shortRu: 'Шея', shortEn: 'Neck', titleRu: 'Галстуки и кулоны', titleEn: 'Neckwear' },
    { id: 'accessories', shortRu: 'Детали', shortEn: 'Gear', titleRu: 'Аксессуары головы', titleEn: 'Accessories' },
    { id: 'hat', shortRu: 'Уборы', shortEn: 'Hats', titleRu: 'Головные уборы', titleEn: 'Headwear' },
    { id: 'outfit', shortRu: 'Одежда', shortEn: 'Outfit', titleRu: 'Цвет и принт одежды', titleEn: 'Clothing' },
    { id: 'aura', shortRu: 'Эффект', shortEn: 'Aura', titleRu: 'Крылья и аура', titleEn: 'Wings & Aura' },
    { id: 'pet', shortRu: 'Питомец', shortEn: 'Pet', titleRu: 'Спутник на плече', titleEn: 'Shoulder Pet' },
    { id: 'bg', shortRu: 'Фон', shortEn: 'BG', titleRu: 'Фон, узор и рамка', titleEn: 'Background & Frame' }
  ];

  const shellBg = isLightMode ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#131F24] text-white border-[#253740]';
  const headerBg = isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#131F24] border-[#253740]';
  const mutedText = isLightMode ? 'text-slate-500' : 'text-gray-400';

  const currentStageBgHex =
    studioMode === 'builder'
      ? charConfig.customImageUrl
        ? '#E5E7EB'
        : charConfig.bgHex || '#E5E7EB'
      : undefined;

  return (
    <div className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in select-none">
      <div className={`w-full max-w-2xl h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl border-0 sm:border-2 flex flex-col overflow-hidden shadow-2xl ${shellBg}`}>
        {/* TOP BAR */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${headerBg}`}>
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            aria-label={isRu ? 'Закрыть' : 'Close'}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLightMode ? 'text-slate-600 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <CloseIcon className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h2 className={`text-base sm:text-lg font-black tracking-tight ${isLightMode ? 'text-slate-800' : 'text-gray-100'}`}>
              {isRu ? 'Создайте аватар' : 'Create Avatar'}
            </h2>
            {studioMode === 'builder' && (
              <p className={`text-[11px] font-bold ${mutedText}`}>
                {isRu ? '22 вкладки конструктора' : '22 customization tabs'}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndApply}
            className="px-2.5 py-1 text-sm font-black uppercase tracking-wider text-[#1CB0F6] hover:brightness-125 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? '...' : isRu ? 'ГОТОВО' : 'DONE'}
          </button>
        </div>

        {/* SUB-MODE SWITCHER */}
        <div className={`px-3 py-2 border-b shrink-0 ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#0F191E] border-[#253740]'}`}>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setStudioMode('builder');
                setCharConfig((prev) => ({ ...prev, characterId: 'human-builder' }));
              }}
              className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                studioMode === 'builder'
                  ? 'bg-[#1CB0F6] text-white shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🎨</span>
              <span className="truncate">{isRu ? 'Конструктор (22)' : 'Builder (22)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setStudioMode('presets');
                setCharConfig((prev) => ({
                  ...prev,
                  characterId:
                    prev.characterId && prev.characterId !== 'human-builder'
                      ? prev.characterId
                      : DUOWINDO_CHARACTER_PRESETS[0].id
                }));
              }}
              className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                studioMode === 'presets'
                  ? 'bg-indigo-600 text-white shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🦉</span>
              <span className="truncate">{isRu ? 'Персонажи' : 'Mascots'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setStudioMode('photo');
              }}
              className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                studioMode === 'photo'
                  ? 'bg-emerald-600 text-white shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:bg-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>📷</span>
              <span className="truncate">{isRu ? 'Фото профиля' : 'Photo'}</span>
              {photoUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />}
            </button>
          </div>
        </div>

        {/* LIVE AVATAR STAGE */}
        {studioMode !== 'photo' && (
          <div
            className={`relative h-44 sm:h-52 w-full flex items-end justify-center overflow-hidden shrink-0 transition-colors ${
              studioMode === 'presets' && !charConfig.customImageUrl ? charConfig.bgColor || 'bg-duo-blue' : ''
            }`}
            style={currentStageBgHex ? { backgroundColor: currentStageBgHex } : undefined}
          >
            {charConfig.customImageUrl ? (
              <div className="w-36 h-36 sm:w-40 sm:h-40 mb-3 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/60 bg-black/10">
                <img
                  src={charConfig.customImageUrl}
                  alt="Custom Character"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : studioMode === 'builder' ? (
              <div className="w-44 h-44 sm:w-52 sm:h-52 translate-y-1">
                <HumanBuilderAvatarSvg config={charConfig} className="w-full h-full" includeBgPattern={true} />
              </div>
            ) : (
              <div className="w-40 h-40 sm:w-48 sm:h-48 mb-2">
                <CharacterAvatarSvg config={charConfig} className="w-full h-full" />
              </div>
            )}

            {/* Floating Action Controls */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="px-2.5 py-1.5 rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRu ? 'Случайный' : 'Random'}</span>
                </button>
                {studioMode === 'builder' && (
                  <button
                    type="button"
                    onClick={handleResetBuilder}
                    title={isRu ? 'Сбросить настройки' : 'Reset'}
                    className="px-2.5 py-1.5 rounded-xl bg-black/45 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-black shadow cursor-pointer"
                  >
                    ↺
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {charConfig.customImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCharConfig((prev) => ({ ...prev, customImageUrl: undefined }))}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{isRu ? 'Конструктор' : 'Builder'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => characterFileRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                >
                  <CameraIcon className="w-3.5 h-3.5 text-[#1CB0F6]" />
                  <span>{isRu ? 'Загрузить файл' : 'Upload File'}</span>
                </button>
                <input
                  ref={characterFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'character')}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* 22-TAB CATEGORY BAR (ALL 22 TABS VISIBLE IN GRID OR HORIZONTAL STRIP) */}
        {studioMode === 'builder' && (
          <div className={`border-y shrink-0 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0F191E] border-[#253740]'}`}>
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-black/10 dark:border-white/5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${mutedText}`}>
                {isRu
                  ? `Вкладки (${builderCategoryOrder.findIndex((c) => c.id === builderTab) + 1}/22): ${
                      builderCategoryOrder.find((c) => c.id === builderTab)?.shortRu
                    }`
                  : `Tabs (${builderCategoryOrder.findIndex((c) => c.id === builderTab) + 1}/22): ${
                      builderCategoryOrder.find((c) => c.id === builderTab)?.shortEn
                    }`}
              </span>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setShowAllTabsGrid((v) => !v);
                }}
                className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6] hover:underline cursor-pointer"
              >
                {showAllTabsGrid
                  ? isRu ? 'Свернуть в полосу' : 'Compact strip'
                  : isRu ? 'Показать все 22 вкладки' : 'Show all 22 tabs'}
              </button>
            </div>

            {showAllTabsGrid ? (
              <div className="p-2 grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                {builderCategoryOrder.map((cat) => {
                  const active = builderTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setBuilderTab(cat.id);
                      }}
                      title={isRu ? cat.titleRu : cat.titleEn}
                      className={`px-1 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                        active
                          ? 'border-[#1CB0F6] bg-[#1CB0F6]/15 shadow-sm'
                          : isLightMode
                            ? 'border-slate-200/80 bg-white hover:border-slate-300'
                            : 'border-[#22343D] bg-[#152229] hover:border-[#3A5360]'
                      }`}
                    >
                      <CategoryTabIcon id={cat.id} active={active} />
                      <span
                        className={`text-[9.5px] font-black leading-tight truncate max-w-full ${
                          active ? 'text-[#1CB0F6]' : mutedText
                        }`}
                      >
                        {isRu ? cat.shortRu : cat.shortEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  aria-label={isRu ? 'Прокрутить влево' : 'Scroll tabs left'}
                  className={`px-2 py-2.5 text-lg font-black shrink-0 cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'}`}
                >
                  ‹
                </button>
                <div ref={tabStripRef} className="flex-1 flex items-center overflow-x-auto no-scrollbar">
                  {builderCategoryOrder.map((cat) => {
                    const active = builderTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setBuilderTab(cat.id);
                        }}
                        title={isRu ? cat.titleRu : cat.titleEn}
                        className={`min-w-[64px] px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 border-b-[3px] transition-all shrink-0 cursor-pointer ${
                          active
                            ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                            : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <CategoryTabIcon id={cat.id} active={active} />
                        <span className={`text-[10px] font-black leading-tight ${active ? 'text-[#1CB0F6]' : mutedText}`}>
                          {isRu ? cat.shortRu : cat.shortEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  aria-label={isRu ? 'Прокрутить вправо' : 'Scroll tabs right'}
                  className={`px-2 py-2.5 text-lg font-black shrink-0 cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'}`}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCROLLABLE CONTENT PANEL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {studioMode === 'builder' && (
            <>
              {charConfig.customImageUrl && (
                <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/40 text-xs font-bold">
                  {isRu
                    ? 'Сейчас выбран загруженный файл. Нажатие на любой параметр ниже вернёт векторный конструктор.'
                    : 'Using uploaded custom file. Selecting any builder option restores the vector avatar.'}
                </div>
              )}

              {builderTab === 'skin' && (
                <div className="space-y-2.5">
                  <h3 className="text-base font-black">{isRu ? 'Цвет кожи (24 оттенка)' : 'Skin Tone (24 shades)'}</h3>
                  {renderSwatchGrid(SKIN_SWATCHES, charConfig.skinColor, (hex) => updateBuilder({ skinColor: hex }))}
                </div>
              )}

              {builderTab === 'headShape' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Форма лица' : 'Face Shape'}</h3>
                  {renderPreviewCardGrid(
                    HEAD_SHAPES.map((s) => s.id),
                    charConfig.headShape || 'rounded',
                    (headShape) => updateBuilder({ headShape }),
                    (headShape) => ({
                      headShape,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '28 28 104 92',
                    (id) => {
                      const found = HEAD_SHAPES.find((s) => s.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'ears' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Форма ушей' : 'Ear Style'}</h3>
                  {renderPreviewCardGrid(
                    EAR_OPTIONS.map((e) => e.id),
                    charConfig.earStyle || 'normal',
                    (earStyle) => updateBuilder({ earStyle }),
                    (earStyle) => ({
                      earStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '20 26 120 92',
                    (id) => {
                      const found = EAR_OPTIONS.find((e) => e.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'body' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Тело и воротник (10 видов)' : 'Body & Collar (10 styles)'}</h3>
                  {renderPreviewCardGrid(
                    BODY_OPTIONS.map((b) => b.id),
                    charConfig.bodyStyle || 'medium',
                    (bodyStyle) => updateBuilder({ bodyStyle }),
                    (bodyStyle) => ({
                      bodyStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '15 35 130 125',
                    (id) => {
                      const found = BODY_OPTIONS.find((b) => b.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'eyes' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет глаз' : 'Eye Color'}</h3>
                    {renderHorizontalSwatches(EYE_SWATCHES, charConfig.eyeColor, (hex) =>
                      updateBuilder({ eyeColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Стиль глаз (10 форм)' : 'Eye Style (10 styles)'}</h3>
                    {renderPreviewCardGrid(
                      EYE_STYLE_OPTIONS.map((e) => e.id),
                      charConfig.eyeStyle || 'classic',
                      (eyeStyle) => updateBuilder({ eyeStyle }),
                      (eyeStyle) => ({
                        eyeStyle,
                        hairStyle: 'none',
                        bangsStyle: 'none',
                        glassesStyle: 'none',
                        facialHairStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '32 34 96 76',
                      (id) => {
                        const found = EYE_STYLE_OPTIONS.find((e) => e.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'brows' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет бровей' : 'Eyebrow Color'}</h3>
                    {renderHorizontalSwatches(HAIR_AND_BEARD_SWATCHES, charConfig.eyebrowColor || charConfig.hairColor, (hex) =>
                      updateBuilder({ eyebrowColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Форма бровей' : 'Eyebrow Shape'}</h3>
                    {renderPreviewCardGrid(
                      BROW_OPTIONS.map((b) => b.id),
                      charConfig.eyebrowStyle || 'none',
                      (eyebrowStyle) => updateBuilder({ eyebrowStyle }),
                      (eyebrowStyle) => ({
                        eyebrowStyle,
                        hairStyle: 'none',
                        bangsStyle: 'none',
                        glassesStyle: 'none',
                        facialHairStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '32 32 96 74',
                      (id) => {
                        const found = BROW_OPTIONS.find((b) => b.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'nose' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Форма носа (8 вариантов)' : 'Nose Style (8 options)'}</h3>
                  {renderPreviewCardGrid(
                    NOSE_OPTIONS.map((n) => n.id),
                    charConfig.noseStyle || 'drop',
                    (noseStyle) => updateBuilder({ noseStyle }),
                    (noseStyle) => ({
                      noseStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '34 36 92 78',
                    (id) => {
                      const found = NOSE_OPTIONS.find((n) => n.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'mouth' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Выражение лица и рот (12)' : 'Expression & Mouth (12)'}</h3>
                  {renderPreviewCardGrid(
                    MOUTH_OPTIONS.map((m) => m.id),
                    charConfig.faceStyle || 'smile',
                    (faceStyle) => updateBuilder({ faceStyle }),
                    (faceStyle) => ({
                      faceStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '30 34 100 84',
                    (id) => {
                      const found = MOUTH_OPTIONS.find((m) => m.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'cheeks' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Щёки, румянец и веснушки' : 'Cheeks, Blush & Freckles'}</h3>
                  {renderPreviewCardGrid(
                    CHEEK_OPTIONS.map((c) => c.id),
                    charConfig.cheekStyle || 'none',
                    (cheekStyle) => updateBuilder({ cheekStyle }),
                    (cheekStyle) => ({
                      cheekStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '30 34 100 84',
                    (id) => {
                      const found = CHEEK_OPTIONS.find((c) => c.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'marks' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Макияж, шрамы и метки' : 'Makeup, Scars & Face Marks'}</h3>
                  {renderPreviewCardGrid(
                    MARK_OPTIONS.map((m) => m.id),
                    charConfig.faceMark || 'none',
                    (faceMark) => updateBuilder({ faceMark }),
                    (faceMark) => ({
                      faceMark,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '30 34 100 84',
                    (id) => {
                      const found = MARK_OPTIONS.find((m) => m.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'hair' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет волос' : 'Hair Color'}</h3>
                    {renderHorizontalSwatches(HAIR_AND_BEARD_SWATCHES, charConfig.hairColor, (hex) =>
                      updateBuilder({ hairColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Причёска (18 стилей)' : 'Hairstyle (18 styles)'}</h3>
                    {renderPreviewCardGrid(
                      HAIR_OPTIONS.map((h) => h.id),
                      charConfig.hairStyle || 'none',
                      (hairStyle) => updateBuilder({ hairStyle, hatStyle: 'none' }),
                      (hairStyle) => ({
                        hairStyle,
                        glassesStyle: 'none',
                        facialHairStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '16 8 128 118',
                      (id) => {
                        const found = HAIR_OPTIONS.find((h) => h.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'bangs' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет чёлки (цвет волос)' : 'Bangs Color (Hair Color)'}</h3>
                    {renderHorizontalSwatches(HAIR_AND_BEARD_SWATCHES, charConfig.hairColor, (hex) =>
                      updateBuilder({ hairColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Чёлка и передние пряди' : 'Bangs & Front Strands'}</h3>
                    {renderPreviewCardGrid(
                      BANGS_OPTIONS.map((b) => b.id),
                      charConfig.bangsStyle || 'none',
                      (bangsStyle) => updateBuilder({ bangsStyle, hatStyle: 'none' }),
                      (bangsStyle) => ({
                        bangsStyle,
                        glassesStyle: 'none',
                        facialHairStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '24 18 112 98',
                      (id) => {
                        const found = BANGS_OPTIONS.find((b) => b.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'glasses' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет очков' : 'Glasses Color'}</h3>
                    {renderHorizontalSwatches(GLASSES_SWATCHES, charConfig.glassesColor, (hex) =>
                      updateBuilder({ glassesColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Очки и монокль (10)' : 'Glasses & Monocle (10)'}</h3>
                    {renderPreviewCardGrid(
                      GLASSES_OPTIONS.map((g) => g.id),
                      charConfig.glassesStyle || 'none',
                      (glassesStyle) => updateBuilder({ glassesStyle }),
                      (glassesStyle) => ({
                        glassesStyle,
                        hairStyle: 'none',
                        bangsStyle: 'none',
                        facialHairStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '28 28 104 92',
                      (id) => {
                        const found = GLASSES_OPTIONS.find((g) => g.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'facialHair' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет бороды и усов' : 'Facial Hair Color'}</h3>
                    {renderHorizontalSwatches(HAIR_AND_BEARD_SWATCHES, charConfig.facialHairColor, (hex) =>
                      updateBuilder({ facialHairColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Борода, усы и бакенбарды (10)' : 'Facial Hair (10)'}</h3>
                    {renderPreviewCardGrid(
                      FACIAL_HAIR_OPTIONS.map((f) => f.id),
                      charConfig.facialHairStyle || 'none',
                      (facialHairStyle) => updateBuilder({ facialHairStyle }),
                      (facialHairStyle) => ({
                        facialHairStyle,
                        hairStyle: 'none',
                        bangsStyle: 'none',
                        glassesStyle: 'none',
                        hatStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '28 32 104 94',
                      (id) => {
                        const found = FACIAL_HAIR_OPTIONS.find((f) => f.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'earrings' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Серьги' : 'Earrings'}</h3>
                  {renderPreviewCardGrid(
                    EARRING_OPTIONS.map((e) => e.id),
                    charConfig.earringStyle || 'none',
                    (earringStyle) => updateBuilder({ earringStyle }),
                    (earringStyle) => ({
                      earringStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '20 34 120 88',
                    (id) => {
                      const found = EARRING_OPTIONS.find((e) => e.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'neckwear' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Шейные украшения и галстуки' : 'Ties, Chains & Neckwear'}</h3>
                  {renderPreviewCardGrid(
                    NECKWEAR_OPTIONS.map((n) => n.id),
                    charConfig.neckwearStyle || 'none',
                    (neckwearStyle) => updateBuilder({ neckwearStyle }),
                    (neckwearStyle) => ({
                      neckwearStyle,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      faceAccessory: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '20 75 120 85',
                    (id) => {
                      const found = NECKWEAR_OPTIONS.find((n) => n.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'accessories' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Наушники, нимб, рожки и детали (10)' : 'Headphones & Gear (10)'}</h3>
                  {renderPreviewCardGrid(
                    ACCESSORY_OPTIONS.map((a) => a.id),
                    charConfig.faceAccessory || 'none',
                    (faceAccessory) => updateBuilder({ faceAccessory }),
                    (faceAccessory) => ({
                      faceAccessory,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      hatStyle: 'none',
                      auraEffect: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '20 10 120 108',
                    (id) => {
                      const found = ACCESSORY_OPTIONS.find((a) => a.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'hat' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет головного убора' : 'Headwear Color'}</h3>
                    {renderHorizontalSwatches(HAT_SWATCHES, charConfig.hatColor, (hex) =>
                      updateBuilder({ hatColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Головной убор (12 видов)' : 'Headwear (12 styles)'}</h3>
                    {renderPreviewCardGrid(
                      HAT_OPTIONS.map((h) => h.id),
                      charConfig.hatStyle || 'none',
                      (hatStyle) => updateBuilder({ hatStyle }),
                      (hatStyle) => ({
                        hatStyle,
                        hairStyle: 'none',
                        bangsStyle: 'none',
                        glassesStyle: 'none',
                        facialHairStyle: 'none',
                        faceAccessory: 'none',
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '22 2 116 112',
                      (id) => {
                        const found = HAT_OPTIONS.find((h) => h.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'outfit' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет одежды' : 'Clothing Color'}</h3>
                    {renderSwatchGrid(OUTFIT_SWATCHES, charConfig.outfitColor, (hex) =>
                      updateBuilder({ outfitColor: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Принт на одежде (9 видов)' : 'Outfit Decal (9 styles)'}</h3>
                    {renderPreviewCardGrid(
                      DECAL_OPTIONS.map((d) => d.id),
                      charConfig.outfitDecal || 'none',
                      (outfitDecal) => updateBuilder({ outfitDecal }),
                      (outfitDecal) => ({
                        outfitDecal,
                        auraEffect: 'none',
                        shoulderPet: 'none',
                        avatarFrame: 'none'
                      }),
                      '32 95 96 65',
                      (id) => {
                        const found = DECAL_OPTIONS.find((d) => d.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      }
                    )}
                  </div>
                </div>
              )}

              {builderTab === 'aura' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Крылья, пламя и аура' : 'Wings & Aura Effects'}</h3>
                  {renderPreviewCardGrid(
                    AURA_OPTIONS.map((a) => a.id),
                    charConfig.auraEffect || 'none',
                    (auraEffect) => updateBuilder({ auraEffect }),
                    (auraEffect) => ({
                      auraEffect,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      hatStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      shoulderPet: 'none',
                      avatarFrame: 'none'
                    }),
                    '0 0 160 160',
                    (id) => {
                      const found = AURA_OPTIONS.find((a) => a.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'pet' && (
                <div className="space-y-3">
                  <h3 className="text-base font-black">{isRu ? 'Питомец на плече' : 'Shoulder Pet'}</h3>
                  {renderPreviewCardGrid(
                    PET_OPTIONS.map((p) => p.id),
                    charConfig.shoulderPet || 'none',
                    (shoulderPet) => updateBuilder({ shoulderPet }),
                    (shoulderPet) => ({
                      shoulderPet,
                      hairStyle: 'none',
                      bangsStyle: 'none',
                      hatStyle: 'none',
                      glassesStyle: 'none',
                      facialHairStyle: 'none',
                      auraEffect: 'none',
                      avatarFrame: 'none'
                    }),
                    '0 10 160 150',
                    (id) => {
                      const found = PET_OPTIONS.find((p) => p.id === id);
                      return isRu ? found?.ru || id : found?.en || id;
                    }
                  )}
                </div>
              )}

              {builderTab === 'bg' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Цвет фона (28 оттенков)' : 'Background Color (28)'}</h3>
                    {renderSwatchGrid(BG_HEX_SWATCHES, charConfig.bgHex || '#E5E7EB', (hex) =>
                      updateBuilder({ bgHex: hex })
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Узор фона' : 'Background Pattern'}</h3>
                    {renderPreviewCardGrid(
                      BG_PATTERN_OPTIONS.map((p) => p.id),
                      charConfig.bgPattern || 'solid',
                      (bgPattern) => updateBuilder({ bgPattern }),
                      (bgPattern) => ({
                        bgPattern,
                        bgHex: charConfig.bgHex || '#E5E7EB',
                        avatarFrame: 'none'
                      }),
                      '0 0 160 160',
                      (id) => {
                        const found = BG_PATTERN_OPTIONS.find((p) => p.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      },
                      true
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-base font-black">{isRu ? 'Рамка аватара' : 'Avatar Frame'}</h3>
                    {renderPreviewCardGrid(
                      FRAME_OPTIONS.map((f) => f.id),
                      charConfig.avatarFrame || 'none',
                      (avatarFrame) => updateBuilder({ avatarFrame }),
                      (avatarFrame) => ({
                        avatarFrame,
                        bgHex: charConfig.bgHex || '#E5E7EB'
                      }),
                      '0 0 160 160',
                      (id) => {
                        const found = FRAME_OPTIONS.find((f) => f.id === id);
                        return isRu ? found?.ru || id : found?.en || id;
                      },
                      true
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================ DUOWINDO6601 CHARACTER PRESETS MODE ================ */}
          {studioMode === 'presets' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">
                  {isRu ? 'Персонажи DuoWindo6601' : 'DuoWindo6601 Mascots'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DUOWINDO_CHARACTER_PRESETS.map((preset) => {
                    const isSelected = !charConfig.customImageUrl && charConfig.characterId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          playSound('select');
                          setCharConfig((prev) => ({
                            ...prev,
                            characterId: preset.id,
                            bgColor: preset.defaultBg,
                            bgHex: undefined,
                            customImageUrl: undefined
                          }));
                        }}
                        className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#1CB0F6] bg-[#1CB0F6]/15 scale-[1.02] shadow-md'
                            : isLightMode
                              ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              : 'bg-[#18262e] border-[#253844] hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl ${preset.defaultBg} p-1 overflow-hidden shadow-inner`}>
                          <CharacterAvatarSvg
                            config={{
                              ...charConfig,
                              characterId: preset.id,
                              bgColor: preset.defaultBg
                            }}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-[11px] font-black leading-tight">
                          {isRu ? preset.nameRu : preset.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!charConfig.customImageUrl && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>
                      {isRu ? 'Выражение' : 'Expression'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'happy', ru: '😊 Радостный', en: '😊 Happy' },
                        { id: 'cool', ru: '😎 Уверенный', en: '😎 Cool' },
                        { id: 'smart', ru: '🤓 Вдумчивый', en: '🤓 Smart' },
                        { id: 'wink', ru: '😉 Подмигивает', en: '😉 Wink' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setCharConfig((p) => ({
                              ...p,
                              expression: opt.id as CharacterAvatarConfig['expression']
                            }));
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            charConfig.expression === opt.id
                              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                              : isLightMode
                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {isRu ? opt.ru : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>
                      {isRu ? 'Аксессуары' : 'Accessories'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'none', ru: 'Нет', en: 'None' },
                        { id: 'glasses', ru: '👓 Очки', en: '👓 Glasses' },
                        { id: 'sunglasses', ru: '🕶️ Тёмные', en: '🕶️ Shades' },
                        { id: 'headphones', ru: '🎧 DuoRadio', en: '🎧 Headphones' },
                        { id: 'visor', ru: '🥽 Визор', en: '🥽 Visor' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setCharConfig((p) => ({
                              ...p,
                              accessory: opt.id as CharacterAvatarConfig['accessory']
                            }));
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            charConfig.accessory === opt.id
                              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                              : isLightMode
                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {isRu ? opt.ru : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>
                      {isRu ? 'Головной убор' : 'Headwear'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'none', ru: 'Нет', en: 'None' },
                        { id: 'crown', ru: '👑 Корона', en: '👑 Crown' },
                        { id: 'gradcap', ru: '🎓 Магистр', en: '🎓 Grad Cap' },
                        { id: 'beret', ru: '🎨 Берет', en: '🎨 Beret' },
                        { id: 'helmet', ru: '👩‍🚀 Скафандр', en: '👩‍🚀 Helmet' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setCharConfig((p) => ({
                              ...p,
                              headwear: opt.id as CharacterAvatarConfig['headwear']
                            }));
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            charConfig.headwear === opt.id
                              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                              : isLightMode
                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {isRu ? opt.ru : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>
                      {isRu ? 'Цвет фона' : 'Background'}
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_BG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setCharConfig((p) => ({ ...p, bgColor: c.value, bgHex: undefined }));
                          }}
                          title={isRu ? c.labelRu : c.labelEn}
                          className={`w-9 h-9 rounded-full ${c.value} border-2 transition-all cursor-pointer ${
                            charConfig.bgColor === c.value
                              ? 'border-white scale-110 ring-2 ring-[#1CB0F6]'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================ PRESERVED PROFILE PHOTO MODE ================ */}
          {studioMode === 'photo' && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl p-5 border flex flex-col items-center text-center space-y-4 ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#192830] border-[#293d49]'
                }`}
              >
                <div className={`w-36 h-36 rounded-[2.5rem] ${user.avatarColor || 'bg-duo-blue'} border-4 border-white/20 shadow-xl overflow-hidden flex items-center justify-center`}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black text-white">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-w-md">
                  <h3 className="text-base font-black">
                    {isRu ? 'Фотография вашего профиля' : 'Your Profile Photo'}
                  </h3>
                  <p className={`text-xs font-bold ${mutedText}`}>
                    {isRu
                      ? 'Ваша реальная фотография профиля хранится отдельно. Вы можете переключаться между фото и аватаром-персонажем в любой момент.'
                      : 'Your real profile photo is saved separately. Switch freely between your photo and character avatar anytime.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => profilePhotoFileRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider border-b-2 border-emerald-800 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>{isRu ? 'Загрузить фото профиля' : 'Upload Profile Photo'}</span>
                  </button>
                  <input
                    ref={profilePhotoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setToast(isRu ? 'Фотография профиля очищена' : 'Profile photo cleared');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>{isRu ? 'Удалить фото' : 'Remove Photo'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-black uppercase tracking-wider ${mutedText}`}>
                  {isRu ? 'Или вставьте ссылку (URL) на фотографию' : 'Or paste a photo URL'}
                </label>
                <input
                  type="text"
                  value={photoUrl.startsWith('data:') ? '' : photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className={`w-full border-2 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none transition-colors ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 focus:border-emerald-500 text-slate-900'
                      : 'bg-gray-800 border-gray-700 focus:border-emerald-500 text-white'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export type SimulationMode = 
  | 'real' 
  | 'xp' 
  | 'vista' 
  | 'old_browser' 
  | 'win10_modern'
  | 'android_old'
  | 'android_new'
  | 'ios_old'
  | 'ios_new'
  | 'mac_linux_old'
  | 'mac_linux_new';

export type WarningType = 'none' | 'windows_xp_vista' | 'old_android' | 'old_ios' | 'old_mac_linux' | 'old_browser';

export interface SystemCompatibilityResult {
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: number;
  isWindowsXpOrVista: boolean;
  isOldAndroid: boolean;
  isIOS: boolean;
  isOldIOS: boolean;
  isOldMacLinux: boolean;
  isOldBrowser: boolean;
  isModernSystem: boolean;
  pwaUpdateSupported: boolean;
  pwaSecuritySupported: boolean;
  pwaStatusMessage: string;
  warningType: WarningType;
  detailsReason: string;
}

export function detectSystemCompatibility(simMode: SimulationMode = 'real'): SystemCompatibilityResult {
  if (simMode === 'xp') {
    return {
      osName: 'Windows XP / Server 2003',
      osVersion: '5.1 / 5.2 (NT)',
      browserName: 'Mypal 78.0.3 XP (Deprecated)',
      browserVersion: 78,
      isWindowsXpOrVista: true,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: Обновление приложения DuoWindo6601 Progressive Web App (PWA) и Обновление безопасности недоступны на Windows XP/2003. Отсутствует поддержка Service Worker v2, CacheStorage API и TLS 1.3.',
      warningType: 'windows_xp_vista',
      detailsReason: 'Прекращена поддержка браузера Mypal 78.0.3 XP, OneCore API и Windows XP / Windows Server 2003. Завершение поддержки устаревшего Microsoft Speech API 4.0. Старые Системы не получат обновления приложения и безопасности DuoWindo6601 PWA.'
    };
  }

  if (simMode === 'vista') {
    return {
      osName: 'Windows Vista',
      osVersion: '6.0 (NT)',
      browserName: 'Firefox (Outdated)',
      browserVersion: 52,
      isWindowsXpOrVista: true,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: Операционная система Windows Vista снята с поддержки. Обновление DuoWindo6601 PWA и патчи безопасности недоступны.',
      warningType: 'windows_xp_vista',
      detailsReason: 'Операционная система Windows Vista снята с поддержки DuoWindo6601. Для старых систем обновление PWA невозможно.'
    };
  }

  if (simMode === 'old_browser') {
    return {
      osName: 'Windows 10',
      osVersion: '10.0 (NT)',
      browserName: 'Internet Explorer / Old Browser',
      browserVersion: 11,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: Устаревший браузер (IE / Legacy) не поддерживает PWA Service Worker, Web App Manifest и современные алгоритмы безопасности.',
      warningType: 'old_browser',
      detailsReason: 'Используется устаревший веб-браузер, не поддерживающий стандарты HTML5, ES6 и PWA. Обновление PWA и безопасность не получатся.'
    };
  }

  if (simMode === 'win10_modern') {
    return {
      osName: 'Windows 7 / 8 / 10 / 11',
      osVersion: '10.0 (NT)',
      browserName: 'Chrome / Edge',
      browserVersion: 125,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      pwaUpdateSupported: true,
      pwaSecuritySupported: true,
      pwaStatusMessage: '✅ Новый Систем: Обновление приложения DuoWindo6601 Progressive Web App (PWA) и Обновление безопасности активны и полностью поддерживаются!',
      warningType: 'none',
      detailsReason: 'Новая система полностью поддерживается (Windows 7/8/8.1/10/11 + современный браузер Chrome/Edge/Firefox). PWA обновляется автоматически.'
    };
  }

  if (simMode === 'android_old') {
    return {
      osName: 'Android (Старая версия)',
      osVersion: '5.1 (Lollipop)',
      browserName: 'Android WebKit Browser',
      browserVersion: 44,
      isWindowsXpOrVista: false,
      isOldAndroid: true,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: Версия Android 4.4 - 7.1 устарела. Обновление DuoWindo6601 PWA и патчи безопасности не поддерживаются.',
      warningType: 'old_android',
      detailsReason: 'Прекращена поддержка старых версий Android (4.4 - 7.1). Требуется Новый Систем (Android 8.0+) и актуальный Chrome Mobile.'
    };
  }

  if (simMode === 'android_new') {
    return {
      osName: 'Android (Новая версия)',
      osVersion: '14.0 / 15.0',
      browserName: 'Chrome Mobile',
      browserVersion: 125,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      pwaUpdateSupported: true,
      pwaSecuritySupported: true,
      pwaStatusMessage: '✅ Новый Систем: Android 8.0 - 15.0+ полностью поддерживает обновление приложения DuoWindo6601 PWA и обновление безопасности.',
      warningType: 'none',
      detailsReason: 'Современная система Android (8.0+) и Chrome Mobile полностью поддерживаются без предупреждений.'
    };
  }

  if (simMode === 'ios_old') {
    return {
      osName: 'Apple iOS / iPad (Старая система)',
      osVersion: '12.5 (Legacy iOS/iPadOS)',
      browserName: 'Mobile Safari (Legacy WebKit)',
      browserVersion: 12,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: true,
      isOldIOS: true,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: iOS / iPadOS < 14.0 устарели. На старых iPad/iPhone невозможно обновить приложение DuoWindo6601 PWA и получить обновления безопасности из-за отсутствия современного Service Worker Cache и Web Crypto API.',
      warningType: 'old_ios',
      detailsReason: 'Старая версия iOS / iPadOS (< 14.0). Для старых систем обновление PWA и патчи безопасности не получатся. Требуется Новый Систем iOS / iPadOS 15.0+.'
    };
  }

  if (simMode === 'ios_new') {
    return {
      osName: 'Apple iOS or iPad (Новый Систем)',
      osVersion: '17.5 / 18.0 (iPadOS / iOS)',
      browserName: 'Mobile Safari 17+',
      browserVersion: 17,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: true,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      pwaUpdateSupported: true,
      pwaSecuritySupported: true,
      pwaStatusMessage: '✅ Новый Систем: iOS / iPadOS 15.0 - 18.0+ полностью поддерживают установку и обновление DuoWindo6601 Progressive Web App (PWA) и обновление безопасности!',
      warningType: 'none',
      detailsReason: 'Новая система Apple iOS / iPadOS (iPad и iPhone) полностью поддерживается. Доступна установка PWA на экран «Домой», Service Worker кэширование и обновления.'
    };
  }

  if (simMode === 'mac_linux_old') {
    return {
      osName: 'macOS / Linux (Старая версия)',
      osVersion: 'Mac OS X 10.11 El Capitan / Old Kernel',
      browserName: 'Safari (Legacy) / Firefox Old',
      browserVersion: 52,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: true,
      isOldBrowser: true,
      isModernSystem: false,
      pwaUpdateSupported: false,
      pwaSecuritySupported: false,
      pwaStatusMessage: '🛑 Старые Системы — Не получится: Устаревшая версия macOS (10.9-10.12) или старый Linux. Обновление PWA и безопасность ограничены.',
      warningType: 'old_mac_linux',
      detailsReason: 'Устаревшая версия macOS (10.9-10.12) или Linux с неактуальным браузером. Требуется обновление браузера.'
    };
  }

  if (simMode === 'mac_linux_new') {
    return {
      osName: 'macOS / Linux (Новая версия)',
      osVersion: 'macOS 14 Sonoma / Modern Linux',
      browserName: 'Safari 17 / Chrome 125 / Firefox 125',
      browserVersion: 125,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      pwaUpdateSupported: true,
      pwaSecuritySupported: true,
      pwaStatusMessage: '✅ Новый Систем: macOS 11+ и Linux полностью поддерживают обновление DuoWindo6601 Progressive Web App (PWA) и обновление безопасности.',
      warningType: 'none',
      detailsReason: 'Современные версии macOS (11+) и Linux с современными браузерами полностью поддерживаются.'
    };
  }

  // REAL DETECTION
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      osName: 'Modern System',
      osVersion: '1.0',
      browserName: 'Modern Browser',
      browserVersion: 120,
      isWindowsXpOrVista: false,
      isOldAndroid: false,
      isIOS: false,
      isOldIOS: false,
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      pwaUpdateSupported: true,
      pwaSecuritySupported: true,
      pwaStatusMessage: '✅ Новый Систем: Обновление приложения DuoWindo6601 Progressive Web App (PWA) и обновление безопасности активны.',
      warningType: 'none',
      detailsReason: 'Современное окружение'
    };
  }

  const ua = navigator.userAgent;
  const navPlatform = (navigator as any).platform || '';
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;

  let osName = 'Неизвестная ОС';
  let osVersion = '';
  let isWindowsXpOrVista = false;
  let isOldAndroid = false;
  let isIOS = false;
  let isOldIOS = false;
  let isOldMacLinux = false;

  // Detect iOS or iPad (including modern iPadOS with desktop Safari UA)
  const isIPad = /iPad/.test(ua) || (navPlatform === 'MacIntel' && maxTouchPoints > 1);
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);

  if (isIPad || isIPhoneOrIPod) {
    isIOS = true;
    osName = isIPad ? 'Apple iPadOS (iPad)' : 'Apple iOS (iPhone)';
    const iosMatch = ua.match(/OS\s+([\d_]+)\s+like\s+Mac/);
    if (iosMatch) {
      osVersion = iosMatch[1].replace(/_/g, '.');
      const major = parseFloat(osVersion);
      if (major < 14.0) {
        isOldIOS = true;
      }
    } else if (isIPad && maxTouchPoints > 1) {
      // Modern iPad running iPadOS 13+
      osVersion = '15+';
    }
  } else if (ua.includes('Windows NT 5.1') || ua.includes('Windows NT 5.2') || ua.includes('Mypal')) {
    osName = 'Windows XP / Server 2003';
    osVersion = '5.1 / 5.2';
    isWindowsXpOrVista = true;
  } else if (ua.includes('Windows NT 6.0')) {
    osName = 'Windows Vista';
    osVersion = '6.0';
    isWindowsXpOrVista = true;
  } else if (ua.includes('Windows NT 6.1')) {
    osName = 'Windows 7';
    osVersion = '6.1';
  } else if (ua.includes('Windows NT 6.2')) {
    osName = 'Windows 8';
    osVersion = '6.2';
  } else if (ua.includes('Windows NT 6.3')) {
    osName = 'Windows 8.1';
    osVersion = '6.3';
  } else if (ua.includes('Windows NT 10.0')) {
    osName = 'Windows 10 / 11';
    osVersion = '10.0';
  } else if (ua.includes('Android')) {
    osName = 'Android';
    const androidMatch = ua.match(/Android\s+([\d.]+)/);
    if (androidMatch) {
      osVersion = androidMatch[1];
      const majorVersion = parseFloat(osVersion);
      if (majorVersion < 8.0) {
        isOldAndroid = true;
      }
    }
  } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    osName = 'macOS';
    const macMatch = ua.match(/Mac OS X\s+([\d_]+)/);
    if (macMatch) {
      osVersion = macMatch[1].replace(/_/g, '.');
      if (osVersion.startsWith('10.9') || osVersion.startsWith('10.10') || osVersion.startsWith('10.11') || osVersion.startsWith('10.12')) {
        isOldMacLinux = true;
      }
    }
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
  }

  // Browser Check
  let browserName = 'Современный браузер';
  let browserVersion = 100;
  let isOldBrowser = false;

  if (ua.includes('MSIE') || ua.includes('Trident/')) {
    browserName = 'Internet Explorer';
    browserVersion = 11;
    isOldBrowser = true;
  } else if (ua.includes('Mypal')) {
    browserName = 'Mypal 78.0.3 XP';
    browserVersion = 78;
    isOldBrowser = true;
  } else {
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    const safariMatch = ua.match(/Version\/(\d+).*Safari/);
    const legacyEdgeMatch = ua.match(/Edge\/(\d+)/);

    if (legacyEdgeMatch) {
      browserName = 'Legacy Edge';
      browserVersion = parseInt(legacyEdgeMatch[1], 10);
      if (browserVersion < 80) isOldBrowser = true;
    } else if (chromeMatch) {
      browserName = 'Chrome';
      browserVersion = parseInt(chromeMatch[1], 10);
      if (browserVersion < 80) isOldBrowser = true;
    } else if (firefoxMatch) {
      browserName = 'Firefox';
      browserVersion = parseInt(firefoxMatch[1], 10);
      if (browserVersion < 78) isOldBrowser = true;
    } else if (safariMatch) {
      browserName = 'Safari';
      browserVersion = parseInt(safariMatch[1], 10);
      if (browserVersion < 13) isOldBrowser = true;
    }
  }

  // Feature checks for missing ES6/HTML5 standard features
  const hasMissingFeatures = !window.fetch || 
                             !window.Promise || 
                             !window.Symbol || 
                             !Array.prototype.flat || 
                             !window.customElements;

  if (hasMissingFeatures) {
    isOldBrowser = true;
  }

  let warningType: WarningType = 'none';
  let detailsReason = `Система полностью поддерживается (${osName} ${osVersion} + современный браузер).`;

  if (isWindowsXpOrVista) {
    warningType = 'windows_xp_vista';
    detailsReason = `Прекращена поддержка браузера Mypal 78.0.3 XP, OneCore API и ${osName}. Прекращение Microsoft Speech API 4.0. Переход на Microsoft Speech API (SAPI) 5.3 вместе с современными Windows AI APIs для распознавания речи на устройстве. Старые Системы не получится обновить PWA.`;
  } else if (isOldAndroid) {
    warningType = 'old_android';
    detailsReason = `Версия Android (${osVersion}) устарела. Минимально поддерживаемая версия Android: 8.0+. Старые Системы не получится обновить PWA.`;
  } else if (isOldIOS) {
    warningType = 'old_ios';
    detailsReason = `Версия Apple iOS / iPadOS (${osVersion}) устарела (< 14.0). Старые Системы не получится обновить приложение DuoWindo6601 PWA и безопасность. Требуется iOS / iPadOS 15.0+.`;
  } else if (isOldMacLinux) {
    warningType = 'old_mac_linux';
    detailsReason = `Версия ${osName} (${osVersion}) или текущий браузер устарели. Обновите операционную систему или браузер.`;
  } else if (isOldBrowser) {
    warningType = 'old_browser';
    detailsReason = `Браузер ${browserName} v${browserVersion} устарел. Рекомендуется обновить браузер. Старые Системы не получится обновить PWA.`;
  }

  const isModernSystem = !isWindowsXpOrVista && !isOldAndroid && !isOldIOS && !isOldMacLinux && !isOldBrowser;
  const pwaUpdateSupported = isModernSystem;
  const pwaSecuritySupported = isModernSystem;

  let pwaStatusMessage = '';
  if (isModernSystem) {
    pwaStatusMessage = `✅ Новый Систем: Обновление приложения DuoWindo6601 Progressive Web App (PWA) и Обновление безопасности активны на ${osName}.`;
  } else {
    pwaStatusMessage = `🛑 Старые Системы — Не получится: Обновление приложения DuoWindo6601 Progressive Web App (PWA) и Обновление безопасности недоступны на ${osName}. Отсутствует поддержка современных Web App стандартов.`;
  }

  return {
    osName,
    osVersion,
    browserName,
    browserVersion,
    isWindowsXpOrVista,
    isOldAndroid,
    isIOS,
    isOldIOS,
    isOldMacLinux,
    isOldBrowser,
    isModernSystem,
    pwaUpdateSupported,
    pwaSecuritySupported,
    pwaStatusMessage,
    warningType,
    detailsReason
  };
}

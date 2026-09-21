export type SimulationMode = 
  | 'real' 
  | 'xp' 
  | 'vista' 
  | 'old_browser' 
  | 'win10_modern'
  | 'android_old'
  | 'android_new'
  | 'mac_linux_old'
  | 'mac_linux_new';

export type WarningType = 'none' | 'windows_xp_vista' | 'old_android' | 'old_mac_linux' | 'old_browser';

export interface SystemCompatibilityResult {
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: number;
  isWindowsXpOrVista: boolean;
  isOldAndroid: boolean;
  isOldMacLinux: boolean;
  isOldBrowser: boolean;
  isModernSystem: boolean;
  warningType: WarningType;
  detailsReason: string;
}

export function detectSystemCompatibility(simMode: SimulationMode = 'real'): SystemCompatibilityResult {
  if (simMode === 'xp') {
    return {
      osName: 'Windows XP',
      osVersion: '5.1 (NT)',
      browserName: 'Chrome (Outdated)',
      browserVersion: 49,
      isWindowsXpOrVista: true,
      isOldAndroid: false,
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      warningType: 'windows_xp_vista',
      detailsReason: 'Операционная система Windows XP снята с поддержки DuoWindo6601.'
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
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      warningType: 'windows_xp_vista',
      detailsReason: 'Операционная система Windows Vista снята с поддержки DuoWindo6601.'
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
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      warningType: 'old_browser',
      detailsReason: 'Используется устаревший веб-браузер, не поддерживающий современные стандарты HTML5/ES6.'
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
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      warningType: 'none',
      detailsReason: 'Система полностью поддерживается (Windows 7/8/8.1/10/11 + современный браузер).'
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
      isOldMacLinux: false,
      isOldBrowser: true,
      isModernSystem: false,
      warningType: 'old_android',
      detailsReason: 'Прекращена поддержка старых версий Android (4.4 - 7.1). Требуется Android 8.0+ и актуальный Chrome.'
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
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      warningType: 'none',
      detailsReason: 'Современная система Android (8.0+) и Chrome Mobile полностью поддерживаются без предупреждений.'
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
      isOldMacLinux: true,
      isOldBrowser: true,
      isModernSystem: false,
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
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
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
      isOldMacLinux: false,
      isOldBrowser: false,
      isModernSystem: true,
      warningType: 'none',
      detailsReason: 'Современное окружение'
    };
  }

  const ua = navigator.userAgent;

  let osName = 'Неизвестная ОС';
  let osVersion = '';
  let isWindowsXpOrVista = false;
  let isOldAndroid = false;
  let isOldMacLinux = false;

  // OS Check
  if (ua.includes('Windows NT 5.1') || ua.includes('Windows NT 5.2')) {
    osName = 'Windows XP';
    osVersion = '5.1';
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
  } else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
    osName = 'iOS';
    const iosMatch = ua.match(/OS\s+([\d_]+)\s+like\s+Mac/);
    if (iosMatch) {
      osVersion = iosMatch[1].replace(/_/g, '.');
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
    detailsReason = `Прекращение поддержки операционной системы ${osName}. Минимальная версия Windows: 7 / 8 / 8.1 / 10 / 11.`;
  } else if (isOldAndroid) {
    warningType = 'old_android';
    detailsReason = `Версия Android (${osVersion}) устарела. Минимально поддерживаемая версия Android: 8.0+.`;
  } else if (isOldMacLinux) {
    warningType = 'old_mac_linux';
    detailsReason = `Версия ${osName} (${osVersion}) или текущий браузер устарели. Обновите операционную систему или браузер.`;
  } else if (isOldBrowser) {
    warningType = 'old_browser';
    detailsReason = `Браузер ${browserName} v${browserVersion} устарел. Рекомендуется обновить браузер.`;
  }

  const isModernSystem = !isWindowsXpOrVista && !isOldAndroid && !isOldMacLinux && !isOldBrowser;

  return {
    osName,
    osVersion,
    browserName,
    browserVersion,
    isWindowsXpOrVista,
    isOldAndroid,
    isOldMacLinux,
    isOldBrowser,
    isModernSystem,
    warningType,
    detailsReason
  };
}

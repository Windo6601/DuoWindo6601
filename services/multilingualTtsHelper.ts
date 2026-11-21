/**
 * Shared multilingual TTS language routing and phonetic normalization.
 * Guarantees that non-English courses and Beta language courses NEVER fall back
 * to an English voice or English phonology, while preserving English ('en') intact.
 */

export const GTTS_SUPPORTED_LANGS = new Set([
  'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'zh', 'ko', 'ar', 'he',
  'sv', 'no', 'la', 'fi', 'hu', 'is', 'pl', 'tr', 'nl', 'id', 'hi', 'el',
  'ro', 'cs', 'vi', 'th', 'uk', 'et', 'lv', 'lt', 'eu'
]);

const ARMENIAN_TO_LATIN: Record<string, string> = {
  'ա': 'a', 'բ': 'b', 'գ': 'g', 'դ': 'd', 'ե': 'e', 'զ': 'z', 'է': 'e', 'ը': 'y',
  'թ': 't', 'ժ': 'zh', 'ի': 'i', 'լ': 'l', 'խ': 'kh', 'ծ': 'ts', 'կ': 'k', 'հ': 'h',
  'ձ': 'dz', 'ղ': 'gh', 'ճ': 'ch', 'մ': 'm', 'յ': 'y', 'ն': 'n', 'շ': 'sh', 'ո': 'o',
  'չ': 'ch', 'պ': 'p', 'ջ': 'j', 'ռ': 'r', 'ս': 's', 'վ': 'v', 'տ': 't', 'ր': 'r',
  'ց': 'ts', 'ւ': 'v', 'փ': 'p', 'ք': 'k', 'օ': 'o', 'ֆ': 'f', 'և': 'ev',
};

const GEORGIAN_TO_LATIN: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
  'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
  'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q',
  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j',
  'ჰ': 'h',
};

export function normalizeCourseLangCode(rawLang: string): string {
  const clean = (rawLang || '').trim().toLowerCase();
  if (!clean) return 'en';
  if (clean === 'rf-chuvash') return 'cv';
  if (clean.startsWith('rf-')) return 'ru';
  if (clean === 'klingon') return 'tlh';
  const base = clean.split(/[-_]/)[0];
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'mo') return 'ro';
  if (base === 'iw') return 'he';
  return base || 'en';
}

export function resolveGoogleTtsLang(rawLang: string): { tl: string; textTransform?: (s: string) => string } | null {
  const lang = normalizeCourseLangCode(rawLang);
  if (lang === 'tlh') return null;
  if (GTTS_SUPPORTED_LANGS.has(lang)) {
    return { tl: lang === 'zh' ? 'zh-CN' : lang };
  }
  return null;
}

/**
 * Resolves a course language that lacks a native TTS model in a given provider
 * into the closest phonetic sister language + orthography normalization so it
 * speaks naturally instead of falling back to English.
 */
export function resolvePhoneticTtsTarget(
  text: string,
  rawLang: string,
  supportedSet: Set<string>
): { lang: string; text: string } {
  const lang = normalizeCourseLangCode(rawLang);
  if (lang === 'tlh') return { lang: 'tlh', text };
  if (lang === 'en') return { lang: 'en', text };

  if (supportedSet.has(lang)) {
    return { lang, text };
  }

  // Moldavian -> Romanian
  if (lang === 'mo' && supportedSet.has('ro')) {
    return { lang: 'ro', text };
  }

  // Latin -> Italian/Spanish pure vowels if native 'la' isn't supported by provider
  if (lang === 'la') {
    const target = supportedSet.has('it') ? 'it' : supportedSet.has('es') ? 'es' : lang;
    return { lang: target, text };
  }

  // Esperanto (Beta) -> Italian/Spanish phonetic vowels (never English)
  if (lang === 'eo') {
    const phonetic = text
      .replace(/ĉ/g, 'ch').replace(/Ĉ/g, 'Ch')
      .replace(/ĝ/g, 'gi').replace(/Ĝ/g, 'Gi')
      .replace(/ĥ/g, 'h').replace(/Ĥ/g, 'H')
      .replace(/ĵ/g, 'zh').replace(/Ĵ/g, 'Zh')
      .replace(/ŝ/g, 'sh').replace(/Ŝ/g, 'Sh')
      .replace(/ŭ/g, 'u').replace(/Ŭ/g, 'U')
      .replace(/\bc/g, 'ts').replace(/\bC/g, 'Ts');
    const target = supportedSet.has('es') ? 'es' : supportedSet.has('it') ? 'it' : lang;
    return { lang: target, text: phonetic };
  }

  // High Valyrian (Beta) -> Italian/Spanish pure vowels & rolled R
  if (lang === 'hv') {
    const phonetic = text
      .replace(/y/g, 'i').replace(/Y/g, 'I')
      .replace(/q/g, 'k').replace(/Q/g, 'K');
    const target = supportedSet.has('it') ? 'it' : supportedSet.has('es') ? 'es' : lang;
    return { lang: target, text: phonetic };
  }

  // Yiddish (Beta) -> Hebrew script via Hebrew TTS, Latin YIVO via German TTS
  if (lang === 'yi') {
    if (/[\u0590-\u05FF]/.test(text) && supportedSet.has('he')) {
      return { lang: 'he', text };
    }
    if (supportedSet.has('de')) {
      return { lang: 'de', text };
    }
  }

  // Belarusian -> Ukrainian / Russian
  if (lang === 'be') {
    const phonetic = text.replace(/ў/g, 'в').replace(/Ў/g, 'В');
    const target = supportedSet.has('uk') ? 'uk' : supportedSet.has('ru') ? 'ru' : lang;
    return { lang: target, text: phonetic };
  }

  // Chuvash, Tatar, Kazakh, Kyrgyz, Tajik, Tabasaran (Cyrillic) -> Russian TTS with phonetic character normalization
  if (['cv', 'tt', 'kk', 'ky', 'tg', 'tab'].includes(lang)) {
    if (/[\u0400-\u04FF]/.test(text) && supportedSet.has('ru')) {
      const phonetic = text
        .replace(/ӑ/g, 'а').replace(/Ӑ/g, 'А')
        .replace(/ӗ/g, 'е').replace(/Ӗ/g, 'Е')
        .replace(/ҫ/g, 'с').replace(/Ҫ/g, 'С')
        .replace(/ӳ/g, 'ю').replace(/Ӳ/g, 'Ю')
        .replace(/ә/g, 'а').replace(/Ә/g, 'А')
        .replace(/ө/g, 'о').replace(/Ө/g, 'О')
        .replace(/ү/g, 'у').replace(/Ү/g, 'У')
        .replace(/ұ/g, 'у').replace(/Ұ/g, 'У')
        .replace(/җ/g, 'ж').replace(/Җ/g, 'Ж')
        .replace(/ҷ/g, 'дж').replace(/Ҷ/g, 'Дж')
        .replace(/ң/g, 'нг').replace(/Ң/g, 'Нг')
        .replace(/һ/g, 'х').replace(/Һ/g, 'Х')
        .replace(/қ/g, 'к').replace(/Қ/g, 'К')
        .replace(/ғ/g, 'г').replace(/Ғ/g, 'Г')
        .replace(/і/g, 'и').replace(/І/g, 'И')
        .replace(/ӯ/g, 'у').replace(/Ӯ/g, 'У')
        .replace(/ӣ/g, 'и').replace(/Ӣ/g, 'И')
        .replace(/ӏ/g, '');
      return { lang: 'ru', text: phonetic };
    }
    if (supportedSet.has('tr')) {
      return { lang: 'tr', text };
    }
  }

  // Uzbek, Azerbaijani, Turkmen (Turkic Latin) -> Turkish TTS
  if (['uz', 'az', 'tk'].includes(lang) && supportedSet.has('tr')) {
    const phonetic = text
      .replace(/o['’`ʻ]/gi, 'ö')
      .replace(/g['’`ʻ]/gi, 'ğ')
      .replace(/sh/g, 'ş').replace(/Sh/g, 'Ş').replace(/SH/g, 'Ş')
      .replace(/ch/g, 'ç').replace(/Ch/g, 'Ç').replace(/CH/g, 'Ç')
      .replace(/ə/g, 'e').replace(/Ə/g, 'E')
      .replace(/x/g, 'h').replace(/X/g, 'H')
      .replace(/q/g, 'k').replace(/Q/g, 'K')
      .replace(/ý/g, 'y').replace(/Ý/g, 'Y')
      .replace(/ž/g, 'j').replace(/Ž/g, 'J')
      .replace(/ä/g, 'e').replace(/Ä/g, 'E');
    return { lang: 'tr', text: phonetic };
  }

  // Armenian -> transliterate to phonetic Latin + Turkish/Italian TTS
  if (lang === 'hy') {
    const translit = Array.from(text).map((ch) => {
      const lower = ch.toLowerCase();
      return ARMENIAN_TO_LATIN[lower] ?? ch;
    }).join('');
    const target = supportedSet.has('it') ? 'it' : supportedSet.has('es') ? 'es' : lang;
    return { lang: target, text: translit };
  }

  // Georgian -> transliterate to phonetic Latin + Italian/Spanish TTS
  if (lang === 'ka') {
    const translit = Array.from(text).map((ch) => GEORGIAN_TO_LATIN[ch] ?? ch).join('');
    const target = supportedSet.has('it') ? 'it' : supportedSet.has('es') ? 'es' : lang;
    return { lang: target, text: translit };
  }

  // Icelandic / Estonian / Latvian / Lithuanian / Basque -> Italian/Spanish/Finnish/German if GTTS unavailable
  if (lang === 'is' && supportedSet.has('no')) return { lang: 'no', text };
  if (lang === 'et' && supportedSet.has('fi')) return { lang: 'fi', text };
  if ((lang === 'lv' || lang === 'lt') && supportedSet.has('pl')) return { lang: 'pl', text };
  if (lang === 'eu' && supportedSet.has('es')) return { lang: 'es', text };
  if (lang === 'nv' && supportedSet.has('es')) return { lang: 'es', text };

  return { lang, text };
}

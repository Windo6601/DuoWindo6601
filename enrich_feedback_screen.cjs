const fs = require("fs");

let content = fs.readFileSync("components/FeedbackScreen.tsx", "utf8");

// Add translations for ADMIN_NAME_TRANSLATIONS
const adminTransl = `export const ADMIN_NAME_TRANSLATIONS: Record<string, string> = {
  ru: 'Администратор DuoWindo6601',
  en: 'DuoWindo6601 Administrator',
  de: 'DuoWindo6601-Administrator',
  fr: 'Administrateur DuoWindo6601',
  es: 'Administrador de DuoWindo6601',
  ja: 'DuoWindo6601 管理者',
  zh: 'DuoWindo6601 管理员',
  ar: 'مسؤول DuoWindo6601',
  pt: 'Administrador DuoWindo6601',
  it: 'Amministratore DuoWindo6601',
  tr: 'DuoWindo6601 Yöneticisi',
  ko: 'DuoWindo6601 관리자',
  hi: 'DuoWindo6601 प्रशासक',
  pl: 'Administrator DuoWindo6601',
  id: 'Administrator DuoWindo6601',
  bn: 'DuoWindo6601 প্রশাসক',
  th: 'ผู้ดูแลระบบ DuoWindo6601',
  vi: 'Quản trị viên DuoWindo6601',
  kk: 'DuoWindo6601 Әкімшісі',
  uz: 'DuoWindo6601 Administratori',
  hy: 'DuoWindo6601 Ադմինիստրատոր',
  ka: 'DuoWindo6601 ადმინისტრატორი',
  az: 'DuoWindo6601 Administratoru'
};`;

content = content.replace(/export const ADMIN_NAME_TRANSLATIONS: Record<string, string> = \{[\s\S]*?\};/, adminTransl);

// Fix getTranslatedAuthorName & getTranslatedCategory fallback order
content = content.replace(
  "return ADMIN_NAME_TRANSLATIONS[targetLang] || ADMIN_NAME_TRANSLATIONS['ru'];",
  "return ADMIN_NAME_TRANSLATIONS[targetLang] || ADMIN_NAME_TRANSLATIONS['en'] || ADMIN_NAME_TRANSLATIONS['ru'];"
);

content = content.replace(
  "return catObj[targetLang] || catObj['ru'] || categoryStr;",
  "return catObj[targetLang] || catObj['en'] || catObj['ru'] || categoryStr;"
);

// Fix back button text in FeedbackScreen.tsx line 1473
const backButtonFix = `<span>{
  currentLang === 'en' ? 'Back' :
  currentLang === 'de' ? 'Zurück' :
  currentLang === 'fr' ? 'Retour' :
  currentLang === 'es' ? 'Volver' :
  currentLang === 'ja' ? '戻る' :
  currentLang === 'zh' ? '返回' :
  currentLang === 'ar' ? 'رجوع' :
  currentLang === 'pt' ? 'Voltar' :
  currentLang === 'it' ? 'Indietro' :
  currentLang === 'tr' ? 'Geri' :
  currentLang === 'ko' ? '뒤로' :
  currentLang === 'hi' ? 'वापस' :
  currentLang === 'pl' ? 'Wstecz' :
  currentLang === 'id' ? 'Kembali' :
  currentLang === 'bn' ? 'ফিরে যান' :
  currentLang === 'th' ? 'ย้อนกลับ' :
  currentLang === 'vi' ? 'Quay lại' :
  currentLang === 'kk' ? 'Артқа' :
  currentLang === 'uz' ? 'Orqaga' :
  currentLang === 'hy' ? 'Հետ' :
  currentLang === 'ka' ? 'უკან' :
  currentLang === 'az' ? 'Geri' : 'Назад'
}</span>`;

content = content.replace(/<span>\{currentLang === 'ru' \? 'Назад' :[\s\S]*?\}<\/span>/, backButtonFix);

fs.writeFileSync("components/FeedbackScreen.tsx", content);
console.log("Updated FeedbackScreen.tsx successfully!");

import fs from 'fs';

let content = fs.readFileSync('services/extendedTranslations.ts', 'utf8');

// 1. Fix "streakFreezeActive": "❄️ Streak Freeze active ({count,
content = content.replaceAll('"streakFreezeActive": "❄️ Streak Freeze active ({count,', '"streakFreezeActive": "❄️ Streak Freeze active ({count})",');

// 2. Fix trailing })" on language_switched lines
content = content.replace(/("language_switched": "[^"\r\n]+)\}\)"/g, '$1"');

fs.writeFileSync('services/extendedTranslations.ts', content, 'utf8');
console.log('Fixed services/extendedTranslations.ts successfully.');

import { Exercise, MathDifficulty } from '../types';

export type MathTopic = 'arithmetic' | 'algebra' | 'geometry' | 'analysis';

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const getMathDifficultyMeta = (difficulty: MathDifficulty, lang: string = 'ru') => {
  const isRu = lang === 'ru';
  if (difficulty === 'hard') {
    return {
      id: 'hard' as const,
      label: isRu ? 'Сложный' : 'Hard',
      shortLabel: isRu ? 'Сложный (Hard)' : 'Hard',
      badge: isRu ? '🔴 Сложный' : '🔴 Hard',
      xpReward: 35,
      desc: isRu
        ? 'Большие числа, многошаговые выражения, дроби и близкие варианты ответа'
        : 'Larger numbers, multi-step expressions, and tighter distractors'
    };
  }
  if (difficulty === 'medium') {
    return {
      id: 'medium' as const,
      label: isRu ? 'Средний' : 'Medium',
      shortLabel: isRu ? 'Средний (Medium)' : 'Medium',
      badge: isRu ? '🟡 Средний' : '🟡 Medium',
      xpReward: 28,
      desc: isRu
        ? 'Расширенный диапазон чисел, комбинированные действия и задачи в 2 шага'
        : 'Wider number ranges, combined operations, and 2-step problems'
    };
  }
  return {
    id: 'easy' as const,
    label: isRu ? 'Лёгкий' : 'Easy',
    shortLabel: isRu ? 'Лёгкий (Easy)' : 'Easy',
    badge: isRu ? '🟢 Лёгкий' : '🟢 Easy',
    xpReward: 20,
    desc: isRu
      ? 'Базовые числа и одношаговые примеры для уверенного старта'
      : 'Friendly number ranges and single-step warmups'
  };
};

const buildNumericDistractors = (
  answer: string,
  difficulty: MathDifficulty
): string[] => {
  const numAns = parseFloat(answer);
  if (isNaN(numAns)) return [];

  const result = new Set<string>();
  const offsets =
    difficulty === 'hard'
      ? Number.isInteger(numAns)
        ? [1, -1, 2, -2, 10, -10, 3, -3]
        : [0.05, -0.05, 0.1, -0.1, 0.25, -0.25]
      : difficulty === 'medium'
      ? Number.isInteger(numAns)
        ? [1, -1, 3, -3, 10, -10, 4, -4]
        : [0.1, -0.1, 0.2, -0.2, 0.5, -0.5]
      : Number.isInteger(numAns)
      ? [2, -2, 5, -5, 10, -10, 4]
      : [0.2, -0.2, 0.5, -0.5, 1, -1];

  for (const offset of offsets) {
    if (result.size >= 3) break;
    const candidateNum = numAns + offset;
    // Keep positive distractors for elementary-like non-negative answers on easy
    if (numAns >= 0 && difficulty === 'easy' && candidateNum < 0) continue;
    const formatted = Number.isInteger(numAns)
      ? Math.round(candidateNum).toString()
      : parseFloat(candidateNum.toFixed(2)).toString();
    if (formatted !== answer) {
      result.add(formatted);
    }
  }

  let fallbackDelta = 1;
  while (result.size < 3) {
    const candidate = Number.isInteger(numAns)
      ? (numAns + fallbackDelta).toString()
      : parseFloat((numAns + fallbackDelta * 0.5).toFixed(2)).toString();
    if (candidate !== answer) result.add(candidate);
    fallbackDelta = fallbackDelta > 0 ? -fallbackDelta : -fallbackDelta + 1;
  }

  return Array.from(result).slice(0, 3);
};

export const generateMathExercise = (
  grade: number,
  topic: MathTopic,
  difficulty: MathDifficulty = 'easy'
): Exercise => {
  let question = '';
  let answer = '';
  let distractors: string[] = [];

  if (topic === 'arithmetic') {
    if (grade === 2) {
      if (difficulty === 'easy') {
        const mode = Math.random();
        if (mode < 0.45) {
          const a = randInt(10, 35);
          const b = randInt(5, 25);
          question = `${a} + ${b} = ?`;
          answer = (a + b).toString();
        } else if (mode < 0.8) {
          const a = randInt(25, 60);
          const b = randInt(5, 20);
          question = `${a} - ${b} = ?`;
          answer = (a - b).toString();
        } else {
          const a = randInt(2, 6);
          const b = pick([2, 3]);
          question = `${a} × ${b} = ?`;
          answer = (a * b).toString();
        }
      } else if (difficulty === 'medium') {
        const mode = Math.random();
        if (mode < 0.4) {
          const a = randInt(38, 85);
          const b = randInt(19, 64);
          question = `${a} + ${b} = ?`;
          answer = (a + b).toString();
        } else if (mode < 0.75) {
          const a = randInt(65, 99);
          const b = randInt(24, 58);
          question = `${a} - ${b} = ?`;
          answer = (a - b).toString();
        } else {
          const a = randInt(4, 9);
          const b = pick([3, 4, 5]);
          const c = randInt(5, 15);
          question = `${a} × ${b} + ${c} = ?`;
          answer = (a * b + c).toString();
        }
      } else {
        const mode = Math.random();
        if (mode < 0.5) {
          const a = randInt(120, 340);
          const b = randInt(45, 185);
          const c = randInt(15, 65);
          question = `${a} + ${b} - ${c} = ?`;
          answer = (a + b - c).toString();
        } else {
          const a = randInt(6, 9);
          const b = randInt(4, 8);
          const c = randInt(12, 35);
          question = `(${a} × ${b}) + ${c} = ?`;
          answer = (a * b + c).toString();
        }
      }
    } else if (grade === 3) {
      if (difficulty === 'easy') {
        const a = randInt(2, 6);
        const b = randInt(2, 7);
        if (Math.random() > 0.5) {
          question = `${a * b} ÷ ${a} = ?`;
          answer = b.toString();
        } else {
          question = `${a} × ${b} = ?`;
          answer = (a * b).toString();
        }
      } else if (difficulty === 'medium') {
        const a = randInt(5, 12);
        const b = randInt(4, 9);
        const c = randInt(10, 35);
        if (Math.random() > 0.5) {
          question = `${a} × ${b} - ${c} = ?`;
          answer = (a * b - c).toString();
        } else {
          question = `${a * b} ÷ ${a} + ${c} = ?`;
          answer = (b + c).toString();
        }
      } else {
        const a = randInt(12, 24);
        const b = randInt(4, 9);
        const c = randInt(3, 8);
        const d = randInt(2, 6);
        question = `${a} × ${b} - ${c * d} ÷ ${c} = ?`;
        answer = (a * b - d).toString();
      }
    } else if (grade === 4) {
      if (difficulty === 'easy') {
        if (Math.random() < 0.5) {
          const a = randInt(15, 45);
          const b = randInt(3, 6);
          question = `${a} × ${b} = ?`;
          answer = (a * b).toString();
        } else {
          const den = 8;
          const n1 = randInt(1, 3);
          const n2 = randInt(1, 3);
          question = `${n1}/${den} + ${n2}/${den} = ?`;
          answer = `${n1 + n2}/${den}`;
          distractors = [`${n1 + n2 + 1}/${den}`, `${n1 + n2}/${den * 2}`, `${Math.max(1, n1 + n2 - 1)}/${den}`];
        }
      } else if (difficulty === 'medium') {
        if (Math.random() < 0.5) {
          const a = randInt(55, 145);
          const b = randInt(6, 14);
          question = `${a} × ${b} = ?`;
          answer = (a * b).toString();
        } else {
          const den = pick([9, 12, 15]);
          const n1 = randInt(2, 6);
          const n2 = randInt(2, 5);
          question = `${n1}/${den} + ${n2}/${den} = ?`;
          answer = `${n1 + n2}/${den}`;
          distractors = [`${n1 + n2 + 1}/${den}`, `${n1 + n2}/${den * 2}`, `${n1 + n2 - 1}/${den}`];
        }
      } else {
        if (Math.random() < 0.55) {
          const a = randInt(125, 380);
          const b = randInt(12, 29);
          const c = randInt(40, 160);
          question = `${a} × ${b} + ${c} = ?`;
          answer = (a * b + c).toString();
        } else {
          const den = pick([12, 16, 20]);
          const n1 = randInt(7, den - 2);
          const n2 = randInt(2, 5);
          const n3 = randInt(1, 3);
          const res = n1 - n2 + n3;
          question = `${n1}/${den} - ${n2}/${den} + ${n3}/${den} = ?`;
          answer = `${res}/${den}`;
          distractors = [`${res + 1}/${den}`, `${Math.max(1, res - 1)}/${den}`, `${res}/${den * 2}`];
        }
      }
    } else if (grade === 5) {
      if (difficulty === 'easy') {
        if (Math.random() < 0.5) {
          const a = randInt(11, 45) / 10;
          const b = randInt(11, 35) / 10;
          question = `${a} + ${b} = ?`;
          answer = parseFloat((a + b).toFixed(1)).toString();
        } else {
          const pct = pick([10, 20, 50]);
          const total = pick([100, 200, 400]);
          question = `${pct}% от ${total} = ?`;
          answer = ((pct / 100) * total).toString();
        }
      } else if (difficulty === 'medium') {
        if (Math.random() < 0.5) {
          const a = randInt(35, 145) / 10;
          const b = randInt(15, 85) / 10;
          const c = randInt(2, 4);
          question = `(${a} + ${b}) × ${c} = ?`;
          answer = parseFloat(((a + b) * c).toFixed(1)).toString();
        } else {
          const pct = pick([15, 25, 35, 40, 75]);
          const total = pick([200, 300, 400, 600, 800]);
          question = `${pct}% от ${total} = ?`;
          answer = ((pct / 100) * total).toString();
        }
      } else {
        if (Math.random() < 0.5) {
          const a = randInt(125, 465) / 100;
          const b = randInt(115, 345) / 100;
          const mult = pick([4, 5, 8, 10]);
          question = `(${a} + ${b}) × ${mult} = ?`;
          answer = parseFloat(((a + b) * mult).toFixed(2)).toString();
        } else {
          const pct = pick([12, 18, 24, 35, 65]);
          const total = pick([250, 500, 750, 1200]);
          question = `${pct}% от ${total} = ?`;
          answer = parseFloat(((pct / 100) * total).toFixed(2)).toString();
        }
      }
    } else if (grade === 6) {
      if (difficulty === 'easy') {
        if (Math.random() < 0.5) {
          const a = -randInt(5, 18);
          const b = randInt(10, 28);
          question = `${a} + ${b} = ?`;
          answer = (a + b).toString();
        } else {
          const a = -randInt(2, 6);
          const b = -randInt(2, 6);
          question = `(${a}) × (${b}) = ?`;
          answer = (a * b).toString();
        }
      } else if (difficulty === 'medium') {
        if (Math.random() < 0.5) {
          const a = -randInt(25, 68);
          const b = randInt(14, 55);
          const c = -randInt(8, 24);
          question = `${a} + ${b} - (${c}) = ?`;
          answer = (a + b - c).toString();
        } else {
          const a = -randInt(6, 14);
          const b = -randInt(4, 11);
          const c = randInt(10, 30);
          question = `(${a}) × (${b}) - ${c} = ?`;
          answer = (a * b - c).toString();
        }
      } else {
        const a = -randInt(12, 25);
        const b = randInt(4, 9);
        const c = -randInt(18, 55);
        question = `(${a}) × ${b} + |${c}| = ?`;
        answer = (a * b + Math.abs(c)).toString();
      }
    } else if (grade === 7) {
      if (difficulty === 'easy') {
        const base = pick([2, 3, 5, 10]);
        const exp = base === 10 ? 3 : pick([2, 3]);
        question = `${base}^${exp} = ?`;
        answer = Math.pow(base, exp).toString();
      } else if (difficulty === 'medium') {
        const base = pick([2, 3, 4, 5]);
        const exp1 = randInt(3, 5);
        const exp2 = randInt(1, 2);
        question = `${base}^${exp1} ÷ ${base}^${exp2} = ?`;
        answer = Math.pow(base, exp1 - exp2).toString();
      } else {
        const a = pick([2, 3, 4]);
        const b = pick([3, 5, 7]);
        const expA = pick([3, 4]);
        const expB = 2;
        question = `${a}^${expA} × ${b}^${expB} = ?`;
        answer = (Math.pow(a, expA) * Math.pow(b, expB)).toString();
      }
    } else if (grade === 8) {
      if (difficulty === 'easy') {
        const num = pick([16, 25, 36, 49, 64, 81, 100]);
        const plus = randInt(4, 15);
        question = `√${num} + ${plus} = ?`;
        answer = (Math.sqrt(num) + plus).toString();
      } else if (difficulty === 'medium') {
        const n1 = pick([36, 49, 64, 81, 100, 121, 144]);
        const n2 = pick([9, 16, 25, 36]);
        const k = randInt(2, 5);
        question = `${k}√${n1} - √${n2} = ?`;
        answer = (k * Math.sqrt(n1) - Math.sqrt(n2)).toString();
      } else {
        const n1 = pick([169, 196, 225, 256, 289, 324]);
        const n2 = pick([49, 64, 81, 121]);
        const mult = randInt(2, 4);
        question = `√${n1} + ${mult} × √${n2} = ?`;
        answer = (Math.sqrt(n1) + mult * Math.sqrt(n2)).toString();
      }
    } else if (grade === 9) {
      if (difficulty === 'easy') {
        const a1 = randInt(1, 5);
        const d = randInt(2, 4);
        question = `Прогрессия: a₁ = ${a1}, d = ${d}. a₄ = ?`;
        answer = (a1 + 3 * d).toString();
      } else if (difficulty === 'medium') {
        const a1 = randInt(2, 9);
        const d = randInt(3, 7);
        const n = randInt(6, 9);
        question = `Арифм. прогрессия: a₁ = ${a1}, d = ${d}. Найдите a_${n} = ?`;
        answer = (a1 + (n - 1) * d).toString();
      } else {
        const mode = Math.random();
        if (mode < 0.5) {
          const a1 = randInt(2, 8);
          const d = randInt(3, 8);
          const n = pick([6, 8, 10]);
          const sum = ((2 * a1 + (n - 1) * d) * n) / 2;
          question = `Сумма S_${n} арифм. прогрессии (a₁ = ${a1}, d = ${d}) = ?`;
          answer = sum.toString();
        } else {
          const b1 = pick([2, 3, 5]);
          const q = pick([2, 3]);
          const n = 4;
          question = `Геом. прогрессия: b₁ = ${b1}, q = ${q}. Найдите b₄ + b₂ = ?`;
          answer = (b1 * Math.pow(q, n - 1) + b1 * q).toString();
        }
      }
    } else if (grade === 10) {
      if (difficulty === 'easy') {
        const logs = [
          { q: 'log₂(16) = ?', a: '4' },
          { q: 'log₃(27) = ?', a: '3' },
          { q: 'log₅(25) = ?', a: '2' },
          { q: 'log₁₀(1000) = ?', a: '3' }
        ];
        const chosen = pick(logs);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: 'log₂(32) + log₃(9) = ?', a: '7' },
          { q: '27^(2/3) + 16^(1/2) = ?', a: '13' },
          { q: 'Сочетания C(6, 2) = ?', a: '15' },
          { q: 'P₄ = 4! + 3! = ?', a: '30' },
          { q: 'log₄(64) × log₂(8) = ?', a: '9' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: 'log₂(128) + log₅(125) - 27^(2/3) = ?', a: '1' },
          { q: 'Сочетания C(7, 3) = ?', a: '35' },
          { q: '6! / (4! · 2!) + 16^(3/4) = ?', a: '23' },
          { q: 'log₂(64) × log₃(81) - 8^(4/3) = ?', a: '8' },
          { q: '5! - 4! + C(5, 2) = ?', a: '106' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    } else {
      // Grade 11
      if (difficulty === 'easy') {
        const opts = [
          { q: 'Бросок кубика: P(выпадет число 6) = 1/?', a: '6' },
          { q: 'lim(x→∞) (3x + 6)/(x + 1) = ?', a: '3' },
          { q: 'Вклад 2000₽ под 10% на 1 год: 2000 × 1.1 = ?', a: '2200' },
          { q: 'В колоде 36 карт. Карт каждой масти = ?', a: '9' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: 'Вклад 1000₽ под 10% годовых на 2 года: 1000 × 1.1² = ?', a: '1210' },
          { q: 'lim(x→∞) (6x² + 5)/(2x² + 1) = ?', a: '3' },
          { q: 'lim(x→3) (x² - 9)/(x - 3) = ?', a: '6' },
          { q: 'В урне 6 белых и 9 синих шаров. P(белый) = ?', a: '0.4' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: 'Вклад 5000₽ под 20% годовых на 2 года: 5000 × 1.2² = ?', a: '7200' },
          { q: 'lim(x→∞) (12x³ - 4x)/(3x³ + 7) + lim(x→0) sin(x)/x = ?', a: '5' },
          { q: 'Бросок 3 монет: сколько всего равновозможных исходов?', a: '8' },
          { q: 'lim(x→4) (x² - 16)/(x - 4) + lim(x→2) (x² - 4)/(x - 2) = ?', a: '12' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    }
  } else if (topic === 'algebra') {
    if (grade === 2) {
      if (difficulty === 'easy') {
        const a = randInt(3, 12);
        const x = randInt(2, 15);
        question = `x + ${a} = ${x + a}, x = ?`;
        answer = x.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(18, 45);
        const x = randInt(14, 42);
        question = `x + ${a} = ${x + a}, x = ?`;
        answer = x.toString();
      } else {
        const a = randInt(15, 35);
        const b = randInt(10, 25);
        const x = randInt(20, 60);
        question = `x + ${a} - ${b} = ${x + a - b}, x = ?`;
        answer = x.toString();
      }
    } else if (grade === 3) {
      if (difficulty === 'easy') {
        const a = randInt(2, 6);
        const x = randInt(2, 8);
        question = `${a} × x = ${a * x}, x = ?`;
        answer = x.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(5, 11);
        const x = randInt(6, 14);
        question = `${a} × x = ${a * x}, x = ?`;
        answer = x.toString();
      } else {
        const a = randInt(4, 9);
        const b = randInt(10, 30);
        const x = randInt(6, 15);
        question = `${a} × x + ${b} = ${a * x + b}, x = ?`;
        answer = x.toString();
      }
    } else if (grade === 4) {
      if (difficulty === 'easy') {
        const a = randInt(2, 7);
        const b = randInt(2, 4);
        const x = randInt(2, 8);
        question = `(x + ${a}) × ${b} = ${(x + a) * b}, x = ?`;
        answer = x.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(6, 18);
        const b = randInt(4, 9);
        const x = randInt(5, 16);
        question = `(x + ${a}) × ${b} = ${(x + a) * b}, x = ?`;
        answer = x.toString();
      } else {
        const a = randInt(5, 15);
        const b = randInt(5, 12);
        const c = randInt(12, 45);
        const x = randInt(8, 22);
        question = `(x - ${a}) × ${b} + ${c} = ${(x - a) * b + c}, x = ?`;
        answer = x.toString();
      }
    } else if (grade === 5) {
      if (difficulty === 'easy') {
        const a = randInt(2, 4);
        const b = randInt(1, 4);
        const x = randInt(2, 8);
        question = `${a}x + ${b}x = ${(a + b) * x}, x = ?`;
        answer = x.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(4, 9);
        const b = randInt(3, 8);
        const c = randInt(5, 18);
        const x = randInt(4, 12);
        question = `${a}x + ${b}x - ${c} = ${(a + b) * x - c}, x = ?`;
        answer = x.toString();
      } else {
        const a = randInt(7, 14);
        const b = randInt(3, 6);
        const c = randInt(4, 9);
        const x = randInt(5, 14);
        question = `${a}x - ${b}x + ${c}x = ${(a - b + c) * x}, x = ?`;
        answer = x.toString();
      }
    } else if (grade === 6) {
      if (difficulty === 'easy') {
        const x = randInt(2, 7);
        const c = 2 * x - 8;
        question = `4x - 8 = 2x + ${c}, x = ?`;
        answer = x.toString();
      } else if (difficulty === 'medium') {
        const x = randInt(4, 12);
        const a = randInt(5, 8);
        const b = randInt(2, 4);
        const lhsConst = randInt(4, 15);
        const rhsConst = (a - b) * x - lhsConst;
        question = `${a}x - ${lhsConst} = ${b}x + ${rhsConst}, x = ?`;
        answer = x.toString();
      } else {
        const x = randInt(3, 11);
        const a = randInt(6, 10);
        const b = randInt(2, 4);
        const k = randInt(3, 9);
        const rhs = a * x - k - b * x;
        question = `${a}x - ${k} = ${b}x + ${rhs}, 2x = ?`;
        answer = (2 * x).toString();
      }
    } else if (grade === 7) {
      if (difficulty === 'easy') {
        const a = pick([2, 3, 4, 5]);
        question = `(x + ${a})² = x² + ?x + ${a * a}`;
        answer = (2 * a).toString();
      } else if (difficulty === 'medium') {
        const a = randInt(3, 8);
        const b = randInt(2, 5);
        question = `(${b}x + ${a})² = ${b * b}x² + ?x + ${a * a}`;
        answer = (2 * a * b).toString();
      } else {
        const a = randInt(6, 12);
        const b = randInt(2, 5);
        question = `(x + ${a})² - (x - ${b})² при x = 1 равно ?`;
        answer = (Math.pow(1 + a, 2) - Math.pow(1 - b, 2)).toString();
      }
    } else if (grade === 8) {
      if (difficulty === 'easy') {
        const x1 = randInt(1, 4);
        const x2 = randInt(2, 5);
        const sum = x1 + x2;
        const prod = x1 * x2;
        question = `x² - ${sum}x + ${prod} = 0, x₁ + x₂ = ?`;
        answer = sum.toString();
      } else if (difficulty === 'medium') {
        const x1 = randInt(3, 8);
        const x2 = randInt(4, 9);
        const sum = x1 + x2;
        const prod = x1 * x2;
        question = `x² - ${sum}x + ${prod} = 0: найдите дискриминант D = ?`;
        answer = (sum * sum - 4 * prod).toString();
      } else {
        const x1 = randInt(4, 9);
        const x2 = -randInt(2, 6);
        const b = -(x1 + x2);
        const c = x1 * x2;
        const signB = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
        const signC = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
        question = `x² ${signB} ${signC} = 0: найдите x₁² + x₂² = ?`;
        answer = (x1 * x1 + x2 * x2).toString();
      }
    } else if (grade === 9) {
      if (difficulty === 'easy') {
        const k = pick([5, 6, 7, 8]);
        question = `x² - ${k * k} = 0, при x > 0: x = ?`;
        answer = k.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(3, 7);
        const b = randInt(2, 6);
        question = `(x - ${a})(x + ${b}) = 0: сумма корней x₁ + x₂ = ?`;
        answer = (a - b).toString();
      } else {
        const x = randInt(3, 8);
        const y = randInt(2, 7);
        question = `Система: x + y = ${x + y}, x - y = ${x - y}. Найдите x · y = ?`;
        answer = (x * y).toString();
      }
    } else if (grade === 10) {
      if (difficulty === 'easy') {
        const opts = [
          { q: 'sin(30°) = ?', a: '0.5' },
          { q: 'cos(60°) = ?', a: '0.5' },
          { q: '2^(x) = 16, x = ?', a: '4' },
          { q: 'sin²(α) + cos²(α) = ?', a: '1' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: '5^(x - 1) = 125, x = ?', a: '4' },
          { q: 'log₂(x + 4) = 4, x = ?', a: '12' },
          { q: '2 · sin(30°) + 4 · cos(60°) = ?', a: '3' },
          { q: '4^(x) = 256, x = ?', a: '4' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: '3^(2x - 1) = 243, x = ?', a: '3' },
          { q: '6 · sin²(45°) + 4 · cos(0°) = ?', a: '7' },
          { q: 'log₃(2x + 5) = 3, x = ?', a: '11' },
          { q: '2^(x²) = 64 (при x > 0): x² + x = ?', a: '9' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    } else {
      // Grade 11 Algebra
      if (difficulty === 'easy') {
        const opts = [
          { q: 'f(x) = x⁴, f\'(x) = ?x³', a: '4' },
          { q: 'f(x) = x², f\'(5) = 2·5 = ?', a: '10' },
          { q: '∫₀¹ 4x³ dx = [x⁴]₀¹ = ?', a: '1' },
          { q: 'f(x) = x² - 4x: минимум при x = ?', a: '2' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: 'f(x) = 2x³ - 5x, f\'(2) = ?', a: '19' },
          { q: '∫₁³ 2x dx = [x²]₁³ = ?', a: '8' },
          { q: 'f(x) = -x² + 12x - 7: точка максимума x = ?', a: '6' },
          { q: '∫₀² 6x² dx = ?', a: '16' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: 'f(x) = x³ - 12x + 5: точка локального минимума (x > 0) x = ?', a: '2' },
          { q: '∫₁⁴ (3x² - 2x) dx = ?', a: '48' },
          { q: 'f(x) = 3x⁴ - 4x³: f\'(2) = ?', a: '48' },
          { q: 'Площадь между y = 3x² и y = 0 на [0, 3]: ∫₀³ 3x² dx = ?', a: '27' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    }
  } else if (topic === 'geometry') {
    if (grade === 2) {
      if (difficulty === 'easy') {
        const a = randInt(3, 8);
        question = `Квадрат со стороной ${a} см. Периметр P = 4 × ${a} = ?`;
        answer = (4 * a).toString();
      } else if (difficulty === 'medium') {
        const a = randInt(6, 14);
        const b = randInt(9, 18);
        question = `Прямоугольник ${a} см и ${b} см. Периметр P = 2·(a + b) = ?`;
        answer = (2 * (a + b)).toString();
      } else {
        const a = randInt(12, 25);
        const b = randInt(15, 32);
        const c = randInt(10, 20);
        question = `Треугольник со сторонами ${a}, ${b} и ${c} см. Периметр P = ?`;
        answer = (a + b + c).toString();
      }
    } else if (grade === 3) {
      if (difficulty === 'easy') {
        const a = randInt(3, 7);
        const b = randInt(2, 6);
        question = `Прямоугольник со сторонами ${a} и ${b}. Площадь S = a × b = ?`;
        answer = (a * b).toString();
      } else if (difficulty === 'medium') {
        const a = randInt(7, 15);
        const b = randInt(6, 12);
        question = `Прямоугольник ${a} × ${b} см. Площадь S = ?`;
        answer = (a * b).toString();
      } else {
        const a = randInt(11, 20);
        const b = randInt(8, 16);
        question = `Прямоугольник ${a} см × ${b} см. Сумма S + P = ?`;
        answer = (a * b + 2 * (a + b)).toString();
      }
    } else if (grade === 4) {
      if (difficulty === 'easy') {
        const a = randInt(2, 4);
        question = `Куб с ребром ${a} см. Объём V = a³ = ?`;
        answer = (a * a * a).toString();
      } else if (difficulty === 'medium') {
        const a = randInt(3, 6);
        const b = randInt(4, 7);
        const c = randInt(4, 8);
        question = `Параллелепипед ${a} × ${b} × ${c}. Объём V = ?`;
        answer = (a * b * c).toString();
      } else {
        const a = randInt(5, 9);
        const b = randInt(6, 10);
        const c = randInt(4, 8);
        question = `Параллелепипед ${a} × ${b} × ${c}. Площадь полной поверхности 2(ab+bc+ac) = ?`;
        answer = (2 * (a * b + b * c + a * c)).toString();
      }
    } else if (grade === 5) {
      if (difficulty === 'easy') {
        const angle = pick([30, 45, 60, 80]);
        question = `Смежный угол к углу ${angle}° равен 180° - ${angle}° = ?°`;
        answer = (180 - angle).toString();
      } else if (difficulty === 'medium') {
        const angle = randInt(23, 147);
        question = `Смежный угол к углу ${angle}° равен ?°`;
        answer = (180 - angle).toString();
      } else {
        const a = randInt(25, 65);
        const b = randInt(20, 55);
        question = `Из развёрнутого угла 180° провели два луча с углами ${a}° и ${b}°. Остаток = ?°`;
        answer = (180 - a - b).toString();
      }
    } else if (grade === 6) {
      if (difficulty === 'easy') {
        const r = randInt(3, 9);
        question = `Окружность с радиусом R = ${r}. Диаметр D = 2R = ?`;
        answer = (2 * r).toString();
      } else if (difficulty === 'medium') {
        const r = randInt(4, 9);
        question = `Круг с радиусом R = ${r}. При π ≈ 3 площадь S ≈ 3 × R² = ?`;
        answer = (3 * r * r).toString();
      } else {
        const d = pick([10, 12, 14, 16, 18]);
        const r = d / 2;
        question = `Круг диаметром D = ${d}. При π ≈ 3 площадь S ≈ 3 × R² = ?`;
        answer = (3 * r * r).toString();
      }
    } else if (grade === 7) {
      if (difficulty === 'easy') {
        const a1 = 50;
        const a2 = 60;
        question = `В треугольнике углы ${a1}° и ${a2}°. Третий угол = ?°`;
        answer = (180 - a1 - a2).toString();
      } else if (difficulty === 'medium') {
        const a1 = randInt(32, 74);
        const a2 = randInt(35, 78);
        question = `В треугольнике углы ${a1}° и ${a2}°. Третий угол = ?°`;
        answer = (180 - a1 - a2).toString();
      } else {
        const vertex = pick([36, 44, 52, 68, 76]);
        question = `Равнобедренный треугольник: угол при вершине ${vertex}°. Угол при основании = ?°`;
        answer = ((180 - vertex) / 2).toString();
      }
    } else if (grade === 8) {
      if (difficulty === 'easy') {
        const pyth = pick([
          { a: 3, b: 4, c: 5 },
          { a: 6, b: 8, c: 10 }
        ]);
        question = `Теорема Пифагора: катеты ${pyth.a} и ${pyth.b}. Гипотенуза c = ?`;
        answer = pyth.c.toString();
      } else if (difficulty === 'medium') {
        const pyth = pick([
          { a: 5, b: 12, c: 13 },
          { a: 8, b: 15, c: 17 },
          { a: 9, b: 12, c: 15 }
        ]);
        question = `Прямоугольный треугольник: гипотенуза ${pyth.c}, катет ${pyth.a}. Второй катет = ?`;
        answer = pyth.b.toString();
      } else {
        const a = pick([6, 10, 12]);
        const b = pick([8, 14, 16]);
        const h = pick([5, 7, 9]);
        question = `Трапеция: основания ${a} и ${b}, высота ${h}. Площадь S = ((a+b)/2)·h = ?`;
        answer = (((a + b) / 2) * h).toString();
      }
    } else if (grade === 9) {
      if (difficulty === 'easy') {
        const arc = pick([60, 80, 100, 120]);
        question = `Вписанный угол опирается на дугу ${arc}°. Его величина = ?°`;
        answer = (arc / 2).toString();
      } else if (difficulty === 'medium') {
        const ax = randInt(2, 6);
        const ay = randInt(3, 7);
        const bx = randInt(4, 8);
        const by = randInt(2, 6);
        question = `Скалярное произведение векторов a(${ax}, ${ay}) и b(${bx}, ${by}) = ?`;
        answer = (ax * bx + ay * by).toString();
      } else {
        const triple = pick([
          { x: 9, y: 12, len: 15 },
          { x: 8, y: 15, len: 17 },
          { x: 12, y: 16, len: 20 }
        ]);
        question = `Длина вектора v(${triple.x}, -${triple.y}): |v| = √(${triple.x}² + (-${triple.y})²) = ?`;
        answer = triple.len.toString();
      }
    } else if (grade === 10) {
      if (difficulty === 'easy') {
        const opts = [
          { q: 'Куб со стороной a = 3. Площадь поверхности 6a² = ?', a: '54' },
          { q: 'Сколько граней у правильного тетраэдра?', a: '4' },
          { q: 'Сколько вершин у куба?', a: '8' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const a = randInt(4, 7);
        question = `Куб со стороной a = ${a}. Площадь полной поверхности 6a² = ?`;
        answer = (6 * a * a).toString();
      } else {
        const opts = [
          { q: 'Параллелепипед 6×8×24: диагональ d = √(36 + 64 + 576) = ?', a: '26' },
          { q: 'Куб с ребром a = 6. Сумма длин всех 12 рёбер = ?', a: '72' },
          { q: 'Правильная четырёхугольная пирамида: сторона основания 6, апофема 5. Бок. S = 4·(½·6·5) = ?', a: '60' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    } else {
      // Grade 11 Geometry
      if (difficulty === 'easy') {
        const opts = [
          { q: 'Цилиндр: R = 2, h = 5. При π ≈ 3 объём V ≈ 3 × R² × h = ?', a: '60' },
          { q: 'Конус: радиус R = 3, высота h = 4. Образующая L = √(9 + 16) = ?', a: '5' },
          { q: 'Шар радиуса R = 2. При π ≈ 3 площадь сферы S ≈ 4 × 3 × R² = ?', a: '48' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: 'Конус: R = 6, h = 8. Образующая L = √(36 + 64) = ?', a: '10' },
          { q: 'Сечение шара R = 5 на расстоянии 3: радиус сечения r = ?', a: '4' },
          { q: 'Цилиндр: R = 4, h = 7. При π ≈ 3 объём V ≈ 3 × 16 × 7 = ?', a: '336' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: 'Шар R = 5 (π ≈ 3): объём шара V ≈ (4/3) × 3 × R³ = 4 × 125 = ?', a: '500' },
          { q: 'Конус: R = 5, L = 13. Найдите высоту конуса h = ?', a: '12' },
          { q: 'Сечение шара R = 13 на расстоянии 5 от центра (π ≈ 3): площадь сечения ≈ 3·r² = ?', a: '432' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    }
  } else {
    // topic === 'analysis'
    if (grade === 2) {
      if (difficulty === 'easy') {
        const seqs = [
          { q: 'Числовой ряд: 2, 4, 6, 8, ?', a: '10' },
          { q: 'Числовой ряд: 5, 10, 15, 20, ?', a: '25' },
          { q: 'Числовой ряд: 10, 20, 30, 40, ?', a: '50' }
        ];
        const chosen = pick(seqs);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const start = randInt(3, 14);
        const step = randInt(4, 9);
        question = `Числовой ряд: ${start}, ${start + step}, ${start + 2 * step}, ${start + 3 * step}, ?`;
        answer = (start + 4 * step).toString();
      } else {
        const start = randInt(5, 18);
        const s1 = start;
        const s2 = s1 + 2;
        const s3 = s2 + 4;
        const s4 = s3 + 6;
        question = `Закономерность (+2, +4, +6, +8): ${s1}, ${s2}, ${s3}, ${s4}, ?`;
        answer = (s4 + 8).toString();
      }
    } else if (grade === 3) {
      if (difficulty === 'easy') {
        const a = randInt(2, 5);
        const x = randInt(3, 7);
        question = `Функция y = ${a}x. При x = ${x} значение y = ?`;
        answer = (a * x).toString();
      } else if (difficulty === 'medium') {
        const a = randInt(4, 9);
        const b = randInt(3, 12);
        const x = randInt(4, 9);
        question = `Функция y = ${a}x + ${b}. При x = ${x}: y = ?`;
        answer = (a * x + b).toString();
      } else {
        const a = randInt(6, 12);
        const b = randInt(5, 18);
        const x = randInt(6, 12);
        question = `Правило y = ${a}x - ${b}. При x = ${x}: y = ?`;
        answer = (a * x - b).toString();
      }
    } else if (grade === 4) {
      if (difficulty === 'easy') {
        const t = pick([2, 3, 4]);
        const v = randInt(8, 18);
        question = `Скорость v = S/t: путь ${v * t} км за ${t} ч. v = ? км/ч`;
        answer = v.toString();
      } else if (difficulty === 'medium') {
        const t1 = randInt(2, 4);
        const v1 = randInt(40, 70);
        const t2 = randInt(2, 4);
        const v2 = randInt(50, 80);
        question = `Путь: ${t1} ч со скоростью ${v1} км/ч и ${t2} ч со скоростью ${v2} км/ч. Всего км = ?`;
        answer = (t1 * v1 + t2 * v2).toString();
      } else {
        const s = pick([180, 240, 300, 360]);
        const t = pick([3, 4, 5, 6]);
        const v = s / t;
        question = `Средняя скорость: ${s / 2} км + ${s / 2} км за ${t} ч всего. v_ср = ? км/ч`;
        answer = v.toString();
      }
    } else if (grade === 5) {
      if (difficulty === 'easy') {
        question = 'Среднее арифметическое чисел 10, 20, 30 = ?';
        answer = '20';
      } else if (difficulty === 'medium') {
        const avg = randInt(15, 35);
        const n1 = avg - 6;
        const n2 = avg;
        const n3 = avg + 6;
        question = `Среднее арифметическое чисел ${n1}, ${n2}, ${n3} = ?`;
        answer = avg.toString();
      } else {
        const avg = randInt(20, 48);
        const n1 = avg - 9;
        const n2 = avg - 3;
        const n3 = avg + 5;
        const n4 = avg + 7;
        question = `Среднее арифметическое четырёх чисел ${n1}, ${n2}, ${n3}, ${n4} = ?`;
        answer = avg.toString();
      }
    } else if (grade === 6) {
      if (difficulty === 'easy') {
        const k = randInt(2, 5);
        const x = randInt(3, 7);
        question = `Прямая пропорциональность y = ${k}x. При x = ${x}: y = ?`;
        answer = (k * x).toString();
      } else if (difficulty === 'medium') {
        const k = pick([24, 36, 48, 60]);
        const x = pick([3, 4, 6]);
        question = `Обратная пропорциональность y = ${k}/x. При x = ${x}: y = ?`;
        answer = (k / x).toString();
      } else {
        const x1 = randInt(3, 6);
        const k = randInt(5, 11);
        const y1 = k * x1;
        const x2 = randInt(7, 13);
        question = `Прямая пропорциональность: при x = ${x1}, y = ${y1}. При x = ${x2}: y = ?`;
        answer = (k * x2).toString();
      }
    } else if (grade === 7) {
      if (difficulty === 'easy') {
        const k = randInt(2, 6);
        const b = randInt(1, 7);
        question = `Линейная функция y = ${k}x + ${b}. Угловой коэффициент k = ?`;
        answer = k.toString();
      } else if (difficulty === 'medium') {
        const k = randInt(3, 8);
        const b = randInt(4, 15);
        const x = randInt(2, 6);
        question = `Линейная функция y = ${k}x - ${b}. Значение при x = ${x}: y = ?`;
        answer = (k * x - b).toString();
      } else {
        const k = randInt(2, 7);
        const x0 = randInt(3, 9);
        const b = k * x0;
        question = `График y = ${k}x - ${b} пересекает ось X в точке с абсциссой x = ?`;
        answer = x0.toString();
      }
    } else if (grade === 8) {
      if (difficulty === 'easy') {
        const root = pick([2, 3, 4, 5]);
        question = `Нули функции f(x) = x² - ${root * root}: положительный ноль x = ?`;
        answer = root.toString();
      } else if (difficulty === 'medium') {
        const r = randInt(4, 9);
        const k = randInt(2, 4);
        question = `Нули функции f(x) = ${k}x² - ${k * r * r}: положительный ноль x = ?`;
        answer = r.toString();
      } else {
        const a = randInt(2, 6);
        const x = randInt(5, 12);
        question = `f(x) = √(x + ${a * a - x}) при некотором сдвиге, либо решите f(${x}) = ${a}x² - 3x = ?`;
        answer = (a * x * x - 3 * x).toString();
      }
    } else if (grade === 9) {
      if (difficulty === 'easy') {
        const x0 = pick([2, 3, 4]);
        question = `Вершина параболы y = (x - ${x0})² + 5: координата x₀ = ?`;
        answer = x0.toString();
      } else if (difficulty === 'medium') {
        const a = randInt(1, 3);
        const x0 = randInt(3, 8);
        const b = -2 * a * x0;
        const c = randInt(4, 15);
        question = `Парабола y = ${a === 1 ? '' : a}x² - ${Math.abs(b)}x + ${c}: абсцисса вершины x₀ = -b/(2a) = ?`;
        answer = x0.toString();
      } else {
        const x0 = randInt(3, 7);
        const y0 = randInt(5, 18);
        const b = -2 * x0;
        const c = x0 * x0 + y0;
        question = `Парабола y = x² - ${Math.abs(b)}x + ${c}: наименьшее значение функции y_min = ?`;
        answer = y0.toString();
      }
    } else if (grade === 10) {
      if (difficulty === 'easy') {
        const opts = [
          { q: 'Предел lim(x→3) (x² - 9)/(x - 3) = ?', a: '6' },
          { q: 'Предел lim(x→2) (x² - 4)/(x - 2) = ?', a: '4' },
          { q: 'Предел lim(x→0) (8x)/x = ?', a: '8' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const k = randInt(5, 11);
        question = `Предел lim(x→${k}) (x² - ${k * k})/(x - ${k}) = ?`;
        answer = (2 * k).toString();
      } else {
        const a = randInt(3, 8);
        const b = randInt(2, 6);
        question = `lim(x→∞) (${a * 2}x² + ${b}x + 1)/(2x² - 5) + lim(x→3) (x² - 9)/(x - 3) = ?`;
        answer = (a + 6).toString();
      }
    } else {
      // Grade 11 Analysis
      if (difficulty === 'easy') {
        const opts = [
          { q: 'f(x) = 3x²: значение производной f\'(5) = 6·5 = ?', a: '30' },
          { q: 'Интеграл ∫₁² 3x² dx = [x³]₁² = 8 - 1 = ?', a: '7' },
          { q: 'Вторая производная f\'\'(x): f(x) = x³, f\'\'(2) = 6·2 = ?', a: '12' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else if (difficulty === 'medium') {
        const opts = [
          { q: 'Площадь под параболой y = 3x² от x = 1 до x = 4: ∫₁⁴ 3x² dx = ?', a: '63' },
          { q: 'Критическая точка f(x) = x³ - 27x (x > 0): x = ?', a: '3' },
          { q: 'f(x) = x⁴ - 4x²: значение второй производной f\'\'(3) = ?', a: '100' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      } else {
        const opts = [
          { q: 'f(x) = 2x³ - 18x + 7: точка локального максимума (при x < 0), найдите |x| = ?', a: '3' },
          { q: 'Определённый интеграл ∫₀⁴ (3x² + 2x) dx = ?', a: '80' },
          { q: 'Касательная к y = x³ + 2x² в точке x₀ = 3: угловой коэффициент k = ?', a: '39' }
        ];
        const chosen = pick(opts);
        question = chosen.q;
        answer = chosen.a;
      }
    }
  }

  if (distractors.length === 0) {
    distractors = buildNumericDistractors(answer, difficulty);
  }

  const wordBank = [answer, ...distractors].sort(() => Math.random() - 0.5);

  return {
    id: crypto.randomUUID(),
    type: 'translation',
    difficultyLevel: difficulty,
    originalSentence: question,
    targetTranslation: answer,
    wordBank,
    isFallback: false
  };
};

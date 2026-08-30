
// Простой синтезатор звуков на Web Audio API, чтобы не зависеть от внешних mp3 файлов
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export type SoundEffectType = 
    | 'correct' 
    | 'wrong' 
    | 'error'
    | 'click' 
    | 'success' 
    | 'select' 
    | 'button_press' 
    | 'screen_transition' 
    | 'transition'
    | 'streak_update' 
    | 'freeze_use' 
    | 'purchase';

export const triggerHapticFeedback = (type: SoundEffectType | 'correct' | 'wrong' | 'light' | 'medium' | 'heavy' | string) => {
    try {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
            if (type === 'correct') {
                // Двойной мягкий тактильный импульс успеха
                navigator.vibrate([40, 50, 40]);
            } else if (type === 'wrong' || type === 'error') {
                // Выразительный двойной вибро-отклик ошибки
                navigator.vibrate([80, 50, 120]);
            } else if (type === 'success' || type === 'streak_update') {
                // Праздничный каскад вибраций
                navigator.vibrate([50, 40, 50, 40, 90]);
            } else if (type === 'purchase' || type === 'freeze_use') {
                navigator.vibrate([30, 40, 60]);
            } else if (type === 'click' || type === 'select' || type === 'button_press' || type === 'light') {
                // Короткий деликатный щелчок
                navigator.vibrate(15);
            } else if (type === 'medium') {
                navigator.vibrate(40);
            } else if (type === 'heavy') {
                navigator.vibrate(80);
            }
        }
    } catch {
        // Safe fallback if vibrate is blocked or unsupported in browser iframe
    }
};

export const playSound = (type: SoundEffectType | string) => {
    try {
        // Trigger haptic vibration on mobile devices
        triggerHapticFeedback(type);

        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'correct') {
            // Звонкий мажорный перелив (Дзынь!)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, t); // C5
            osc.frequency.linearRampToValueAtTime(659.25, t + 0.1); // E5
            
            // Вторая гармоника для яркости
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1046.50, t); // C6
            gain2.gain.setValueAtTime(0.05, t);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc2.start(t);
            osc2.stop(t + 0.3);

            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            
            osc.start(t);
            osc.stop(t + 0.4);
        } 
        else if (type === 'wrong' || type === 'error') {
            // Глухой, низкий звук (Ту-дум...)
            osc.type = 'sawtooth';
            // Low pass filter для мягкости
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            
            osc.disconnect();
            osc.connect(filter);
            filter.connect(gain);
            
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.3);
            
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            
            osc.start(t);
            osc.stop(t + 0.4);
        }
        else if (type === 'click' || type === 'select' || type === 'button_press') {
            // Легкий щелчок кнопки
            osc.type = 'sine';
            osc.frequency.setValueAtTime(type === 'button_press' ? 950 : 800, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            osc.start(t);
            osc.stop(t + 0.05);
        }
        else if (type === 'screen_transition' || type === 'transition') {
            // Мягкий плавучий перебор при смене экранов
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            osc.start(t);
            osc.stop(t + 0.12);
        }
        else if (type === 'streak_update') {
            // Праздничный трезвон при обновлении стрейка
            playNote(ctx, 440.00, t, 0.08);       // A4
            playNote(ctx, 554.37, t + 0.08, 0.08); // C#5
            playNote(ctx, 659.25, t + 0.16, 0.08); // E5
            playNote(ctx, 880.00, t + 0.24, 0.3);  // A5
        }
        else if (type === 'freeze_use') {
            // Ледяной хрустальный перелив при использовании заморозки стрейка
            playNote(ctx, 1174.66, t, 0.12, 'sine'); // D6
            playNote(ctx, 880.00, t + 0.08, 0.12, 'sine'); // A5
            playNote(ctx, 1479.98, t + 0.16, 0.25, 'sine'); // F#6
        }
        else if (type === 'purchase') {
            // Звук покупки монет / кристалла (Дзинь-дзинь)
            playNote(ctx, 987.77, t, 0.08, 'triangle');       // B5
            playNote(ctx, 1318.51, t + 0.08, 0.25, 'triangle'); // E6
        }
        else if (type === 'success') {
            // Фанфары (Завершение урока)
            playNote(ctx, 523.25, t, 0.1); // C5
            playNote(ctx, 659.25, t + 0.1, 0.1); // E5
            playNote(ctx, 783.99, t + 0.2, 0.2); // G5
            playNote(ctx, 1046.50, t + 0.3, 0.4); // C6
        }
    } catch (e) {
        console.error("Audio error", e);
    }
};

const playNote = (ctx: AudioContext, freq: number, time: number, duration: number, oscType: OscillatorType = 'triangle') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
};


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

export const playSound = (type: 'correct' | 'wrong' | 'click' | 'success' | 'select') => {
    try {
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
        else if (type === 'wrong') {
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
        else if (type === 'click' || type === 'select') {
            // Легкий щелчок (Поп)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            
            osc.start(t);
            osc.stop(t + 0.1);
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

const playNote = (ctx: AudioContext, freq: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
};

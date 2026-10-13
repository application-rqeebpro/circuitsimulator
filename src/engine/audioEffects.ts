// Web Audio API Synthesizer for Circuit Wizard Sound Effects
// Realistic switch clicks, buzzer beeps, relay clicks, and circuit alerts

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// 1. Switch click sound
export function playSwitchClickSound(isOpen: boolean) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 800 : 1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 300 : 600, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    // Audio errors should fail silently
  }
}

// 2. Continuous Buzzer sound node manager
let buzzerOsc: OscillatorNode | null = null;
let buzzerGain: GainNode | null = null;

export function updateBuzzerSound(isPlaying: boolean, frequencyHz: number = 850) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isPlaying) {
      if (!buzzerOsc) {
        buzzerOsc = ctx.createOscillator();
        buzzerGain = ctx.createGain();

        buzzerOsc.type = 'square';
        buzzerOsc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

        buzzerGain.gain.setValueAtTime(0.08, ctx.currentTime);

        buzzerOsc.connect(buzzerGain);
        buzzerGain.connect(ctx.destination);
        buzzerOsc.start();
      }
    } else {
      if (buzzerOsc) {
        try {
          buzzerOsc.stop();
          buzzerOsc.disconnect();
        } catch (_) {}
        buzzerOsc = null;
        buzzerGain = null;
      }
    }
  } catch (err) {
    // Silently handle audio issues
  }
}

// 3. Short alert beep (for short circuit or test passed)
export function playAlertBeep(success: boolean = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 880 : 220, ctx.currentTime);
    if (success) {
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.2 : 0.25));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.22 : 0.27));
  } catch (err) {}
}

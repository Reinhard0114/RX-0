/**
 * RX-0 TAIPEI DEBUGGER // AUDIO SUBSYSTEM
 * Web Audio API Synthesizer for Gundam UC NT-D & Psycho-Frame Chimes
 */

export class MechaAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Gundam Lock-on Beep (High pitch double chirp)
  playLockOn() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    [0, 0.08].forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1480, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1920, now + delay + 0.05);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    });
  }

  // NT-D Psycho-Frame Engage Sequence (Rising hum + power swell)
  playNtdEngage() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass hum
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(220, now + 1.2);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.5);

    // Psycho-frame resonance harmonic
    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'sawtooth';
    harmOsc.frequency.setValueAtTime(440, now + 0.2);
    harmOsc.frequency.exponentialRampToValueAtTime(880, now + 1.0);
    harmGain.gain.setValueAtTime(0.01, now);
    harmGain.gain.linearRampToValueAtTime(0.15, now + 0.4);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    harmOsc.connect(harmGain);
    harmGain.connect(this.ctx.destination);
    harmOsc.start(now);
    harmOsc.stop(now + 1.4);

    // Warning alarm chirps
    [0.3, 0.6, 0.9].forEach((t) => {
      const beep = this.ctx.createOscillator();
      const beepGain = this.ctx.createGain();
      beep.type = 'square';
      beep.frequency.setValueAtTime(1040, now + t);
      beepGain.gain.setValueAtTime(0.12, now + t);
      beepGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
      beep.connect(beepGain);
      beepGain.connect(this.ctx.destination);
      beep.start(now + t);
      beep.stop(now + t + 0.12);
    });
  }

  // Mecha mechanical click
  playClick() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Success / Dispatch Beep
  playDispatchSuccess() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.1, 0.22].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freqs = [659, 880, 1318]; // E5, A5, E6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[idx], now + delay);
      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  // Gundam Newtype Flash / Psycho-Frame Shimmer Chime
  playLaplaceChime() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0, 3136.0]; // C6, E6, G6, C7, E7, G7
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.14, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.55);
    });
  }
}

export const audio = new MechaAudioEngine();

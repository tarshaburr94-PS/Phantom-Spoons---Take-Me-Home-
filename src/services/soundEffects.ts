// Gentle, sensory-friendly audio synthesis using Web Audio API

class SoundService {
  private audioCtx: AudioContext | null = null;
  public soundEnabled = true;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Soft, satisfying chime when an NFC tag is recognized
  playScanChime() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      // Gentle marimba/celesta dual harmonic tone
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(1174.66, now); // D6
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Audio not permitted or supported
    }
  }

  // Positive gentle "Home Check-in" arpeggio (soothing, positive reinforcement)
  playHomeChime() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (major chord)
      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime + idx * 0.07;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // Alias for check-in chime
  playCheckInChime() {
    this.playHomeChime();
  }

  // Soft refreshing water drop & bubble chime
  playWaterChime() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      // Two ascending soft droplet tones (bubble effect: upward frequency sweep)
      const drops = [
        { startFreq: 600, endFreq: 950, timeOffset: 0, dur: 0.15 },
        { startFreq: 820, endFreq: 1350, timeOffset: 0.1, dur: 0.22 },
        { startFreq: 1100, endFreq: 1600, timeOffset: 0.22, dur: 0.25 },
      ];

      drops.forEach((d) => {
        if (!this.audioCtx) return;
        const t = now + d.timeOffset;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(d.startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(d.endFreq, t + d.dur);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + d.dur);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t);
        osc.stop(t + d.dur + 0.05);
      });
    } catch {
      // Audio not permitted
    }
  }

  // Multi-tone chime for completing routine or installing
  playRoutineFinishChime() {
    this.playHomeChime();
  }

  // Soft low gentle tone when marking something misplaced (never harsh or buzzing)
  playMisplacedTone() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(370, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // ignore
    }
  }

  // Tactile haptic vibration if supported on mobile device
  triggerHaptic(pattern: number | number[] = 40) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }
}

export const sounds = new SoundService();

class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.voiceGain = null;
    this.filter = null;
    this.oscillators = [];
    this.enabled = false;
    this.muted = false;
    this.scale = [0, 2, 4, 7, 9, 12];
  }

  ensure() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
      this.setupInstrument();
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }
    this.enabled = true;
  }

  toggle() {
    const wasEnabled = this.enabled;
    this.ensure();
    this.muted = wasEnabled ? !this.muted : false;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.18, this.context.currentTime, 0.05);
    }
    return !this.muted;
  }

  setupInstrument() {
    this.voiceGain = this.context.createGain();
    this.voiceGain.gain.value = 1;
    this.voiceGain.connect(this.master);
  }

  pluck(position, options = {}) {
    this.ensure();
    if (!this.enabled || this.muted || !this.context) return;

    const now = this.context.currentTime;
    const x = position ? constrain(position.x / width, 0, 1) : 0.5;
    const y = position ? constrain(position.y / height, 0, 1) : 0.5;
    const speed = constrain((options.speed ?? 0) / 42, 0, 1);
    const tension = constrain(options.tension ?? 0, 0, 1);
    const fingerAmount = constrain((options.fingerCount ?? 1) / 10, 0, 1);
    const note = this.scale[floor(x * (this.scale.length - 0.001))];
    const octave = y < 0.34 ? 1 : y > 0.8 ? -1 : 0;
    const baseFrequency = 146.83 * Math.pow(2, (note + octave * 12) / 12);
    const duration = 1.02 + tension * 0.44 + (1 - speed) * 0.26 + random(-0.08, 0.12);
    const brightness = 780 + (1 - y) * 2600 + speed * 900 + fingerAmount * 280;
    const volume = (options.volume ?? (0.028 + tension * 0.04 + speed * 0.022)) * 0.58;

    const voices = [
      { type: "triangle", ratio: 1, gain: 0.68 },
      { type: "sine", ratio: 2, gain: 0.28 + fingerAmount * 0.08 },
      { type: "sine", ratio: 3, gain: 0.13 },
      { type: "triangle", ratio: 5, gain: 0.035 },
      { type: "sine", ratio: 0.5, gain: tension * 0.012 },
    ];

    const filter = this.context.createBiquadFilter();
    const output = this.context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(brightness, now);
    filter.frequency.exponentialRampToValueAtTime(max(360, brightness * 0.34), now + duration);
    filter.Q.value = 1.4 + tension * 3.4;

    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    output.gain.exponentialRampToValueAtTime(volume * 0.5, now + 0.26);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    filter.connect(output);
    output.connect(this.voiceGain);

    for (const voice of voices) {
      if (voice.gain <= 0.001) continue;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(baseFrequency * voice.ratio + random(-0.85, 0.85), now);
      gain.gain.value = voice.gain;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
    }
  }

  spray(intensity = 1, position = null, speed = 0) {
    this.ensure();
    if (!this.enabled || this.muted) return;

    const now = this.context.currentTime;
    const x = position ? constrain(position.x / width, 0, 1) : 0.5;
    const speedTone = constrain(speed / 42, 0, 1);
    const duration = lerp(0.18, 0.08, speedTone);
    const noise = this.createNoise(duration);
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    filter.type = "bandpass";
    filter.frequency.value = lerp(600, 3200, x);
    filter.Q.value = 1.4 + speedTone * 2.5;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.003 * intensity, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + duration);

    this.pluck(position, {
      speed,
      tension: 0.18 + speedTone * 0.22,
      fingerCount: 5,
      volume: 0.075 * intensity,
    });

    if (intensity > 0.62) {
      setTimeout(() => {
        this.pluck(
          {
            x: (position?.x ?? width * 0.5) + random(-34, 34),
            y: position?.y ?? height * 0.5,
          },
          {
            speed: speed * 0.55,
            tension: 0.1,
            fingerCount: 3,
            volume: 0.04 * intensity,
          },
        );
      }, 45);
    }
  }

  snap(intensity = 1, position = null) {
    this.ensure();
    if (!this.enabled || this.muted) return;

    const now = this.context.currentTime;
    const x = position ? constrain(position.x / width, 0, 1) : 0.5;
    const duration = 0.045;
    const noise = this.createNoise(duration);
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    filter.type = "highpass";
    filter.frequency.value = lerp(1200, 5200, x);
    gain.gain.setValueAtTime(0.025 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + duration);
  }

  createNoise(duration) {
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = random(-1, 1);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

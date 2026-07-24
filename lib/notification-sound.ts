/** Soft notification chime via Web Audio API (no audio file needed). */
export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, gainValue: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.18, 0.12);
    playTone(1174.7, now + 0.16, 0.22, 0.1);

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  } catch (error) {
    console.warn("Unable to play notification sound:", error);
  }
}

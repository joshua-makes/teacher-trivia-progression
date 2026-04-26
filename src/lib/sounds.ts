/**
 * Web Audio API sound effects — no external files or dependencies.
 * AudioContext is created lazily on first use (browsers require a user gesture
 * before audio can play, so this is safe to call inside event handlers).
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) ctx = new AudioContext()
    // Resume if suspended (e.g. after tab becomes inactive)
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  c: AudioContext,
  freq: number,
  startDelay: number,
  duration: number,
  type: OscillatorType = 'sine',
  peak = 0.25,
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const start = c.currentTime + startDelay

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Pleasant ascending ding — played when a correct answer is submitted */
export function playCorrect(): void {
  const c = getCtx()
  if (!c) return
  tone(c, 523.25, 0,    0.14)  // C5
  tone(c, 659.25, 0.1,  0.14)  // E5
  tone(c, 783.99, 0.2,  0.22)  // G5
}

/** Low buzzer — played when a wrong answer is submitted */
export function playWrong(): void {
  const c = getCtx()
  if (!c) return
  tone(c, 220, 0,    0.14, 'sawtooth', 0.2)
  tone(c, 165, 0.12, 0.28, 'sawtooth', 0.2)
}

/** Short celebratory fanfare — played on game completion */
export function playComplete(): void {
  const c = getCtx()
  if (!c) return
  tone(c, 523.25, 0,    0.12)  // C5
  tone(c, 659.25, 0.1,  0.12)  // E5
  tone(c, 783.99, 0.2,  0.12)  // G5
  tone(c, 1046.5, 0.32, 0.35)  // C6
}

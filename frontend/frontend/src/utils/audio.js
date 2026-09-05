// Web Audio API Sound Synthesizer for Jhalak.ai
// Indian raga chords, tabla-inspired scan transient, and triumphant resolution chime

let audioCtx = null
let isMuted = false
let hasPlayedWelcome = false

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function isAudioMuted() {
  return isMuted
}

export function toggleAudioMute() {
  isMuted = !isMuted
  return isMuted
}

// --------------------------------------------------------------------------
// 1. WELCOME INDIAN TUNE (Harmonic Pentatonic Raga Bhupali chime with Sitar drone)
// --------------------------------------------------------------------------
export function playWelcomeTune() {
  if (isMuted || hasPlayedWelcome) return
  hasPlayedWelcome = true

  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Pentatonic Indian Swaras (Sa, Re, Ga, Pa, Dha, High Sa): C4, D4, E4, G4, A4, C5
  const notes = [
    { freq: 261.63, time: 0.05, dur: 1.8 }, // Sa (C4)
    { freq: 293.66, time: 0.35, dur: 1.6 }, // Re (D4)
    { freq: 329.63, time: 0.65, dur: 1.7 }, // Ga (E4)
    { freq: 392.00, time: 0.95, dur: 1.9 }, // Pa (G4)
    { freq: 440.00, time: 1.25, dur: 2.0 }, // Dha (A4)
    { freq: 523.25, time: 1.60, dur: 3.2 }, // High Sa (C5)
  ]

  // Master gain
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.24, now)
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 5.2)
  masterGain.connect(ctx.destination)

  // Subtle Tanpura drone in background (Sa + Pa root harmony)
  const droneFreqs = [130.81, 196.00] // C3 + G3
  droneFreqs.forEach((dFreq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(dFreq, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 1.0)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8)

    osc.connect(gain)
    gain.connect(masterGain)

    osc.start(now)
    osc.stop(now + 5.0)
  })

  // Sitar-like acoustic pluck emulation (triangle + subtle sharp attack & quick body decay)
  notes.forEach(({ freq, time, dur }) => {
    const noteStart = now + time

    // Fundamental note
    const osc = ctx.createOscillator()
    const noteGain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, noteStart)
    // Sitar-like subtle pitch bend (meend)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.015, noteStart + 0.08)
    osc.frequency.exponentialRampToValueAtTime(freq, noteStart + 0.25)

    // Pluck amplitude envelope
    noteGain.gain.setValueAtTime(0.0001, noteStart)
    noteGain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02)
    noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur)

    // Sympathetic resonance harmonic overtone (Jawari string resonance)
    const harmonicOsc = ctx.createOscillator()
    const harmonicGain = ctx.createGain()
    harmonicOsc.type = 'sine'
    harmonicOsc.frequency.setValueAtTime(freq * 2, noteStart)

    harmonicGain.gain.setValueAtTime(0.0001, noteStart)
    harmonicGain.gain.linearRampToValueAtTime(0.08, noteStart + 0.015)
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur * 0.7)

    osc.connect(noteGain)
    harmonicOsc.connect(harmonicGain)

    noteGain.connect(masterGain)
    harmonicGain.connect(masterGain)

    osc.start(noteStart)
    osc.stop(noteStart + dur + 0.1)

    harmonicOsc.start(noteStart)
    harmonicOsc.stop(noteStart + dur + 0.1)
  })
}

// --------------------------------------------------------------------------
// 2. SEARCH SOUND (Dynamic Indian Tabla stroke + Digital Scanner Ping)
// --------------------------------------------------------------------------
export function playSearchSound() {
  if (isMuted) return

  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Tabla Dha/Bayan bass pitch-drop thump
  const bassOsc = ctx.createOscillator()
  const bassGain = ctx.createGain()
  bassOsc.type = 'sine'
  bassOsc.frequency.setValueAtTime(160, now)
  bassOsc.frequency.exponentialRampToValueAtTime(55, now + 0.38)

  bassGain.gain.setValueAtTime(0.35, now)
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42)

  bassOsc.connect(bassGain)
  bassGain.connect(ctx.destination)
  bassOsc.start(now)
  bassOsc.stop(now + 0.45)

  // High-tech biometric scanner ping (metallic resonant pulse)
  const pingOsc = ctx.createOscillator()
  const pingGain = ctx.createGain()
  pingOsc.type = 'triangle'
  pingOsc.frequency.setValueAtTime(587.33, now + 0.04) // D5
  pingOsc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18) // D6 upward sweep

  pingGain.gain.setValueAtTime(0.0001, now)
  pingGain.gain.linearRampToValueAtTime(0.2, now + 0.05)
  pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

  pingOsc.connect(pingGain)
  pingGain.connect(ctx.destination)
  pingOsc.start(now + 0.04)
  pingOsc.stop(now + 0.65)
}

// --------------------------------------------------------------------------
// 3. RESULT SOUND (Triumphant Indian Harmony Flourish)
// --------------------------------------------------------------------------
export function playResultSound() {
  if (isMuted) return

  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Rich, uplifting chord progression (Ga - Pa - Sa triumphant chord)
  const chordNotes = [
    { freq: 329.63, delay: 0.0 },  // E4 (Ga)
    { freq: 392.00, delay: 0.12 }, // G4 (Pa)
    { freq: 523.25, delay: 0.24 }, // C5 (Sa)
    { freq: 659.25, delay: 0.38 }, // E5 (High Ga)
  ]

  chordNotes.forEach(({ freq, delay }) => {
    const startTime = now + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)
    // Subtle vibrato shimmer
    osc.frequency.exponentialRampToValueAtTime(freq * 1.008, startTime + 0.3)
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.6)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + 1.9)
  })
}

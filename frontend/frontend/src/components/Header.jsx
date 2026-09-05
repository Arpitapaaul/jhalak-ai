import { useState } from 'react'
import { isAudioMuted, toggleAudioMute, playWelcomeTune } from '../utils/audio'

export default function Header() {
  const [muted, setMuted] = useState(isAudioMuted())

  const handleToggleAudio = () => {
    const nextMute = toggleAudioMute()
    setMuted(nextMute)
    if (!nextMute) {
      playWelcomeTune()
    }
  }

  return (
    <header className="topbar">
      <div className="brand">
        {/* Official Jhalak.ai Logo */}
        <div className="brand-logo-wrap">
          <img
            src="/jhalak-logo.png"
            alt="Jhalak.ai Logo — Find Faces. Unlock Profiles."
            className="brand-logo-img"
          />
        </div>

        <div className="brand-badge-row">
          <span className="brand-badge-pill">AI FACE ENGINE v2.4</span>
          <span className="brand-badge-tag">GOA HACKATHON 2026</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Audio Toggle Button */}
        <button
          type="button"
          className={`audio-toggle-btn ${muted ? 'muted' : 'active'}`}
          onClick={handleToggleAudio}
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle Sound"
        >
          <span className="audio-icon">{muted ? '🔇' : '🔊'}</span>
          <span className="audio-text">{muted ? 'Sound: OFF' : 'Sound: ON'}</span>
        </button>

        <div className="secure-chip">
          <span className="secure-dot" />
          <span>Deep Search Active</span>
        </div>
      </div>
    </header>
  )
}

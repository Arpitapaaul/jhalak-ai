export default function Header() {
  return (
    <header className="topbar">
      <div className="brand">

        {/* Magnifying glass logo mark */}
        <div className="brand-mark">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8.5" stroke="#fff8e7" strokeWidth="3.2" fill="none"/>
            <circle cx="12" cy="12" r="4.5" fill="rgba(255,248,231,0.18)"/>
            <line x1="18.5" y1="18.5" x2="26.5" y2="26.5" stroke="#fff8e7" strokeWidth="3.4" strokeLinecap="round"/>
            <circle cx="9.5" cy="9.5" r="2" fill="rgba(255,255,255,0.35)"/>
          </svg>
        </div>

        <div className="brand-text-wrap">
          <p className="brand-name">
            <span className="brand-jhalak">Jhalak</span><span className="brand-dot">.ai</span>
            {/* Sparkles around the name */}
            <span className="sparkle sp1">✦</span>
            <span className="sparkle sp2">✦</span>
            <span className="sparkle sp3">✦</span>
          </p>
          <p className="brand-subtitle">Face Intelligence &amp; Digital Identity Verification</p>
        </div>

      </div>
      <div className="secure-chip">
        <span className="secure-dot" />
        Goa Hackathon 2026
      </div>
    </header>
  )
}

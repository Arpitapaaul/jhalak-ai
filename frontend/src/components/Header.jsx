export default function Header() {
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
        <div className="secure-chip">
          <span className="secure-dot" />
          <span>Deep Search Active</span>
        </div>
      </div>
    </header>
  )
}

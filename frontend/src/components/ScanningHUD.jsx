import { useEffect, useState } from 'react'

const SCAN_STAGES = [
  { label: 'Detecting facial landmarks & geometry', sub: 'Analyzing 68 facial fiducial coordinates...', percent: 22 },
  { label: 'Generating 512-D neural biometric vector', sub: 'Extracting deep identity embeddings...', percent: 48 },
  { label: 'Scanning social media databases', sub: 'Querying Instagram, X, TikTok, Facebook...', percent: 76 },
  { label: 'Cross-referencing face clusters & confidence', sub: 'Filtering visual similarity matches...', percent: 94 },
]

const SOCIAL_PLATFORMS = [
  { id: 'ig', name: 'Instagram', color: '#E1306C', icon: '📸' },
  { id: 'x', name: 'X / Twitter', color: '#111827', icon: '𝕏' },
  { id: 'tt', name: 'TikTok', color: '#00F2FE', icon: '🎵' },
  { id: 'fb', name: 'Facebook', color: '#1877F2', icon: '👤' },
  { id: 'yt', name: 'YouTube', color: '#FF0000', icon: '▶' },
]

export default function ScanningHUD({ active = true, previewImage }) {
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(12)
  const [activePlatformIndex, setActivePlatformIndex] = useState(0)

  useEffect(() => {
    if (!active) return

    // Stage & Progress ticker
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return prev
        const target = SCAN_STAGES[stageIndex]?.percent || 95
        const step = (target - prev) * 0.15 + 1.2
        const next = Math.min(prev + step, 97)

        if (next > 75) setStageIndex(3)
        else if (next > 45) setStageIndex(2)
        else if (next > 20) setStageIndex(1)

        return Math.round(next * 10) / 10
      })
    }, 180)

    // Social platform cycling ticker
    const socialInterval = setInterval(() => {
      setActivePlatformIndex((prev) => (prev + 1) % SOCIAL_PLATFORMS.length)
    }, 700)

    return () => {
      clearInterval(progressInterval)
      clearInterval(socialInterval)
    }
  }, [active, stageIndex])

  const currentStage = SCAN_STAGES[stageIndex] || SCAN_STAGES[0]

  return (
    <div className="scanning-hud-container" aria-live="polite">
      {/* Top Telemetry Header */}
      <div className="scanning-hud-header">
        <div className="hud-status-badge">
          <span className="hud-radar-beacon" />
          <span className="hud-status-text">AI SCANNER ACTIVE</span>
        </div>
        <div className="hud-telemetry-mono">
          <span>RESNET-512</span>
          <span className="hud-sep">·</span>
          <span>512-D</span>
          <span className="hud-sep">·</span>
          <span className="hud-percent-text">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Center Biometric Target Viewport */}
      <div className="scanning-viewport">
        {previewImage && (
          <img
            src={previewImage}
            alt="Scanning target"
            className="scanning-target-image"
          />
        )}

        {/* Biometric Cybernetic Overlay */}
        <div className="scanning-overlay">
          {/* Sweeping Laser Line */}
          <div className="scanning-laser-beam" />

          {/* Sci-Fi Target Bounding Box */}
          <div className="target-reticle-box">
            <span className="corner-bracket top-left" />
            <span className="corner-bracket top-right" />
            <span className="corner-bracket bottom-left" />
            <span className="corner-bracket bottom-right" />

            {/* Pulsing Concentric Radar Rings */}
            <div className="radar-circle-outer">
              <div className="radar-circle-inner" />
              <div className="radar-crosshair-h" />
              <div className="radar-crosshair-v" />
            </div>

            {/* SVG Biometric Landmarks Mesh */}
            <svg
              className="biometric-mesh-svg"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Landmark Contours */}
              <polygon
                points="100,45 70,80 80,120 100,165 120,120 130,80"
                className="mesh-contour-line"
              />
              <line x1="70" y1="80" x2="130" y2="80" className="mesh-line" />
              <line x1="80" y1="120" x2="120" y2="120" className="mesh-line" />
              <line x1="100" y1="45" x2="100" y2="165" className="mesh-center-axis" />

              {/* Eyes */}
              <circle cx="80" cy="82" r="4.5" className="mesh-node primary" />
              <circle cx="120" cy="82" r="4.5" className="mesh-node primary" />
              {/* Nose */}
              <circle cx="100" cy="108" r="3.5" className="mesh-node secondary" />
              {/* Mouth */}
              <circle cx="88" cy="132" r="3" className="mesh-node accent" />
              <circle cx="112" cy="132" r="3" className="mesh-node accent" />
              <line x1="88" y1="132" x2="112" y2="132" className="mesh-lip-line" />
              {/* Forehead & Chin */}
              <circle cx="100" cy="52" r="3" className="mesh-node tertiary" />
              <circle cx="100" cy="158" r="3" className="mesh-node tertiary" />
            </svg>

            {/* HUD Floating Badges */}
            <div className="hud-floating-tag tag-top">FACE DETECTED · 99.8%</div>
            <div className="hud-floating-tag tag-bottom">EMBEDDING 512-D</div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Status Text */}
      <div className="scanning-hud-footer">
        <div className="scanning-progress-bar-track">
          <div
            className="scanning-progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="scanning-stage-info">
          <div className="scanning-stage-main">
            <span className="stage-step-pill">0{stageIndex + 1}/04</span>
            <span className="stage-title">{currentStage.label}</span>
          </div>
          <span className="stage-subtitle">{currentStage.sub}</span>
        </div>

        {/* Live Social Search Query Badges */}
        <div className="scanning-social-radar">
          <span className="social-radar-label">QUERYING NETWORKS:</span>
          <div className="social-chips-row">
            {SOCIAL_PLATFORMS.map((platform, index) => {
              const isSearching = activePlatformIndex === index
              return (
                <div
                  key={platform.id}
                  className={`social-search-chip ${isSearching ? 'active-searching' : ''}`}
                  style={{ '--brand-color': platform.color }}
                >
                  <span className="chip-icon">{platform.icon}</span>
                  <span className="chip-name">{platform.name}</span>
                  {isSearching && <span className="chip-ping" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

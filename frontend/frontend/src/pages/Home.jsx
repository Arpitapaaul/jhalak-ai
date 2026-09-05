import { useState, useEffect } from 'react'

import Header from '../components/Header'
import ImageUpload from '../components/ImageUpload'
import VerificationResult from '../components/VerificationResult'
import CandidateList from '../components/CandidateList'
import FingerprintCard from '../components/FingerprintCard'
import BlockchainCard from '../components/BlockchainCard'
import ReactiveCursor from '../components/ReactiveCursor'
import { playWelcomeTune, playSearchSound, playResultSound } from '../utils/audio'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [verificationData, setVerificationData] = useState(null)

  // ---------------------------------------
  // PLAY INDIAN WELCOME TUNE ON USER INTERACTION
  // ---------------------------------------
  useEffect(() => {
    const handleFirstInteraction = () => {
      playWelcomeTune()
    }

    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })
    window.addEventListener('touchstart', handleFirstInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  // ---------------------------------------
  // VERIFY UPLOADED IMAGE
  // ---------------------------------------
  const verify = async (file) => {
    if (!file) {
      alert('Please upload an image first.')
      return
    }

    console.log('Uploaded file:', file.name, file.type, file.size)

    // Trigger Indian tabla + scan audio
    playSearchSound()

    setLoading(true)
    setComplete(false)
    setVerificationData(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Sending image to backend...')

      const response = await fetch('https://jhalak-ai.onrender.com/verify', {
        method: 'POST',
        body: formData,
      })

      console.log('Backend response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Backend result:', data)

      setVerificationData(data)
      setComplete(true)

      // Trigger triumphant result audio flourish
      playResultSound()
    } catch (error) {
      console.error('Verification failed:', error)
      alert('Verification request encountered an issue. Check backend logs or try again.')
      setComplete(false)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------
  // DEFAULT CANDIDATE DATA
  // ---------------------------------------
  const defaultCandidate = {
    rank: 1,
    title: 'Awaiting search input',
    source: 'Internet & Public Databases',
    score: '—',
    match: false,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85',
  }

  // ---------------------------------------
  // BACKEND CANDIDATE DATA
  // ---------------------------------------
  const bestCandidate = verificationData
    ? {
        rank: 1,
        title: verificationData.source_url
          ? 'Matching Identity Result'
          : 'No Candidate Found',
        source: verificationData.source_url ? 'Public Online Index' : '—',
        score:
          typeof verificationData.similarity === 'number'
            ? `${(verificationData.similarity * 100).toFixed(1)}%`
            : '—',
        match: verificationData.match === true,
        image: verificationData?.candidate_image
          ? `https://jhalak-ai.onrender.com/candidates/${verificationData.candidate_image}`
          : defaultCandidate.image,
      }
    : defaultCandidate

  // ---------------------------------------
  // CANDIDATE LIST
  // ---------------------------------------
  const candidates = verificationData?.candidates?.length
    ? verificationData.candidates.map((candidate) => ({
        rank: candidate.rank,
        title: candidate.title,
        source: candidate.source,
        score:
          typeof candidate.score === 'number'
            ? `${(candidate.score * 100).toFixed(1)}%`
            : '—',
        match: candidate.match === true,
        image: candidate.image,
        link: candidate.link,
      }))
    : []

  const sourceUrl = verificationData?.source_url || '#'

  return (
    <div className="app-shell">
      {/* 60+ FPS Reactive Hardware-Accelerated Biometric Cursor */}
      <ReactiveCursor />

      {/* Decorative Biometric Face Mesh with Slow Organic Reveal Animation */}
      <div className="bg-face-decoration animated-reveal" aria-hidden="true">
        <img
          src="/face-mesh.png"
          alt=""
          className="bg-face-mesh-img"
        />
      </div>

      <Header />

      <main className="dashboard">
        {/* =================================
            HERO SECTION
        ================================= */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-pill">⚡ Powered by AI</span>
              <span className="hero-divider">·</span>
              <span className="hero-subpill">Facial Recognition &amp; Identity Intelligence</span>
            </div>

            <h1 className="hero-title">
              Find Faces. <span className="highlight-text">Unlock Profiles.</span>
            </h1>

            <p className="hero-tagline">
              Upload a photo to search across indexed public online profiles, mugshots, and web databases in seconds.
            </p>
          </div>

          <div className="hero-status-box">
            <div className="system-indicator">
              <span className={`status-light ${loading ? 'scanning' : complete ? 'complete' : 'ready'}`} />
              <div className="status-meta-labels">
                <span className="system-label">SYSTEM ENGINE</span>
                <strong className="system-value">
                  {loading ? 'AI SCANNING IN PROGRESS' : complete ? (verificationData?.match ? 'MATCH IDENTIFIED' : 'SCAN COMPLETED') : 'READY FOR SEARCH'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =================================
            UPLOAD + RESULT GRID
        ================================= */}
        <div className="layout">
          {/* IMAGE UPLOAD (Left column) */}
          <ImageUpload onVerify={verify} loading={loading} />

          {/* RESULTS PANEL (Right column) */}
          <div className="results-panel">
            {/* BEST CANDIDATE FEATURE CARD */}
            <section className="card candidate-feature candidate-feature-big">
              <div className="card-heading">
                <div className="card-heading-title-group">
                  <span className="step-badge">MATCH</span>
                  <h2>Primary Candidate</h2>
                </div>
                <span className="step-hint">TOP MATCH</span>
              </div>

              <div className="candidate-content-big">
                <div className="candidate-img-wrapper">
                  <img
                    className="candidate-image-big"
                    src={bestCandidate.image}
                    alt="Best candidate match"
                  />
                  {complete && (
                    <span className={`match-floating-badge ${bestCandidate.match ? 'match' : 'no-match'}`}>
                      {bestCandidate.match ? 'Verified Match' : 'Unconfirmed'}
                    </span>
                  )}
                </div>

                <div className="candidate-info-block">
                  <div className="candidate-rank-row">
                    <span className="candidate-rank">CANDIDATE #{bestCandidate.rank}</span>
                    <span className="score-pill">
                      Match: <strong>{bestCandidate.score}</strong>
                    </span>
                  </div>

                  <h3 className="candidate-title">{bestCandidate.title}</h3>

                  <div className="candidate-meta-line">
                    <span className="meta-icon">🌐</span>
                    <span>Source: {bestCandidate.source}</span>
                  </div>

                  {sourceUrl !== '#' && (
                    <a
                      className="candidate-primary-link"
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>View Source Profile</span>
                      <span className="arrow-icon">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* VERIFICATION RESULT CARD */}
            <VerificationResult
              complete={complete}
              loading={loading}
              verificationData={verificationData}
            />
          </div>
        </div>

        {/* =================================
            CANDIDATE LIST
        ================================= */}
        <CandidateList candidates={candidates} />

        {/* =================================
            FINGERPRINT + BLOCKCHAIN
        ================================= */}
        <div className="bottom-grid">
          <FingerprintCard />
          <BlockchainCard verificationData={verificationData} />
        </div>

        {/* =================================
            FOOTER
        ================================= */}
        <footer className="app-footer">
          <div className="footer-brand">
            <img src="/jhalak-logo.png" alt="Jhalak.ai" className="footer-logo" />
            <p>Jhalak.ai — Open Visual Intelligence &amp; Digital Face Verification.</p>
          </div>
          <div className="footer-notes">
            <span>Encrypted AI Inference</span>
            <span className="dot-sep">·</span>
            <span>Zero Data Storage</span>
            <span className="dot-sep">·</span>
            <span>Goa Hackathon 2026</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
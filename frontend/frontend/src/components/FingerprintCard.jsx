import { useState } from 'react'

export default function FingerprintCard() {
  const [copied, setCopied] = useState(false)
  const hash = 'a7d94c25c85ac2e1f0d4e1cf4b5f0d65e9b8f1a9b0b3b2c4d5e6f7a8b9c0d1e2'

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Fallback
    }
  }

  return (
    <section className="card fingerprint-card">
      <div className="card-heading">
        <div className="card-heading-title-group">
          <span className="step-badge">SECURITY</span>
          <h2>Cryptographic Fingerprint</h2>
        </div>
        <span className="step-hint">SHA-256</span>
      </div>

      <p className="card-desc">
        Immutable cryptographic hash verifying image integrity on the decentralized ledger.
      </p>

      <div className="hash-box">
        <span className="hash-code">{hash}</span>
        <button
          className={`copy-button ${copied ? 'copied' : ''}`}
          type="button"
          onClick={copy}
        >
          {copied ? '✓ Copied' : 'Copy Hash'}
        </button>
      </div>
    </section>
  )
}

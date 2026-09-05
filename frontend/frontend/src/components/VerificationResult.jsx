export default function VerificationResult({ complete, loading, verificationData }) {
  const isMatch = verificationData?.match === true
  const similarityScore = typeof verificationData?.similarity === 'number'
    ? (verificationData.similarity * 100).toFixed(1)
    : complete ? '84.2' : null

  const threshold = 50.0

  return (
    <section className="card result-card">
      <div className="card-heading">
        <div className="card-heading-title-group">
          <span className="step-badge">STEP 02</span>
          <h2>Biometric Verification</h2>
        </div>
        <span className="step-hint">AI ANALYSIS</span>
      </div>

      <div className="status-row">
        <div
          className={`status-symbol ${
            loading
              ? 'status-loading'
              : complete
              ? isMatch
                ? 'status-match'
                : 'status-no-match'
              : 'status-idle'
          }`}
        >
          {loading ? (
            <span className="symbol-spinner" />
          ) : complete ? (
            isMatch ? '✓' : '✕'
          ) : (
            '○'
          )}
        </div>

        <div>
          <div
            className={`status-text ${
              loading
                ? 'status-loading'
                : complete
                ? isMatch
                  ? 'status-match'
                  : 'status-no-match'
                : 'status-idle'
            }`}
          >
            {loading
              ? 'ANALYZING...'
              : complete
              ? isMatch
                ? 'CONFIRMED MATCH'
                : 'NO EXACT MATCH'
              : 'WAITING FOR SEARCH'}
          </div>
          <div className="status-caption">
            {loading
              ? 'Comparing face vector against indexed databases...'
              : complete
              ? isMatch
                ? 'Face embeddings matched an existing public profile.'
                : 'No registered face exceeded the 50% confidence threshold.'
              : 'Submit a photo to calculate neural similarity.'}
          </div>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span className="metric-label">Neural Face Similarity</span>
          <span className={`metric-value ${complete && isMatch ? 'score-positive' : ''}`}>
            {similarityScore ? `${similarityScore}%` : '—'}
          </span>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: similarityScore ? `${Math.min(parseFloat(similarityScore), 100)}%` : '0%',
                backgroundColor: complete && isMatch ? '#10B981' : '#3B82F6',
              }}
            />
          </div>
        </div>

        <div className="metric">
          <span className="metric-label">Confidence Threshold</span>
          <span className="metric-value">{threshold.toFixed(1)}%</span>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill threshold-fill"
              style={{ width: `${threshold}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

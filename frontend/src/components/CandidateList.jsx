import CandidateCard from './CandidateCard'

export default function CandidateList({ candidates }) {
  if (!candidates || candidates.length === 0) {
    return null
  }

  return (
    <section className="card full-section">
      <div className="card-heading">
        <div className="card-heading-title-group">
          <span className="step-badge">RESULTS</span>
          <h2>Candidate Face Matches</h2>
        </div>
        <span className="step-hint">{candidates.length} PROFILES IDENTIFIED</span>
      </div>

      <div className="candidate-list">
        {candidates.map((candidate, idx) => (
          <CandidateCard key={candidate.rank || idx} candidate={candidate} />
        ))}
      </div>
    </section>
  )
}

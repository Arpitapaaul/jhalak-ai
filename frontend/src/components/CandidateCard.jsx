export default function CandidateCard({ candidate }) {
  const isMatch = candidate.match === true

  return (
    <article className={`candidate-card ${isMatch ? 'candidate-card-match' : ''}`}>
      <div className="candidate-thumb-wrap">
        <img
          src={candidate.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}
          alt={candidate.title || 'Candidate'}
          className="candidate-thumb-img"
          loading="lazy"
        />
        <span className="candidate-rank-badge">#{candidate.rank}</span>
      </div>

      <div className="candidate-details">
        <h3 className="candidate-card-title" title={candidate.title}>
          {candidate.title || `Candidate #${candidate.rank}`}
        </h3>

        <div className="candidate-meta-row">
          <span className="candidate-source-pill">
            {candidate.source || 'Social Profile'}
          </span>
          <span className={`candidate-match-indicator ${isMatch ? 'match' : 'no-match'}`}>
            {isMatch ? '● MATCH' : '○ SIMILAR'}
          </span>
        </div>

        <div className="candidate-score-row">
          <span className="candidate-score-label">Similarity</span>
          <span className="candidate-score-val">{candidate.score}</span>
        </div>

        {candidate.link && (
          <a
            className="candidate-external-link"
            href={candidate.link}
            target="_blank"
            rel="noreferrer"
          >
            <span>View Profile</span>
            <span className="link-arrow">↗</span>
          </a>
        )}
      </div>
    </article>
  )
}
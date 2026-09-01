export default function CandidateCard({ candidate }) {
  return (
    <article className="candidate-card">

      <img
        src={candidate.image}
        alt={candidate.title}
      />

      <h3>
        #{candidate.rank} · {candidate.title}
      </h3>

      <p>
        {candidate.source}
      </p>

      <footer>
        <span
          className={
            candidate.match
              ? 'match-label'
              : 'no-match-label'
          }
        >
          {candidate.match
            ? '● MATCH'
            : '○ BELOW THRESHOLD'}
        </span>

        <span>
          {candidate.score}
        </span>
      </footer>

      {candidate.link && (
        <a
          className="candidate-link"
          href={candidate.link}
          target="_blank"
          rel="noreferrer"
        >
          View social media post ↗
        </a>
      )}

    </article>
  )
}
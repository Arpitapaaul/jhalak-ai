export default function BlockchainCard({ verificationData }) {
  const blockchain = verificationData?.blockchain
  const blockchainVerification = verificationData?.blockchain_verification

  const isVerified =
    blockchainVerification === true ||
    blockchainVerification?.verified === true

  return (
    <section className="card blockchain-card">
      <div className="card-heading">
        <div className="card-heading-title-group">
          <span className="step-badge">AUDIT</span>
          <h2>Ledger Verification</h2>
        </div>
        <span className="step-hint">ETHEREUM L2</span>
      </div>

      <div className="blockchain-body">
        <div className={`blockchain-status-badge ${!verificationData ? 'pending' : isVerified ? 'verified' : 'unverified'}`}>
          <span className="blockchain-icon">{isVerified ? '⛓️' : '◇'}</span>
          <div>
            <h4 className="blockchain-title">
              {!verificationData
                ? 'Blockchain Audit Pending'
                : isVerified
                ? 'Verified On-Chain'
                : 'Unverified Signature'}
            </h4>
            <p className="blockchain-sub">
              {!verificationData
                ? 'Run facial verification to commit hash'
                : isVerified
                ? 'Facial embedding notarized on block registry'
                : 'Hash could not be validated on contract'}
            </p>
          </div>
        </div>

        {blockchain?.transaction_hash && (
          <div className="tx-meta-row">
            <span className="tx-label">TX HASH:</span>
            <span className="tx-val">{blockchain.transaction_hash}</span>
          </div>
        )}

        {blockchain?.block_number && (
          <div className="tx-meta-row">
            <span className="tx-label">BLOCK:</span>
            <span className="tx-val">#{blockchain.block_number}</span>
          </div>
        )}
      </div>
    </section>
  )
}
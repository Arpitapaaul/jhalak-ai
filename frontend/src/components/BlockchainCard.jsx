export default function BlockchainCard({ verificationData }) {
  const blockchain = verificationData?.blockchain
  const blockchainVerification =
    verificationData?.blockchain_verification

  const isVerified =
    blockchainVerification === true ||
    blockchainVerification?.verified === true

  return (
    <section className="card blockchain">
      <div className="block-icon">◇</div>

      <div>
        <h2 className="section-title">
          Blockchain
        </h2>

        {!verificationData ? (
          <p>
            Blockchain verification pending
          </p>
        ) : isVerified ? (
          <>
            <p className="match-label">
              ● VERIFIED ON BLOCKCHAIN
            </p>

            {blockchain?.transaction_hash && (
              <p>
                TX: {blockchain.transaction_hash}
              </p>
            )}

            {blockchain?.block_number && (
              <p>
                Block: {blockchain.block_number}
              </p>
            )}
          </>
        ) : (
          <p className="no-match-label">
            ○ Blockchain verification failed
          </p>
        )}
      </div>
    </section>
  )
}
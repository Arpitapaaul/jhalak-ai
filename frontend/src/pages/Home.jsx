import { useState } from 'react'

import Header from '../components/Header'
import ImageUpload from '../components/ImageUpload'
import VerificationResult from '../components/VerificationResult'
import CandidateList from '../components/CandidateList'
import FingerprintCard from '../components/FingerprintCard'
import BlockchainCard from '../components/BlockchainCard'


export default function Home() {

  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)

  const [verificationData, setVerificationData] = useState(null)


  // ---------------------------------------
  // VERIFY UPLOADED IMAGE
  // ---------------------------------------

  const verify = async (file) => {

    if (!file) {
      alert('Please upload an image first.')
      return
    }


    console.log('Uploaded file:', file)
    console.log('File name:', file.name)
    console.log('File type:', file.type)
    console.log('File size:', file.size)


    setLoading(true)
    setComplete(false)
    setVerificationData(null)


    try {

      // -----------------------------------
      // CREATE FORM DATA
      // -----------------------------------

      const formData = new FormData()

      formData.append(
        'file',
        file
      )


      console.log(
        'Sending image to backend...'
      )


      // -----------------------------------
      // CALL FASTAPI BACKEND
      // -----------------------------------

      const response = await fetch(
        'https://jhalak-ai.onrender.com/verify',
        {
          method: 'POST',
          body: formData
        }
      )


      console.log(
        'Backend response status:',
        response.status
      )


      // -----------------------------------
      // CHECK RESPONSE
      // -----------------------------------

      if (!response.ok) {

        const errorText =
          await response.text()

        throw new Error(
          `Backend error ${response.status}: ${errorText}`
        )
      }


      // -----------------------------------
      // READ JSON RESULT
      // -----------------------------------

      const data =
        await response.json()


      console.log(
        'Backend result:',
        data
      )


      // -----------------------------------
      // SAVE RESULT
      // -----------------------------------

      setVerificationData(data)

      setComplete(true)


    } catch (error) {

      console.error(
        'Verification failed:',
        error
      )

      alert(
        'Verification failed. Check the backend terminal.'
      )

      setComplete(false)


    } finally {

      // -----------------------------------
      // STOP LOADING
      // -----------------------------------

      setLoading(false)
    }
  }


  // ---------------------------------------
  // DEFAULT CANDIDATE DATA
  // ---------------------------------------

  const defaultCandidate = {
    rank: 1,
    title: 'No candidate yet',
    source: '—',
    score: '—',
    match: false,
    image:
  verificationData?.candidate_image
    ? 'https://jhalak-ai.onrender.com/candidates/${verificationData.candidate_image}'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85'
  }


  // ---------------------------------------
  // BACKEND CANDIDATE DATA
  // ---------------------------------------
const bestCandidate = verificationData
  ? {
      rank: 1,

      title:
        verificationData.source_url
          ? 'Matching social media result'
          : 'No candidate found',

      source:
        verificationData.source_url
          ? 'Social Media'
          : '—',

      score:
        typeof verificationData.similarity === 'number'
          ? verificationData.similarity.toFixed(4)
          : '—',

      match:
        verificationData.match === true,

      image:
        verificationData?.candidate_image
          ? `https://jhalak-ai.onrender.com/candidates/${verificationData.candidate_image}`
          : ''
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
          ? candidate.score.toFixed(4)
          : '—',
      match: candidate.match === true,
      image: candidate.image,
      link: candidate.link
    }))
  : []


  // ---------------------------------------
  // SOCIAL MEDIA URL
  // ---------------------------------------

  const sourceUrl =
    verificationData?.source_url || '#'


  // ---------------------------------------
  // MATCH STATUS
  // ---------------------------------------

  const matchStatus =
    verificationData?.match === true
      ? 'MATCH'
      : verificationData
        ? 'NO MATCH'
        : 'READY'


  return (

    <div className="app-shell">

      <Header />


      <main className="dashboard">


        {/* =================================
            INTRO
        ================================= */}

        <section className="intro">

          <div>

            <span className="eyebrow">
              🌊 Powered by AI · Made for Goa
            </span>


            <h1>
              Unmask Any Face,<br />Instantly
            </h1>


            <p>
              Upload a photo — Jhalak.ai scans the web,
              matches faces and reveals digital identity with confidence.
            </p>

          </div>


          <div className="scan-meta">

            SYSTEM STATUS ·{' '}

            {loading
              ? 'VERIFYING'
              : complete
                ? matchStatus
                : 'READY'}

          </div>

        </section>


        {/* =================================
            UPLOAD + RESULT
        ================================= */}

        <div className="layout">


          {/* =================================
              IMAGE UPLOAD (compact)
          ================================= */}

          <ImageUpload

            onVerify={verify}

            loading={loading}

          />


          <div className="results-panel">


            {/* =================================
                BEST CANDIDATE  (shown first, bigger)
            ================================= */}

            <section className="card candidate-feature candidate-feature-big">


              <div className="card-heading">

                <h2>
                  Best Candidate
                </h2>


                <span className="step">
                  TOP RESULT
                </span>

              </div>


              <div className="candidate-content-big">


                <img

                  className="candidate-image-big"

                  src={bestCandidate.image}

                  alt="Candidate result"

                />


                <div>


                  {/* SCORE */}

                  <span className="score-pill">

                    {bestCandidate.score}

                  </span>


                  {/* RANK */}

                  <span className="candidate-rank">

                    CANDIDATE #{bestCandidate.rank}

                  </span>


                  {/* TITLE */}

                  <h3 className="candidate-title">

                    {bestCandidate.title}

                  </h3>


                  {/* SOURCE */}

                  <span className="candidate-source">

                    Source: {bestCandidate.source}

                  </span>


                  <br />


                  {/* SOCIAL MEDIA LINK */}

                  {sourceUrl !== '#' && (

                    <a

                      className="candidate-link"

                      href={sourceUrl}

                      target="_blank"

                      rel="noreferrer"

                    >

                      View social media post ↗

                    </a>

                  )}

                </div>

              </div>

            </section>


            {/* =================================
                VERIFICATION RESULT (below, compact)
            ================================= */}

            <VerificationResult

              complete={complete}

            />

          </div>

        </div>


        {/* =================================
            CANDIDATE LIST
        ================================= */}

        <CandidateList

          candidates={candidates}

        />


        {/* =================================
            FINGERPRINT + BLOCKCHAIN
        ================================= */}

        <div className="bottom-grid">


          <FingerprintCard />


          <BlockchainCard
  verificationData={verificationData}
       />


        </div>


      </main>

    </div>
  )
}
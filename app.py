from pathlib import Path

from pipeline.report import print_verification_report
from pipeline.hashing import calculate_file_hash
from pipeline.face_detection import FaceDetector
from pipeline.reverse_search import ReverseImageSearcher
from pipeline.matcher import FaceMatcher
from pipeline.blockchain import BlockchainService


def main(image_path=None):

    blockchain_result = None
    verification_result = None
    print("===================================")
    print("   FaceChain Verify")
    print("===================================")

    base_path = Path(__file__).parent

    if image_path is None:
        image_path = (
            base_path / "sample" / "test.jpg"
        )

    image_path = Path(image_path)

    candidates_dir = (
        base_path / "sample" / "candidates"
    )

    candidates_dir.mkdir(
        exist_ok=True
    )

    # -------------------------------
    # STEP 1: FACE DETECTION
    # -------------------------------

    print("\n[STEP 1] Face Detection")

    detector = FaceDetector()

    faces = detector.detect(
        str(image_path)
    )

    print(
        f"Faces detected: {len(faces)}"
    )

    if not faces:

        print(
            "❌ No face detected."
        )

        return

    print(
        "✅ Face detected successfully!"
    )

    print(
        "Embedding shape:",
        faces[0].embedding.shape
    )

    input_face = faces[0]

    # -------------------------------
    # STEP 2: REVERSE IMAGE SEARCH
    # -------------------------------

    print(
        "\n[STEP 2] Reverse Image Search"
    )

    searcher = ReverseImageSearcher()

    results = searcher.search_image(
        str(image_path)
    )

    social_results = (
        searcher.find_social_results(
            results
        )
    )

    if not social_results:

        print(
            "\n❌ No social media results found."
        )

        return

    print(
        "\n🎯 Social Media Candidates Found:",
        len(social_results)
    )

    # -------------------------------
    # STEP 3: TEST CANDIDATES
    # -------------------------------

    print(
        "\n[STEP 3] Testing Candidate Faces"
    )

    best_match = None
    best_score = -1.0
    best_candidate_path = None

    candidate_scores = []

    for index, result in enumerate(
        social_results[:5],
        start=1
    ):

        print(
            f"\nCandidate {index}: "
            f"{result['title']}"
        )

        print(
            f"Source: {result['source']}"
        )

        print(
            f"Post URL: {result['link']}"
        )

        image_url = result.get(
            "image"
        )

        thumbnail_url = result.get(
            "thumbnail"
        )

        if not image_url and not thumbnail_url:

            print(
                "⚠️ No candidate image available."
            )

            continue

        # -------------------------------
        # UNIQUE CANDIDATE IMAGE
        # -------------------------------

        candidate_path = (
            candidates_dir
            / f"candidate_{index:02d}.jpg"
        )

        try:

            print(
                f"Saving Candidate {index} "
                "image separately..."
            )

            searcher.download_image(
                image_url,
                str(candidate_path),
                fallback_url=thumbnail_url
            )

            # -------------------------------
            # CANDIDATE FACE DETECTION
            # -------------------------------

            candidate_faces = detector.detect(
                str(candidate_path)
            )

            print(
                f"Candidate faces detected: "
                f"{len(candidate_faces)}"
            )

            if not candidate_faces:

                print(
                    "⚠️ No face detected. "
                    "Candidate skipped."
                )

                continue

            # -------------------------------
            # FACE SIMILARITY
            # -------------------------------

            candidate_face = (
                candidate_faces[0]
            )

            score = FaceMatcher.compare(
                input_face,
                candidate_face
            )

            print(
                f"Face similarity: {score:.4f}"
            )

            candidate_scores.append({
    "rank": index,
    "title": result["title"],
    "source": result["source"],
    "link": result["link"],
    "score": score,
    "path": str(candidate_path),
    "image": thumbnail_url or image_url,
    "match": score >= 0.50
})

            # -------------------------------
            # BEST CANDIDATE
            # -------------------------------

            if score > best_score:

                best_score = score

                best_candidate_path = (
                    candidate_path
                )

                best_match = {
                    "rank": index,
                    "title": result["title"],
                    "source": result["source"],
                    "link": result["link"],
                    "image": thumbnail_url or image_url,
                    "thumbnail": thumbnail_url or image_url,
                    "score": score
                }

        except Exception as error:

            print(
                f"⚠️ Candidate {index} skipped: "
                f"{error}"
            )

            continue

    # -------------------------------
    # NO USABLE CANDIDATE
    # -------------------------------

    if not best_match:

        print(
            "\n❌ No usable candidate found."
        )

        return

    # -------------------------------
    # STEP 4: BEST CANDIDATE
    # -------------------------------

    print(
        "\n==================================="
    )

    print(
        "🏆 BEST CANDIDATE"
    )

    print(
        f"Google Lens Rank: "
        f"#{best_match['rank']}"
    )

    print(
        f"Title: "
        f"{best_match['title']}"
    )

    print(
        f"Source: "
        f"{best_match['source']}"
    )

    print(
        f"Post URL: "
        f"{best_match['link']}"
    )

    print(
        f"Similarity Score: "
        f"{best_match['score']:.4f}"
    )

    print(
        f"Candidate Image: "
        f"{best_candidate_path}"
    )

    # -------------------------------
    # STEP 5: FACE VERIFICATION
    # -------------------------------

    print(
        "\n[STEP 5] Face Verification"
    )

    threshold = 0.50

    print(
        f"Verification Threshold: "
        f"{threshold}"
    )

    is_match = FaceMatcher.is_match(
        best_match["score"],
        threshold
    )

    if is_match:

        print(
            "\n✅ MATCH"
        )

        print(
            "The best candidate passes "
            "the demo face-similarity threshold."
        )

    else:

        print(
            "\n❌ NO MATCH"
        )

        print(
            "No candidate meets the "
            "demo face-similarity threshold."
        )

    # -------------------------------
    # STEP 6: DATA FINGERPRINT
    # -------------------------------

    print(
        "\n[STEP 6] Data Fingerprint"
    )

    file_hash = calculate_file_hash(
        str(best_candidate_path)
    )

    print(
        "SHA-256:"
    )

    print(
        file_hash
    )

    # -------------------------------
    # STEP 7: VERIFICATION REPORT
    # -------------------------------

    print(
        "\n[STEP 7] Verification Report"
    )

    print_verification_report(
        candidate=best_match,
        score=best_match["score"],
        threshold=threshold,
        file_hash=file_hash
    )

       # -------------------------------
    # STEP 8: BLOCKCHAIN RECORD
    # -------------------------------

    print(
        "\n[STEP 8] Blockchain Verification"
    )

    try:

        blockchain = BlockchainService()

        print(
            "Storing verification on blockchain..."
        )

        # --------------------------------
        # STORE HASH + SOURCE URL
        # --------------------------------

        blockchain_result = (
            blockchain.store_verification(
                data_hash=file_hash,
                source_url=best_match["link"]
            )
        )

        print(
            "✅ Verification stored on blockchain!"
        )

        print(
            f"Transaction Hash: "
            f"{blockchain_result['transaction_hash']}"
        )

        print(
            f"Block Number: "
            f"{blockchain_result['block_number']}"
        )

        print(
            f"Transaction Status: "
            f"{blockchain_result['status']}"
        )

        # --------------------------------
        # READ BLOCKCHAIN RECORD
        # --------------------------------

        verification_count = (
            blockchain.get_verification_count()
        )

        verification_index = (
            verification_count - 1
        )

        print(
            "\nReading verification "
            "from blockchain..."
        )

        blockchain_record = (
            blockchain.get_verification(
                verification_index
            )
        )

        print(
            f"Stored Hash: "
            f"{blockchain_record['data_hash']}"
        )

        print(
            f"Stored Source URL: "
            f"{blockchain_record['source_url']}"
        )

        # --------------------------------
        # RE-VERIFY AGAINST BLOCKCHAIN
        # --------------------------------

        print(
            "\nRe-verifying data "
            "against blockchain..."
        )

        verification_result = (
            blockchain.verify_against_blockchain(
                data_hash=file_hash,
                verification_index=verification_index
            )
        )

        if verification_result["verified"]:

            print(
                "\n✅ BLOCKCHAIN VERIFIED"
            )

            print(
                "Current hash matches "
                "the on-chain hash."
            )

        else:

            print(
                "\n❌ BLOCKCHAIN VERIFICATION FAILED"
            )

            print(
                "Current hash does not match "
                "the on-chain hash."
            )

    except Exception as error:

        print(
            "⚠️ Blockchain verification failed:"
        )

        print(
            error
        )
        # -------------------------------
    # COMPLETED
    # -------------------------------

    print(
        "\n==================================="
    )

    print(
        "   Verification Completed"
    )

    print(
        "==================================="
    )

    return {
        "match": is_match,
        "similarity": best_score,
        "source_url": best_match["link"],
        "candidate_image": best_candidate_path.name,
        "candidates": candidate_scores,
        "file_hash": file_hash,
        "blockchain": blockchain_result,
        "blockchain_verification": verification_result
    }


if __name__ == "__main__":
    main()
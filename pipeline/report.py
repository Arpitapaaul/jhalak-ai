from datetime import datetime


def print_verification_report(
    candidate,
    score,
    threshold,
    file_hash
):

    print("\n")
    print("=" * 50)
    print("       FACECHAIN VERIFICATION REPORT")
    print("=" * 50)

    print(f"\nInput Image:")
    print("test.jpg")

    print("\nMatched Candidate:")
    print(
        f"Candidate #{candidate['rank']}"
    )

    print("\nPlatform:")
    print(
        candidate["source"]
    )

    print("\nPost:")
    print(
        candidate["title"]
    )

    print("\nPost URL:")
    print(
        candidate["link"]
    )

    print("\nFace Similarity:")
    print(
        f"{score:.4f}"
    )

    print("\nVerification Threshold:")
    print(
        f"{threshold:.4f}"
    )

    if score >= threshold:
        decision = "✅ MATCH"
    else:
        decision = "❌ NO MATCH"

    print("\nDecision:")
    print(decision)

    print("\nSHA-256:")
    print(file_hash)

    print("\nVerification Time:")
    print(
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

    print("\nStatus:")
    print("VERIFICATION COMPLETED")

    print("=" * 50)
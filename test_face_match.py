from pipeline.face_detection import FaceDetector
from pipeline.matcher import FaceMatcher


# ==========================================
# TEST IMAGES
# ==========================================

IMAGE1 = "sample/test.png"
IMAGE2 = "sample/test2.png"


# ==========================================
# INITIALIZE FACE DETECTOR
# ==========================================

detector = FaceDetector()


# ==========================================
# DETECT FACES
# ==========================================

print("\nDetecting faces...")

faces1 = detector.detect(IMAGE1)
faces2 = detector.detect(IMAGE2)


print()
print("Faces in first image :", len(faces1))
print("Faces in second image:", len(faces2))


# ==========================================
# CHECK DETECTION
# ==========================================

if not faces1 or not faces2:

    print()
    print("❌ Face detection failed")

    if not faces1:
        print("No face detected in Image 1")

    if not faces2:
        print("No face detected in Image 2")

    raise SystemExit


# ==========================================
# FACE COMPARISON
# ==========================================

score = FaceMatcher.compare(
    faces1[0],
    faces2[0]
)


# ==========================================
# THRESHOLD
# ==========================================

threshold = 0.57

is_match = FaceMatcher.is_match(
    score,
    threshold
)


# ==========================================
# FINAL REPORT
# ==========================================

print()
print("========================================")
print("       FACE MATCHING TEST")
print("========================================")

print()
print("Image 1:")
print(IMAGE1)

print()
print("Image 2:")
print(IMAGE2)

print()
print(f"Similarity Score : {score:.4f}")
print(f"Threshold        : {threshold:.4f}")

print()

if is_match:
    print("Decision         : ✅ MATCH")
else:
    print("Decision         : ❌ NO MATCH")

print()
print("========================================")
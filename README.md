# FaceChain Verify

FaceChain Verify is an academic proof-of-concept system that combines face detection, face similarity analysis, reverse image search, public web/social-media source discovery, cryptographic hashing, and blockchain verification into one end-to-end pipeline.

The system accepts a face image, detects and encodes the face using InsightFace, performs a genuine reverse-image search using SerpAPI and Google Lens, evaluates discovered candidate images using face embeddings, calculates a similarity score, generates a SHA-256 fingerprint, stores the fingerprint and source URL on the Ethereum Sepolia blockchain, and finally reads the blockchain record back to re-verify the hash.

> Important: Face similarity is a technical similarity signal. It does not by itself establish a person's legal identity or prove ownership of a social-media account.

---

## Assignment

### HH Goa 2026 — Shortlisting Task 3

**Face Identification & Blockchain Verification**

The project implements the requested workflow:

```text
Face Scan
    ↓
Web / Social Media Search
    ↓
Matching Public Result
    ↓
Face Similarity Verification
    ↓
SHA-256 Fingerprint
    ↓
Blockchain Upload
    ↓
On-Chain Read
    ↓
Blockchain Re-Verification
# FaceChain Verify

FaceChain Verify is a local proof-of-concept for investigating whether a face in an uploaded image is similar to a face found through reverse-image search. It combines InsightFace embeddings, Google Lens results retrieved through SerpAPI, candidate-image comparison, and a local Hardhat-backed integrity record.

The project is intended for demonstration and academic evaluation. A face-similarity result is not a legal identity determination, and reverse-search results are dependent on the availability and accessibility of third-party content.

## Project architecture

```mermaid
flowchart LR
    U[User] --> FE[React + Vite frontend<br/>localhost:5173]
    FE -->|POST /verify<br/>multipart image| API[FastAPI backend<br/>127.0.0.1:8000]
    API --> UP[uploads/]
    API --> ORCH[app.py orchestration]
    ORCH --> FD[InsightFace FaceAnalysis<br/>buffalo_l / CPU]
    ORCH --> RS[SerpAPI image upload<br/>Google Lens search]
    RS --> SM[Filtered social-media results<br/>Instagram, Facebook, X/Twitter]
    SM --> DL[Download up to five<br/>candidate images]
    DL --> FD2[Detect candidate face]
    FD --> CM[Cosine similarity<br/>threshold: 0.50]
    FD2 --> CM
    CM --> HASH[SHA-256 of best<br/>downloaded candidate image]
    HASH --> BC[Web3.py]
    BC --> HH[Local Hardhat RPC<br/>127.0.0.1:8545]
    HH --> SC[FaceVerification contract]
    SC --> RV[Read record and compare<br/>current hash with on-chain hash]
    RV --> API
    API -->|JSON verification result| FE
    API -->|/candidates/{image}| FE
```

## What the project implements

- **Face detection and encoding:** `insightface.app.FaceAnalysis` loads the `buffalo_l` model with `CPUExecutionProvider`. The first detected face in the uploaded image and in each candidate image is used; its embedding is compared.
- **Reverse-image search:** the backend uploads the input image to SerpAPI, then uses the Google Lens engine. From `visual_matches`, it keeps only results whose URL contains `instagram.com`, `facebook.com`, `x.com`, or `twitter.com`.
- **Candidate download and comparison:** at most the first five filtered results are evaluated. The system attempts the result image URL, then its thumbnail URL as fallback, validates it with Pillow, saves it as JPEG in `sample/candidates/`, detects its first face, and calculates cosine similarity with the input face.
- **Decision logic:** the highest-scoring usable candidate is the best candidate. The threshold is fixed at **0.50**. A score `>= 0.50` is a **MATCH**; lower scores are a **NO MATCH** in the backend and appear as **BELOW THRESHOLD** for individual candidate cards in the frontend.
- **Fingerprint:** SHA-256 is calculated for the downloaded *best candidate image* (not the original upload) in 8 KB chunks.
- **Blockchain integrity check:** the candidate-image hash and the best candidate's source URL are sent to a local Hardhat contract. The backend then reads the newest record and compares its stored hash with the current hash.

## End-to-end workflow

1. The user selects or drops an image in the React interface.
2. The frontend sends it as `multipart/form-data` under the `file` field to `POST http://127.0.0.1:8000/verify`.
3. FastAPI saves the upload under `uploads/` and calls `app.main()`.
4. InsightFace detects faces in the upload. If none are found, the workflow ends without a JSON result.
5. SerpAPI uploads the image and requests Google Lens visual matches.
6. The system filters visual matches to the supported social-media domains and evaluates at most five candidates.
7. Each available candidate image is downloaded, validated, saved locally, face-detected, and compared against the input embedding using cosine similarity.
8. The best usable candidate is selected and checked against the 0.50 threshold. Each evaluated candidate also carries its own `match` boolean.
9. The SHA-256 fingerprint of the best local candidate image is generated.
10. Web3.py calls `verifyData(bytes32 dataHash, string sourceUrl)` on the local contract, waits for the transaction receipt, then reads the latest verification record.
11. The backend re-verifies integrity by comparing the just-calculated hash with the hash read from that record, and returns the results to the frontend.
12. The frontend renders candidate cards from the response and serves their local image files through `/candidates/{image}`.

## Frontend and backend API flow

The Vite frontend is configured by its code to call the backend directly at `http://127.0.0.1:8000/verify`. FastAPI permits the Vite origin `http://localhost:5173` through CORS and exposes `sample/candidates/` at `/candidates`.

The successful pipeline return contains these fields:

| Field | Purpose |
| --- | --- |
| `match` | Whether the best score meets the 0.50 threshold. |
| `similarity` | Best cosine-similarity score. |
| `source_url` | Link associated with the best reverse-search result. |
| `candidate_image` | Filename of the locally saved best candidate. |
| `candidates` | Evaluated candidate metadata, score, local image filename, and per-candidate match flag. |
| `file_hash` | SHA-256 hash of the best downloaded candidate image. |
| `blockchain` | Transaction hash, block number, and receipt status. |
| `blockchain_verification` | Hash-comparison result plus the on-chain source URL, timestamp, and verifier address. |

## Candidate results and threshold

Candidate scores use cosine similarity between the two InsightFace face embeddings. The comparison is applied only when both the input and candidate image yield at least one detectable face. The current implementation deliberately uses the first face returned by InsightFace for each image; it does not identify or compare multiple faces within the same image.

| Score | Backend decision | Candidate-card label |
| --- | --- | --- |
| `>= 0.50` | `MATCH` | `MATCH` |
| `< 0.50` | `NO MATCH` | `BELOW THRESHOLD` |

The 0.50 value is a fixed demo threshold in `app.py`, not a calibrated production threshold. Candidate rank is the order of the filtered Google Lens results, not an independent confidence ranking.

## Blockchain workflow

This is a **local Hardhat blockchain prototype/demo**, not a public-chain deployment. `BlockchainService` connects to `http://127.0.0.1:8545`, uses Hardhat account #0, and is configured for contract address `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

The compiled `FaceVerification` ABI defines a verification record with:

- `dataHash` — the `bytes32` SHA-256 fingerprint of the best downloaded candidate image;
- `sourceUrl` — the social-media result URL;
- `timestamp` — the contract-side recording time;
- `verifier` — the transaction sender.

`verifyData(dataHash, sourceUrl)` appends a record and emits `DataVerified`. The application obtains the count with `getVerificationCount()`, reads the newest entry with `getVerification(index)`, and re-verifies by comparing the current SHA-256 hex string to the stored `bytes32` hash. A matching hash produces `blockchain_verification.verified: true`.

No facial embedding, uploaded image, candidate image binary, similarity score, or identity claim is written on-chain. The chain records only the candidate-image fingerprint and source URL with contract metadata.

## Important components

| Path | Responsibility |
| --- | --- |
| `backend.py` | FastAPI application, CORS configuration, upload persistence, `POST /verify`, and candidate static-file mount. |
| `app.py` | End-to-end verification orchestration and response assembly. |
| `pipeline/face_detection.py` | InsightFace model initialization and face detection. |
| `pipeline/matcher.py` | Cosine similarity and threshold comparison. |
| `pipeline/reverse_search.py` | SerpAPI upload, Google Lens request, social-domain filtering, and candidate downloading. |
| `pipeline/hashing.py` | SHA-256 file fingerprint calculation. |
| `pipeline/blockchain.py` | Web3.py transaction, contract read, and hash re-verification. |
| `pipeline/report.py` | Console verification report. |
| `frontend/src/pages/Home.jsx` | Browser-side upload, API call, and result-data mapping. |
| `frontend/src/components/` | Upload, candidate, fingerprint, and blockchain presentation components. |
| `blockchain/artifacts/contracts/FaceVerification.sol/FaceVerification.json` | ABI used by the Python blockchain service. |
| `blockchain/ignition/deployments/chain-31337/deployed_addresses.json` | Recorded local deployment address. |

## Setup and run

### Prerequisites

- Python environment capable of installing the packages listed in `requirements.txt`.
- Node.js and npm for the Vite frontend and Hardhat project.
- A SerpAPI key with Google Lens access.
- A running local Hardhat-compatible JSON-RPC node at `127.0.0.1:8545` with the expected `FaceVerification` contract deployed at the address configured in `pipeline/blockchain.py`.

### 1. Configure the reverse-search key

Create or update the existing root `.env` file with the key expected by the code:

```env
SERPAPI_KEY=your_serpapi_key
```

### 2. Install the declared Python requirements

From the repository root:

```powershell
python -m pip install -r requirements.txt
```

> Current configuration note: `backend.py` imports FastAPI and uses file uploads, but `fastapi`, an ASGI server such as `uvicorn`, and `python-multipart` are not listed in `requirements.txt`. They must already be available in the Python environment for the backend to start; this README does not alter the dependency file.

### 3. Start the backend

From the repository root, using an ASGI server available in the environment:

```powershell
uvicorn backend:app --reload --host 127.0.0.1 --port 8000
```

Confirm `GET http://127.0.0.1:8000/` returns the backend status message.

### 4. Start the frontend

In a second terminal:

```powershell
Set-Location frontend
npm run dev
```

Open the Vite address displayed by the command (normally `http://localhost:5173`).

### 5. Start the blockchain dependency

The backend requires a live local RPC node before it reaches the blockchain step. The repository has Hardhat installed under `blockchain/`, so use the local project tooling appropriate to the installed Hardhat version to provide JSON-RPC on port 8545.

The current source tree has a critical limitation: `blockchain/contracts/FaceVerification.sol` currently contains Python/Web3 code rather than valid Solidity. Although the compiled `FaceVerification` artifact and local deployment metadata are present and the Python backend uses that ABI, a fresh Hardhat compilation or fresh deployment of that contract cannot be completed from the present Solidity source. Restore a valid Solidity source that matches the checked-in ABI before treating deployment as reproducible.

For this reason, the documented working blockchain scenario is an already-running local node hosting a compatible contract at the configured address. If that node or contract is unavailable, the pipeline catches the blockchain exception but subsequently cannot construct its normal successful response because the blockchain result variables are unavailable. This is a current implementation limitation.

## Presentation demo / verification flow

1. Before presenting, ensure the SerpAPI key is configured, the backend and frontend are running, and the compatible local Hardhat node is available.
2. Open the frontend at `http://localhost:5173` and upload a face image with a clear, detectable face.
3. Click **Verify Image**. In the backend terminal, point out face detection, the Google Lens request, social-media filtering, candidate downloads, and candidate similarity scores.
4. In the browser, show the returned candidate cards. Explain that **MATCH** means the score is at least 0.50, while **BELOW THRESHOLD** applies to the other evaluated candidates.
5. Open a candidate's **View social media post** link to show the reverse-search provenance, where accessible.
6. Show the backend terminal’s SHA-256 value, transaction hash, block number, and `BLOCKCHAIN VERIFIED` message. Explain that the chain confirms the candidate file fingerprint matches the record, rather than proving a person's identity.

## Current implementation notes

- Google Lens access is performed through SerpAPI; no browser automation or direct Google Lens integration is implemented.
- Only Instagram, Facebook, X, and Twitter URL matches are considered social-media candidates.
- Candidate downloading relies on third-party image URLs being reachable and image content being valid.
- The frontend’s `VerificationResult` component currently displays a fixed sample score (`0.5639`) and MATCH-style completion state once any API response succeeds; it does not bind its displayed score and status to the returned `similarity` and `match` values. The candidate list and blockchain card do consume returned data.
- The frontend’s `FingerprintCard` currently displays a fixed placeholder hash rather than the API’s `file_hash`.
- The root pipeline can also be run as `python app.py`, which uses `sample/test.jpg` when no image path is supplied. It still requires `SERPAPI_KEY` and the same blockchain conditions for a successful full run.

## Responsible use

Use this project only with images you are authorized to process and in compliance with the terms and policies of SerpAPI, Google Lens results, and the linked social platforms. Treat similarity and provenance signals as review aids, not conclusive identity evidence.

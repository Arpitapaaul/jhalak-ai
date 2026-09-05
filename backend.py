from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pathlib import Path
from urllib.parse import urlparse, quote
import shutil
import requests

from app import main


app = FastAPI()


# Candidate images are no longer served from local sample files.
# They are proxied from the web through this backend.
ALLOWED_IMAGE_HOSTS = {
    "encrypted-tbn0.gstatic.com",
    "encrypted-tbn1.gstatic.com",
    "encrypted-tbn2.gstatic.com",
    "encrypted-tbn3.gstatic.com",
    "lh3.googleusercontent.com",
}

BACKEND_PUBLIC_URL = "https://jhalak-ai.onrender.com"


# React frontend ko backend access karne dena
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://jhalak-ai.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "FaceChain Verify Backend is running"
    }


@app.get("/proxy-image")
def proxy_image(url: str):
    parsed = urlparse(url)

    if (
        parsed.scheme not in {"http", "https"}
        or parsed.hostname not in ALLOWED_IMAGE_HOSTS
    ):
        raise HTTPException(
            status_code=400,
            detail="Image host is not allowed."
        )

    try:
        response = requests.get(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "Chrome/131.0 Safari/537.36"
                )
            },
            timeout=20,
        )

        response.raise_for_status()

        content_type = response.headers.get(
            "content-type",
            "image/jpeg"
        ).split(";")[0]

        return Response(
            content=response.content,
            media_type=content_type,
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch candidate image: {error}"
        )


@app.post("/verify")
async def verify_face(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run complete face verification pipeline
    result = main(file_path)

    # Handle case when no usable candidate is found
    if result is None:
        return {
            "match": False,
            "similarity": 0.0,
            "source_url": None,
            "candidate_image": None,
            "candidates": [],
            "file_hash": None,
            "blockchain": None,
            "blockchain_verification": None,
            "message": "No usable face match found."
        }

    # Convert candidate image URLs into backend-proxied URLs
    for candidate in result.get("candidates", []):
        image_url = candidate.get("image")

        if image_url:
            candidate["image"] = (
                f"{BACKEND_PUBLIC_URL}/proxy-image"
                f"?url={quote(image_url, safe='')}"
            )

    # Convert primary candidate image URL
    # into a backend-proxied URL
    if result.get("candidate_image"):
        result["candidate_image"] = (
            f"{BACKEND_PUBLIC_URL}/proxy-image"
            f"?url={quote(result['candidate_image'], safe='')}"
        )

    return result
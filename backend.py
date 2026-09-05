from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pathlib import Path
from urllib.parse import urlparse, quote
import shutil
import requests

from app import main


app = FastAPI()


# =========================================================
# BACKEND PUBLIC URL
# =========================================================

BACKEND_PUBLIC_URL = "https://jhalak-ai.onrender.com"


# =========================================================
# ALLOWED IMAGE HOSTS
# =========================================================

ALLOWED_IMAGE_HOSTS = {
    # Google / Google Lens
    "encrypted-tbn0.gstatic.com",
    "encrypted-tbn1.gstatic.com",
    "encrypted-tbn2.gstatic.com",
    "encrypted-tbn3.gstatic.com",
    "lh3.googleusercontent.com",
    "googleusercontent.com",

    # SerpApi / search image hosts
    "serpapi.com",

    # Common public image/CDN hosts
    "images.unsplash.com",
    "i.imgur.com",

    # Facebook / Instagram CDN
    "instagram.com",
    "www.instagram.com",
    "cdninstagram.com",
    "www.cdninstagram.com",
    "fbcdn.net",
    "scontent.xx.fbcdn.net",

    # X / Twitter image CDN
    "pbs.twimg.com",
}


def is_allowed_image_host(hostname: str) -> bool:
    """
    Check whether an image hostname is from an allowed
    public image/CDN provider.
    """

    if not hostname:
        return False

    hostname = hostname.lower().rstrip(".")

    # Exact hosts
    if hostname in ALLOWED_IMAGE_HOSTS:
        return True

    # Google subdomains
    if hostname.endswith(".googleusercontent.com"):
        return True

    if hostname.endswith(".gstatic.com"):
        return True

    # Instagram / Facebook CDN subdomains
    if hostname.endswith(".cdninstagram.com"):
        return True

    if hostname.endswith(".fbcdn.net"):
        return True

    # Twitter image CDN
    if hostname.endswith(".twimg.com"):
        return True

    return False


# =========================================================
# CORS
# =========================================================

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


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def home():
    return {
        "message": "FaceChain Verify Backend is running"
    }


# =========================================================
# IMAGE PROXY
# =========================================================

@app.get("/proxy-image")
def proxy_image(url: str):

    if not url:
        raise HTTPException(
            status_code=400,
            detail="Image URL is required."
        )

    # -----------------------------------------------------
    # Validate original URL
    # -----------------------------------------------------

    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid image URL scheme."
        )

    original_host = parsed.hostname

    if not is_allowed_image_host(original_host):
        raise HTTPException(
            status_code=400,
            detail=f"Image host is not allowed: {original_host}"
        )

    # -----------------------------------------------------
    # Request headers
    # -----------------------------------------------------

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "image/avif,image/webp,image/apng,"
            "image/svg+xml,image/*,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }

    try:

        # -------------------------------------------------
        # Fetch image
        # -------------------------------------------------

        response = requests.get(
            url,
            headers=headers,
            timeout=30,
            allow_redirects=True,
        )

        response.raise_for_status()

        # -------------------------------------------------
        # Check final redirected host
        # -------------------------------------------------

        final_url = response.url
        final_parsed = urlparse(final_url)
        final_host = final_parsed.hostname

        if not is_allowed_image_host(final_host):
            raise HTTPException(
                status_code=400,
                detail=f"Redirected image host is not allowed: {final_host}"
            )

        # -------------------------------------------------
        # Validate content type
        # -------------------------------------------------

        content_type = response.headers.get(
            "content-type",
            ""
        ).split(";")[0].strip().lower()

        allowed_content_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
        }

        if content_type not in allowed_content_types:

            # Some CDNs don't return a proper content-type.
            # Let the browser treat it as JPEG only if
            # the response actually contains data.
            if not response.content:
                raise HTTPException(
                    status_code=502,
                    detail="Image response was empty."
                )

            content_type = "image/jpeg"

        # -------------------------------------------------
        # Return image to frontend
        # -------------------------------------------------

        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        )

    except HTTPException:
        raise

    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch candidate image: {error}"
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image proxy error: {error}"
        )


# =========================================================
# VERIFY FACE
# =========================================================

@app.post("/verify")
async def verify_face(file: UploadFile = File(...)):

    # -----------------------------------------------------
    # Validate file
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    # -----------------------------------------------------
    # Save uploaded file
    # -----------------------------------------------------

    safe_filename = Path(file.filename).name

    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    print(f"Uploaded file: {file_path}")

    # -----------------------------------------------------
    # Run complete verification pipeline
    # -----------------------------------------------------

    try:

        result = main(file_path)

    except Exception as error:

        print("Verification pipeline failed:")
        print(error)

        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {error}"
        )

    # -----------------------------------------------------
    # No usable candidate
    # -----------------------------------------------------

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

    # =====================================================
    # CONVERT CANDIDATE IMAGES TO BACKEND PROXY URL
    # =====================================================

    candidates = result.get("candidates", [])

    for candidate in candidates:

        image_url = candidate.get("image")

        if not image_url:
            continue

        image_url = str(image_url).strip()

        # Don't proxy an already-proxied URL again
        if image_url.startswith(
            f"{BACKEND_PUBLIC_URL}/proxy-image"
        ):
            candidate["image"] = image_url

        else:
            candidate["image"] = (
                f"{BACKEND_PUBLIC_URL}/proxy-image"
                f"?url={quote(image_url, safe='')}"
            )

    # =====================================================
    # PRIMARY CANDIDATE IMAGE
    # =====================================================

    candidate_image = result.get("candidate_image")

    if candidate_image:

        candidate_image = str(candidate_image).strip()

        # Avoid double proxy
        if candidate_image.startswith(
            f"{BACKEND_PUBLIC_URL}/proxy-image"
        ):
            result["candidate_image"] = candidate_image

        else:
            result["candidate_image"] = (
                f"{BACKEND_PUBLIC_URL}/proxy-image"
                f"?url={quote(candidate_image, safe='')}"
            )

    # -----------------------------------------------------
    # Debug information
    # -----------------------------------------------------

    print("\n========== IMAGE DEBUG ==========")

    print(
        "Primary candidate image:",
        result.get("candidate_image")
    )

    print(
        "Candidate count:",
        len(candidates)
    )

    for index, candidate in enumerate(
        candidates,
        start=1
    ):
        print(
            f"Candidate #{index}:",
            candidate.get("image")
        )

    print("=================================\n")

    return result
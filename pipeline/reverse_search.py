import os
import requests
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO


load_dotenv()


class ReverseImageSearcher:

    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")

        if not self.api_key:
            raise ValueError("SERPAPI_KEY not found in .env")

    # -----------------------------------
    # UPLOAD IMAGE TO SERPAPI
    # -----------------------------------

    def upload_image(self, image_path):

        url = "https://serpapi.com/image"

        # Open uploaded image
        image = Image.open(image_path)

        # Convert to RGB for JPEG
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize large images from phone/camera
        max_size = 1600

        image.thumbnail(
            (max_size, max_size),
            Image.LANCZOS
        )

        # Compress image in memory
        quality = 85

        while True:

            buffer = BytesIO()

            image.save(
                buffer,
                format="JPEG",
                quality=quality,
                optimize=True
            )

            image_size_kb = buffer.tell() / 1024

            print(
                f"Prepared upload image: "
                f"{image_size_kb:.1f} KB "
                f"(quality={quality})"
            )

            # Keep image safely below upload limit
            if image_size_kb <= 450 or quality <= 40:
                break

            quality -= 5

        buffer.seek(0)

        print("Uploading compressed image to SerpApi...")

        # Upload JPEG image
        response = requests.post(
            url,
            params={
                "api_key": self.api_key
            },
            files={
                "image": (
                    "face.jpg",
                    buffer,
                    "image/jpeg"
                )
            },
            timeout=60
        )

        response.raise_for_status()

        data = response.json()

        if "image_id" not in data:
            raise ValueError(
                f"Image upload failed: {data}"
            )

        return data["image_id"]

    # -----------------------------------
    # GOOGLE LENS SEARCH
    # -----------------------------------

    def search(self, image_id):

        url = "https://serpapi.com/search.json"

        params = {
            "engine": "google_lens",
            "image_id": image_id,
            "api_key": self.api_key
        }

        response = requests.get(
            url,
            params=params,
            timeout=60
        )

        response.raise_for_status()

        return response.json()

    # -----------------------------------
    # COMPLETE IMAGE SEARCH
    # -----------------------------------

    def search_image(self, image_path):

        print(
            "Uploading image to reverse image search..."
        )

        image_id = self.upload_image(
            image_path
        )

        print(
            "Image uploaded successfully."
        )

        print(
            "Searching Google Lens..."
        )

        results = self.search(
            image_id
        )

        print(
            "Google Lens search completed."
        )

        # Debug information
        exact_count = len(
            results.get(
                "exact_matches",
                []
            )
        )

        visual_count = len(
            results.get(
                "visual_matches",
                []
            )
        )

        print(
            f"Google Lens results: "
            f"{exact_count} exact matches, "
            f"{visual_count} visual matches"
        )

        return results

    # -----------------------------------
    # DETECT PLATFORM
    # -----------------------------------

    def detect_platform(self, link):

        link_lower = link.lower()

        if "instagram.com" in link_lower:
            return "Instagram"

        elif "facebook.com" in link_lower:
            return "Facebook"

        elif "linkedin.com" in link_lower:
            return "LinkedIn"

        elif "github.com" in link_lower:
            return "GitHub"

        elif "twitter.com" in link_lower:
            return "Twitter"

        elif "x.com" in link_lower:
            return "X"

        return "Web"

    # -----------------------------------
    # CHECK SUPPORTED PUBLIC PLATFORMS
    # -----------------------------------

    def is_supported_platform(self, link):

        social_domains = [
            "instagram.com",
            "facebook.com",
            "linkedin.com",
            "github.com",
            "x.com",
            "twitter.com"
        ]

        link_lower = link.lower()

        return any(
            domain in link_lower
            for domain in social_domains
        )

    # -----------------------------------
    # FIND PUBLIC WEB / SOCIAL RESULTS
    # -----------------------------------

    def find_social_results(self, results):

        social_results = []

        # Keep track of links so the same
        # result is not added twice.
        seen_links = set()

        # -----------------------------------
        # 1. EXACT MATCHES
        # -----------------------------------

        exact_matches = results.get(
            "exact_matches",
            []
        )

        for result in exact_matches:

            link = result.get(
                "link",
                ""
            )

            if not link:
                continue

            if not self.is_supported_platform(
                link
            ):
                continue

            link_key = link.rstrip(
                "/"
            ).lower()

            if link_key in seen_links:
                continue

            # Exact match normally provides
            # a thumbnail rather than a full
            # image URL.
            image_url = result.get(
                "image"
            )

            thumbnail_url = result.get(
                "thumbnail"
            )

            if not image_url and not thumbnail_url:
                continue

            seen_links.add(
                link_key
            )

            social_results.append({

                "title": result.get(
                    "title",
                    "Unknown"
                ),

                "link": link,

                "image": image_url,

                "thumbnail": thumbnail_url,

                "source": result.get(
                    "source",
                    "Unknown"
                ),

                "platform": self.detect_platform(
                    link
                ),

                "match_type": "Exact Match",

                "google_position": result.get(
                    "position"
                )
            })

        # -----------------------------------
        # 2. VISUAL MATCHES
        # -----------------------------------

        visual_matches = results.get(
            "visual_matches",
            []
        )

        for result in visual_matches:

            link = result.get(
                "link",
                ""
            )

            if not link:
                continue

            if not self.is_supported_platform(
                link
            ):
                continue

            link_key = link.rstrip(
                "/"
            ).lower()

            # Do not add duplicate links
            if link_key in seen_links:
                continue

            image_url = result.get(
                "image"
            )

            thumbnail_url = result.get(
                "thumbnail"
            )

            if not image_url and not thumbnail_url:
                continue

            seen_links.add(
                link_key
            )

            # Google Lens can indicate that
            # a visual result has an exact match.
            lens_exact_flag = result.get(
                "exact_matches",
                False
            )

            if lens_exact_flag:
                match_type = "Exact Match"
            else:
                match_type = "Visual Match"

            social_results.append({

                "title": result.get(
                    "title",
                    "Unknown"
                ),

                "link": link,

                "image": image_url,

                "thumbnail": thumbnail_url,

                "source": result.get(
                    "source",
                    "Unknown"
                ),

                "platform": self.detect_platform(
                    link
                ),

                "match_type": match_type,

                "google_position": result.get(
                    "position"
                )
            })

        # -----------------------------------
        # EXACT MATCHES FIRST
        # -----------------------------------

        social_results.sort(
            key=lambda result: (
                0
                if result.get(
                    "match_type"
                ) == "Exact Match"
                else 1,
                result.get(
                    "google_position"
                )
                or 999
            )
        )

        print(
            f"Public social/web matches found: "
            f"{len(social_results)}"
        )

        for index, result in enumerate(
            social_results,
            start=1
        ):

            print(
                f"{index}. "
                f"[{result.get('match_type')}] "
                f"{result.get('platform')} - "
                f"{result.get('title')}"
            )
        MAX_CANDIDATES = 5
        social_results = social_results[:MAX_CANDIDATES]
        return social_results

    # -----------------------------------
    # DOWNLOAD & VALIDATE IMAGE
    # -----------------------------------

    def download_image(
        self,
        image_url,
        save_path,
        fallback_url=None
    ):

        urls_to_try = []

        if image_url:
            urls_to_try.append(
                image_url
            )

        if fallback_url:
            urls_to_try.append(
                fallback_url
            )

        if not urls_to_try:
            raise ValueError(
                "No candidate image URL available."
            )

        headers = {
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "Chrome/131.0 Safari/537.36"
            ),

            "Accept": (
                "image/avif,image/webp,"
                "image/apng,image/svg+xml,"
                "image/*,*/*;q=0.8"
            )
        }

        for index, url in enumerate(
            urls_to_try
        ):

            try:

                print(
                    "Downloading candidate image "
                    f"(attempt {index + 1})..."
                )

                response = requests.get(
                    url,
                    headers=headers,
                    timeout=30
                )

                response.raise_for_status()

                # Check downloaded content
                # is actually an image
                image = Image.open(
                    BytesIO(
                        response.content
                    )
                )

                image.verify()

                # Re-open after verification
                image = Image.open(
                    BytesIO(
                        response.content
                    )
                )

                # Convert to RGB
                if image.mode not in (
                    "RGB",
                    "L"
                ):

                    image = image.convert(
                        "RGB"
                    )

                # Save as JPEG
                image.save(
                    save_path,
                    format="JPEG"
                )

                print(
                    "Candidate image saved to: "
                    f"{save_path}"
                )

                return save_path

            except Exception as error:

                print(
                    "⚠️ Could not download "
                    f"this image: {error}"
                )

                continue

        raise ValueError(
            "Could not download a valid "
            "candidate image from the "
            "available image URLs."
        )
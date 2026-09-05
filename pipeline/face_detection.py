from insightface.app import FaceAnalysis
import cv2
import gc


class FaceDetector:
    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_sc",
            providers=["CPUExecutionProvider"],
            allowed_modules=["detection", "recognition"]
        )

        # Larger detection size helps with small faces
        self.app.prepare(
            ctx_id=-1,
            det_size=(640, 640)
        )

    def _detect(self, image):
        """
        Run InsightFace detection on an image.
        """
        if image is None:
            return []

        return self.app.get(image)

    def detect(self, image_path):
        image = cv2.imread(image_path)

        if image is None:
            raise ValueError(
                f"Could not read image: {image_path}"
            )

        original_height, original_width = image.shape[:2]

        # -----------------------------------
        # 1. NORMAL DETECTION
        # -----------------------------------

        faces = self._detect(image)

        # -----------------------------------
        # 2. UPSCALE SMALL IMAGES
        # -----------------------------------

        if not faces:

            scale = 2.0

            upscaled = cv2.resize(
                image,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

            print(
                "No face detected at original size. "
                "Trying 2x upscaled image..."
            )

            upscaled_faces = self._detect(upscaled)

            if upscaled_faces:

                for face in upscaled_faces:

                    face.bbox = face.bbox / scale

                    if hasattr(face, "kps") and face.kps is not None:
                        face.kps = face.kps / scale

                faces = upscaled_faces

            del upscaled

        # -----------------------------------
        # 3. SECOND UPSCALE
        # -----------------------------------

        if not faces:

            scale = 3.0

            upscaled = cv2.resize(
                image,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

            print(
                "No face detected at 2x. "
                "Trying 3x upscaled image..."
            )

            upscaled_faces = self._detect(upscaled)

            if upscaled_faces:

                for face in upscaled_faces:

                    face.bbox = face.bbox / scale

                    if hasattr(face, "kps") and face.kps is not None:
                        face.kps = face.kps / scale

                faces = upscaled_faces

            del upscaled

        # -----------------------------------
        # 4. FINAL RESULT
        # -----------------------------------

        print(
            f"Face detection completed: "
            f"{len(faces)} face(s) detected"
        )

        del image
        gc.collect()

        return faces
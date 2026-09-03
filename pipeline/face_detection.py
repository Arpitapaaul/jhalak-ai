from insightface.app import FaceAnalysis
import cv2


class FaceDetector:
    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_s",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(ctx_id=-1)

    def detect(self, image_path):
        image = cv2.imread(image_path)

        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        faces = self.app.get(image)

        return faces
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

        # Smaller input size = lower CPU/memory usage
        self.app.prepare(
            ctx_id=-1,
            det_size=(320, 320)
        )

    def detect(self, image_path):
        image = cv2.imread(image_path)

        if image is None:
            raise ValueError(f"Could not read image: {image_path}")

        faces = self.app.get(image)

        # Release temporary OpenCV image memory
        del image
        gc.collect()

        return faces
import numpy as np


class FaceMatcher:

    # -----------------------------------
    # COSINE SIMILARITY
    # -----------------------------------

    @staticmethod
    def cosine_similarity(embedding1, embedding2):

        embedding1 = np.asarray(
            embedding1,
            dtype=np.float32
        )

        embedding2 = np.asarray(
            embedding2,
            dtype=np.float32
        )

        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        # Avoid division by zero
        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = np.dot(
            embedding1,
            embedding2
        ) / (norm1 * norm2)

        # Keep score in a safe range
        similarity = float(
            np.clip(similarity, 0.0, 1.0)
        )

        return similarity

    # -----------------------------------
    # COMPARE TWO FACES
    # -----------------------------------

    @staticmethod
    def compare(input_face, candidate_face):

        if input_face is None:
            return 0.0

        if candidate_face is None:
            return 0.0

        if not hasattr(input_face, "embedding"):
            return 0.0

        if not hasattr(candidate_face, "embedding"):
            return 0.0

        if input_face.embedding is None:
            return 0.0

        if candidate_face.embedding is None:
            return 0.0

        return FaceMatcher.cosine_similarity(
            input_face.embedding,
            candidate_face.embedding
        )

    # -----------------------------------
    # COMPARE AGAINST ALL FACES
    # -----------------------------------

    @staticmethod
    def compare_all(input_face, candidate_faces):

        if input_face is None:
            return {
                "score": 0.0,
                "face_index": None
            }

        if not candidate_faces:
            return {
                "score": 0.0,
                "face_index": None
            }

        best_score = 0.0
        best_index = None

        for index, candidate_face in enumerate(
            candidate_faces
        ):

            score = FaceMatcher.compare(
                input_face,
                candidate_face
            )

            if score > best_score:
                best_score = score
                best_index = index

        return {
            "score": best_score,
            "face_index": best_index
        }

    # -----------------------------------
    # MATCH CHECK
    # -----------------------------------

    @staticmethod
    def is_match(
        score,
        threshold=0.57
    ):

        return float(score) >= float(threshold)
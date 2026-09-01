import numpy as np


class FaceMatcher:

    @staticmethod
    def cosine_similarity(embedding1, embedding2):

        embedding1 = np.asarray(embedding1)
        embedding2 = np.asarray(embedding2)

        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) *
            np.linalg.norm(embedding2)
        )

        return float(similarity)

    @staticmethod
    def compare(input_face, candidate_face):

        score = FaceMatcher.cosine_similarity(
            input_face.embedding,
            candidate_face.embedding
        )

        return score

    @staticmethod
    def is_match(score, threshold=0.50):

        return score >= threshold
"""
Semantic Duplicate Detection — SamadhanX
=========================================
Detects potential duplicate challenges using sentence-transformer embeddings
and cosine similarity. Only compares within the same category + district
(same wording in a different district is NOT a duplicate).

Usage:
    from challenges.duplicate_detection import detect_duplicates
    detect_duplicates(challenge)   # call after challenge creation & AI pipeline
"""

import logging

import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Lazy-loaded model singleton ──────────────────────────────────────────────
_embedding_model = None


def get_embedding_model():
    """
    Lazy-load the sentence-transformer model.
    Loaded once per process — subsequent calls return the cached instance.
    Model: all-MiniLM-L6-v2 (~80 MB, CPU-friendly, 384-dim embeddings).
    """
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading sentence-transformer model 'all-MiniLM-L6-v2'...")
        from sentence_transformers import SentenceTransformer
        import os
        try:
            os.environ['HF_HUB_OFFLINE'] = '1'
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
        except Exception:
            os.environ['HF_HUB_OFFLINE'] = '0'
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            os.environ['HF_HUB_OFFLINE'] = '1'
        logger.info("Sentence-transformer model loaded successfully.")
    return _embedding_model


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 384-dimensional embedding vector for the given text.
    Returns a plain Python list of floats (JSON-serializable for storage).
    """
    model = get_embedding_model()
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    Returns a float in [-1, 1]; higher = more similar.
    """
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def detect_duplicates(challenge) -> int:
    """
    Main entry point: generate embedding for a challenge and compare against
    existing challenges with the SAME category AND district.

    Creates DuplicateFlag records for any pair exceeding SIMILARITY_THRESHOLD.

    Returns the number of duplicate flags created.
    Never raises — all errors are caught and logged.
    """
    from .models import Challenge, DuplicateFlag

    flags_created = 0
    threshold = getattr(settings, 'SIMILARITY_THRESHOLD', 0.80)

    try:
        # 1. Generate embedding from title + description for richer signal
        text = f"{challenge.title}. {challenge.description}"
        embedding = generate_embedding(text)

        # 2. Save embedding on the challenge
        Challenge.objects.filter(pk=challenge.pk).update(embedding=embedding)
        challenge.embedding = embedding  # keep in-memory copy in sync

        # 3. Find candidates: same category + same district, with embeddings, excluding self
        if not challenge.category_id or not challenge.district_id:
            logger.info(
                "Challenge %s has no category or district — skipping duplicate detection.",
                challenge.pk,
            )
            return 0

        candidates = Challenge.objects.filter(
            category_id=challenge.category_id,
            district_id=challenge.district_id,
            embedding__isnull=False,
        ).exclude(pk=challenge.pk).only('pk', 'embedding')

        # 4. Compare against each candidate
        for candidate in candidates:
            score = cosine_similarity(embedding, candidate.embedding)

            if score >= threshold:
                # Ensure consistent ordering to avoid duplicate flags (a,b) and (b,a)
                a_id = min(challenge.pk, candidate.pk)
                b_id = max(challenge.pk, candidate.pk)

                _, created = DuplicateFlag.objects.get_or_create(
                    challenge_a_id=a_id,
                    challenge_b_id=b_id,
                    defaults={
                        'similarity_score': round(score, 4),
                        'status': DuplicateFlag.STATUS_PENDING,
                    }
                )
                if created:
                    flags_created += 1
                    logger.info(
                        "Duplicate flag created: CHL-%05d ↔ CHL-%05d (score=%.4f)",
                        a_id, b_id, score,
                    )

        if flags_created:
            logger.info(
                "Duplicate detection for challenge %s: %d flag(s) created.",
                challenge.pk, flags_created,
            )
        else:
            logger.debug(
                "Duplicate detection for challenge %s: no duplicates found above threshold %.2f.",
                challenge.pk, threshold,
            )

    except Exception as exc:
        logger.error(
            "Duplicate detection failed for challenge %s: %s",
            challenge.pk, exc, exc_info=True,
        )

    return flags_created

"""
Problem-to-University Matching Engine.

Ranks universities by how well their declared expertise areas match a
submitted challenge, using sentence-transformer embeddings + cosine
similarity — real semantic vector matching, not keyword/exact-string
matching.

Reuses the same cached embedding model already loaded by
challenges.duplicate_detection (all-MiniLM-L6-v2), so this adds no new
dependency and no extra model-loading cost after the first request.

Because Feature #1 (Multilingual Problem Intake & Normalization) already
produces a clean English `normalized_description` for every challenge,
this engine always compares against consistent English text regardless
of what language the citizen originally wrote in.

FILE PATH: backend/universities/matching.py  (NEW FILE)
"""
import logging

logger = logging.getLogger(__name__)


def _challenge_text(challenge) -> str:
    """
    Builds the text representation of a challenge used for matching.
    Prefers the normalized (translated) English description when
    available; falls back to the raw description.
    """
    parts = [challenge.title or '']
    if getattr(challenge, 'normalized_description', ''):
        parts.append(challenge.normalized_description)
    else:
        parts.append(challenge.description or '')
    if challenge.category:
        parts.append(f'Category: {challenge.category.name}')
    return '. '.join(p for p in parts if p).strip()


def _university_text(university) -> str:
    """
    Builds the text representation of a university used for matching,
    from its declared expertise areas.
    """
    areas = list(university.expertise_areas.values_list('name', flat=True))
    if not areas:
        return ''
    return 'Expertise in: ' + ', '.join(areas)


def compute_university_matches(challenge, universities=None):
    """
    Returns a list of dicts: [{'university_id', 'score', 'reason'}, ...]
    sorted by score descending. `score` is 0-100.

    Falls back gracefully (flat baseline, never raises) if the embedding
    model can't be loaded (e.g. offline on first run before the model
    is cached) or a university has no expertise areas set.
    """
    from .models import University
    if universities is None:
        universities = University.objects.prefetch_related('expertise_areas').all()

    universities = list(universities)
    if not universities:
        return []

    challenge_text = _challenge_text(challenge)

    try:
        from challenges.duplicate_detection import generate_embedding, cosine_similarity
        challenge_vector = generate_embedding(challenge_text) if challenge_text else None
    except Exception as exc:
        logger.error('University matching: embedding model unavailable (%s). Falling back to baseline.', exc)
        challenge_vector = None

    results = []
    for uni in universities:
        uni_text = _university_text(uni)
        exact_category_match = (
            challenge.category and
            uni.expertise_areas.filter(name__iexact=challenge.category.name).exists()
        )

        if challenge_vector is not None and uni_text:
            try:
                uni_vector = generate_embedding(uni_text)
                similarity = cosine_similarity(challenge_vector, uni_vector)
                # Cosine similarity from sentence embeddings for related-but-not-identical
                # text typically lands in ~0.2-0.7; rescale so that range maps usefully
                # onto a 0-100 "relevance" score for admins instead of clustering low.
                score = round(max(0.0, min(1.0, (similarity + 0.1) / 0.75)) * 100)
            except Exception as exc:
                logger.error('University matching: embedding failed for university %s (%s).', uni.id, exc)
                score = 40
        else:
            score = 20 if not uni_text else 40

        if exact_category_match:
            score = max(score, 85)

        if exact_category_match:
            reason = f'Strong match — {challenge.category.name} listed directly in expertise areas.'
        elif score >= 70:
            reason = 'Strong match — expertise closely aligns with this problem.'
        elif score >= 40:
            reason = 'Moderate match — some overlapping expertise areas.'
        else:
            reason = 'Weak match — limited overlap with declared expertise.'

        results.append({
            'university_id': uni.id,
            'score': max(0, min(100, score)),
            'reason': reason,
        })

    return sorted(results, key=lambda r: r['score'], reverse=True)

"""
Priority Engine — SamadhanX
============================
Calculates an explainable priority score (0–100) for a civic Challenge
based on five weighted factors.

All weights and thresholds are configured here in ONE place.
No priority logic is scattered across the codebase.

Public API:
    calculate_priority(challenge) -> dict
"""

import logging

logger = logging.getLogger(__name__)

# ─── Configuration (change only here) ────────────────────────────────────────

# Factor weights (must sum to 1.0)
WEIGHTS = {
    'severity':            0.30,
    'frequency':           0.20,
    'validation_score':    0.15,
    'affected_population': 0.20,
    'urgency':             0.15,
}

# Score thresholds → priority level
THRESHOLDS = {
    'HIGH':   70,   # score >= 70
    'MEDIUM': 40,   # score >= 40
    # else LOW
}

# Default factor values (1–5) when not yet provided
DEFAULTS = {
    'severity':            3,
    'frequency':           3,
    'validation_score':    2,
    'affected_population': 3,
    'urgency':             3,
}

# Factor max value (denominator for normalisation)
FACTOR_MAX = 5

# ─── Urgency inference ───────────────────────────────────────────────────────

HIGH_URGENCY_KEYWORDS = [
    'urgent', 'emergency', 'critical', 'immediate', 'severe',
    'death', 'died', 'outbreak', 'epidemic', 'contaminated',
    'shortage', 'flood', 'disaster', 'collapsed', 'hazardous', 'unsafe',
]
MEDIUM_URGENCY_KEYWORDS = [
    'problem', 'issue', 'difficulty', 'lacking', 'inadequate',
    'poor', 'broken', 'damaged', 'missing', 'needed',
]

HIGH_POPULATION_KEYWORDS = [
    'thousand', 'hundreds', 'entire village', 'entire district',
    'multiple villages', 'many families', 'hundreds of',
    '500', '1000', '2000', 'school children', 'all residents',
]


def _infer_urgency(title: str, description: str) -> int:
    """Infer urgency score 1–5 from text."""
    text = f"{title} {description}".lower()
    high = sum(1 for kw in HIGH_URGENCY_KEYWORDS if kw in text)
    medium = sum(1 for kw in MEDIUM_URGENCY_KEYWORDS if kw in text)
    if high >= 3:
        return 5
    if high >= 2:
        return 4
    if high == 1 or medium >= 4:
        return 3
    if medium >= 2:
        return 2
    return 1


def _infer_affected_population(title: str, description: str) -> int:
    """Infer affected population scale 1–5 from text."""
    text = f"{title} {description}".lower()
    matches = sum(1 for kw in HIGH_POPULATION_KEYWORDS if kw in text)
    if matches >= 3:
        return 5
    if matches == 2:
        return 4
    if matches == 1:
        return 3
    # Check for any numbers
    import re
    numbers = re.findall(r'\b(\d+)\b', text)
    if numbers:
        max_num = max(int(n) for n in numbers if len(n) <= 6)
        if max_num >= 1000:
            return 5
        if max_num >= 500:
            return 4
        if max_num >= 100:
            return 3
        if max_num >= 10:
            return 2
    return 2


def _infer_validation(challenge, visual_evidence: str = "") -> int:
    """
    Infer validation score 1–5 from challenge attributes:
    - Has media evidence → higher
    - Has visual_evidence from AI indicating relevant info → much higher
    - Status beyond SUBMITTED → higher
    """
    score = 2  # baseline
    try:
        if challenge.media.exists():
            score += 1
            if visual_evidence and len(visual_evidence) > 10:
                # If AI found relevant observable evidence, boost score
                score += 1
    except Exception:
        pass
    if challenge.status in ('UNDER_REVIEW', 'ROUTED', 'IN_PROGRESS', 'COMPLETED'):
        score += 1
    if challenge.status in ('IN_PROGRESS', 'COMPLETED'):
        score += 1
    return min(score, 5)


def _score_to_level(score: float) -> str:
    if score >= THRESHOLDS['HIGH']:
        return 'HIGH'
    if score >= THRESHOLDS['MEDIUM']:
        return 'MEDIUM'
    return 'LOW'


def _build_reason(breakdown: dict, level: str, visual_evidence: str = "") -> str:
    """Generate a human-readable priority explanation."""
    parts = []
    s = breakdown.get('severity', 0)
    f = breakdown.get('frequency', 0)
    v = breakdown.get('validation_score', 0)
    a = breakdown.get('affected_population', 0)
    u = breakdown.get('urgency', 0)

    if s >= 4:
        parts.append("high severity impact")
    if a >= 4:
        parts.append("large affected population")
    if u >= 4:
        parts.append("urgent intervention required")
    if f >= 4:
        parts.append("recurring/frequent occurrence")
    if v >= 4:
        if visual_evidence and len(visual_evidence) > 10:
            parts.append("supported by valid visual photo evidence")
        else:
            parts.append("strong evidence validation")

    if not parts:
        if level == 'LOW':
            return "Limited severity, population impact and urgency indicators present."
        return "Moderate severity and impact indicators detected."

    reason_body = ", ".join(parts[:-1])
    if len(parts) > 1:
        reason_body = f"{reason_body} and {parts[-1]}"
    else:
        reason_body = parts[0]

    return f"{level.title()} priority: {reason_body.capitalize()}."


# ─── Public API ──────────────────────────────────────────────────────────────

def calculate_priority(challenge, visual_evidence: str = "") -> dict:
    """
    Calculate explainable priority for a Challenge instance.

    Uses challenge fields if already set, otherwise infers from text.

    Returns:
        {
            "priority_score": float (0–100),
            "priority_level": "LOW" | "MEDIUM" | "HIGH",
            "priority_breakdown": {factor: int (1–5), ...},
            "priority_reason": str,
        }
    """
    title = challenge.title or ""
    description = challenge.description or ""

    # Gather factor values — use stored fields if set, else infer
    breakdown = {}

    # Severity
    breakdown['severity'] = int(challenge.severity) if (
        hasattr(challenge, 'severity') and challenge.severity and challenge.severity > 0
    ) else DEFAULTS['severity']

    # Frequency
    breakdown['frequency'] = int(challenge.frequency) if (
        hasattr(challenge, 'frequency') and challenge.frequency and challenge.frequency > 0
    ) else DEFAULTS['frequency']

    # Validation — always inferred from challenge state
    breakdown['validation_score'] = _infer_validation(challenge, visual_evidence)

    # Affected population — infer from text if not stored
    breakdown['affected_population'] = int(challenge.affected_population) if (
        hasattr(challenge, 'affected_population') and
        challenge.affected_population and challenge.affected_population > 0
    ) else _infer_affected_population(title, description)

    # Urgency — infer from text
    breakdown['urgency'] = int(challenge.urgency) if (
        hasattr(challenge, 'urgency') and challenge.urgency and challenge.urgency > 0
    ) else _infer_urgency(title, description)

    # Weighted score (normalised 0–100)
    raw_score = sum(
        (breakdown[factor] / FACTOR_MAX) * weight
        for factor, weight in WEIGHTS.items()
    )
    priority_score = round(raw_score * 100, 1)
    priority_level = _score_to_level(priority_score)
    priority_reason = _build_reason(breakdown, priority_level, visual_evidence)

    logger.debug(
        "Priority calculated: score=%.1f level=%s breakdown=%s",
        priority_score, priority_level, breakdown,
    )

    return {
        "priority_score": priority_score,
        "priority_level": priority_level,
        "priority_breakdown": breakdown,
        "priority_reason": priority_reason,
    }

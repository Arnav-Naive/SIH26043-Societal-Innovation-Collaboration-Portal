"""
Keyword-based categorization service for civic challenges.
Returns category name, confidence score, and matched reason.
"""
from master_data.models import Category

def categorize_challenge(title: str, description: str) -> dict:
    """
    Analyse text and return category name with confidence score.
    Returns: {category, confidence, reason}
    """
    combined_text = f'{title} {description}'.lower()
    scores = {}

    # Fetch active categories from DB
    categories = Category.objects.filter(is_active=True)
    
    if not categories.exists():
        return {
            'category': None,
            'confidence': 0,
            'reason': 'No active categories found in database.',
        }

    for category in categories:
        keywords = category.keywords if isinstance(category.keywords, list) else []
        matched = [kw for kw in keywords if kw in combined_text]
        if matched:
            # Weight: unique matches relative to text richness
            score = min(len(matched) * 15, 95)
            scores[category.name] = (score, matched)

    if not scores:
        # Default to first category if no match
        default_cat = categories.first().name
        return {
            'category': default_cat,
            'confidence': 40,
            'reason': 'Default classification applied due to insufficient keyword matches.',
        }

    best_category = max(scores, key=lambda c: scores[c][0])
    score, matched_keywords = scores[best_category]

    reason = f"Matched {best_category.lower()}-related keywords: {', '.join(matched_keywords[:4])}."

    return {
        'category': best_category,
        'confidence': score,
        'reason': reason,
    }


def compute_priority(title: str, description: str, category: str) -> str:
    """
    Compute priority (LOW, MEDIUM, HIGH) based on urgency keywords and category.
    """
    combined_text = f'{title} {description}'.lower()

    high_keywords = [
        'urgent', 'emergency', 'critical', 'severe', 'immediate', 'death', 'died',
        'outbreak', 'epidemic', 'contaminated', 'shortage', 'no water', 'no road',
        'flood', 'disaster', 'accident', 'collapsed', 'hazardous', 'unsafe'
    ]
    medium_keywords = [
        'problem', 'issue', 'difficulty', 'lacking', 'inadequate', 'insufficient',
        'poor', 'bad', 'broken', 'damaged', 'missing', 'needed', 'required'
    ]

    high_count = sum(1 for kw in high_keywords if kw in combined_text)
    medium_count = sum(1 for kw in medium_keywords if kw in combined_text)

    # Certain categories default to higher priority
    if category in ('Health', 'Water') and high_count >= 1:
        return 'HIGH'
    if high_count >= 2:
        return 'HIGH'
    if high_count == 1 or medium_count >= 3:
        return 'MEDIUM'
    if medium_count >= 1:
        return 'MEDIUM'

    return 'LOW'

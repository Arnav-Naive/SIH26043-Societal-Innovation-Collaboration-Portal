"""
AI Classifier Service — SamadhanX
==================================
Classifies a civic challenge into a category using:
  1. Google Gemini (if AI_PROVIDER=gemini and GEMINI_API_KEY is set)
  2. Keyword-based fallback (existing categorizer.py logic)

The rest of the application calls ONLY:
    classify_challenge(title, description, district="")

and receives:
    {
        "category": "<Category name>",
        "confidence": 0.0–1.0,
        "reason": "<human-readable explanation>",
        "source": "ai" | "keyword" | "fallback"
    }

AI API keys are NEVER exposed to the frontend.
"""

import logging
import re
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Provider implementations ────────────────────────────────────────────────

def _classify_with_gemini(title: str, description: str, district: str, categories: list, image_paths: list = None) -> dict:
    """
    Calls Google Gemini to classify the challenge.
    Returns structured dict or raises an exception on failure.
    """
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("google-generativeai package not installed. Run: pip install google-generativeai")

    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in settings.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash'),
        generation_config={"temperature": 0.1, "max_output_tokens": 1024},
    )

    category_list = "\n".join(f"- {c}" for c in categories)
    
    has_images = bool(image_paths)
    photo_instruction = ""
    if has_images:
        photo_instruction = """
PHOTO EVIDENCE DETECTED:
Please also analyze the attached image(s). Only extract information that is visually observable in the image(s) (e.g., visible infrastructure damage, flooding, potholes). Do NOT invent facts. Include a 'visual_evidence' field summarizing what you observe relevant to the complaint.
"""

    prompt_text = f"""You are a government AI assistant classifying societal problems for the SamadhanX portal in India.

TASK: Classify the following civic problem into exactly ONE of the provided categories.

CATEGORIES:
{category_list}

PROBLEM TITLE: {title}
PROBLEM DESCRIPTION: {description}
LOCATION/DISTRICT: {district or 'Not specified'}
{photo_instruction}

Respond in this EXACT JSON format (no markdown, no extra text):
{{
  "category": "<one of the categories above>",
  "confidence": <number between 0.0 and 1.0>,
  "reason": "<1-2 sentence explanation of why this category was chosen based on text>",
  "visual_evidence": "<If images provided: 1-2 sentence summary of observable evidence. Else: empty string>"
}}"""

    prompt_contents = [prompt_text]
    
    if has_images:
        try:
            from PIL import Image
            for path in image_paths:
                import os
                if os.path.exists(path):
                    img = Image.open(path)
                    # Convert to RGB if needed
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    prompt_contents.append(img)
        except Exception as e:
            logger.warning("Failed to load images for AI classification: %s", e)
            # Continue with text only if images fail

    timeout = getattr(settings, 'AI_TIMEOUT_SECONDS', 15)
    response = model.generate_content(prompt_contents, request_options={"timeout": timeout})
    raw = response.text.strip()

    # Strip potential markdown code fences
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)

    import json
    data = json.loads(raw)

    # Validate structure
    if not all(k in data for k in ('category', 'confidence', 'reason')):
        raise ValueError(f"Gemini response missing required keys: {data}")

    # Normalise confidence to float
    confidence = float(data['confidence'])
    confidence = max(0.0, min(1.0, confidence))

    # Validate category is in our list (case-insensitive)
    matched_category = None
    for cat in categories:
        if cat.lower() == str(data['category']).lower():
            matched_category = cat
            break

    if not matched_category:
        # Try partial match
        for cat in categories:
            if cat.lower() in str(data['category']).lower():
                matched_category = cat
                break

    if not matched_category:
        raise ValueError(f"Gemini returned unknown category: {data['category']}")

    return {
        "category": matched_category,
        "confidence": confidence,
        "reason": str(data['reason'])[:1000],
        "visual_evidence": str(data.get('visual_evidence', ''))[:1000],
        "source": "ai",
    }


def _classify_with_keywords(title: str, description: str) -> dict:
    """
    Keyword-based fallback — reuses existing categorizer.py logic.
    Returns structured dict in same format.
    """
    from challenges.categorizer import categorize_challenge

    result = categorize_challenge(title, description)
    # existing categorizer returns confidence as integer percentage (0-100)
    raw_confidence = result.get('confidence', 0)
    confidence = round(raw_confidence / 100.0, 2) if raw_confidence > 1 else float(raw_confidence)

    return {
        "category": result.get('category'),
        "confidence": confidence,
        "reason": result.get('reason', 'Determined using keyword matching rules.'),
        "source": "keyword",
    }


# ─── Public API ──────────────────────────────────────────────────────────────

def classify_challenge(title: str, description: str, district: str = "", image_paths: list = None) -> dict:
    """
    Main entry point. Classifies a challenge using the configured AI provider
    with automatic fallback to keyword-based classification.

    Returns:
        {
            "category": str | None,
            "confidence": float (0.0–1.0),
            "reason": str,
            "visual_evidence": str,
            "source": "ai" | "keyword" | "fallback"
        }
    """
    # Load active category names from DB
    try:
        from master_data.models import Category
        categories = list(Category.objects.filter(is_active=True).values_list('name', flat=True))
    except Exception as exc:
        logger.warning("Could not load categories from DB: %s", exc)
        categories = []

    provider = getattr(settings, 'AI_PROVIDER', '').lower()

    # --- Attempt AI provider ---
    if provider == 'gemini' and categories:
        try:
            result = _classify_with_gemini(title, description, district, categories, image_paths)
            logger.info("AI classification successful: %s (%.2f)", result['category'], result['confidence'])
            return result
        except Exception as exc:
            logger.warning("Gemini classification failed (%s), falling back to keywords.", exc)

    # --- Keyword fallback ---
    try:
        result = _classify_with_keywords(title, description)
        logger.info("Keyword classification: %s", result['category'])
        return result
    except Exception as exc:
        logger.error("Keyword classification also failed: %s", exc)

    # --- Safe default fallback ---
    return {
        "category": categories[0] if categories else None,
        "confidence": 0.0,
        "reason": "AI classification unavailable; category could not be determined automatically.",
        "source": "fallback",
    }

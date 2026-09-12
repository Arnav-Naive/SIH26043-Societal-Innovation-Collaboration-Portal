import logging
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.db.models import Count

from .models import Challenge, ProblemTwin
from .duplicate_detection import generate_embedding, cosine_similarity

logger = logging.getLogger(__name__)

TWIN_SIMILARITY_THRESHOLD = getattr(settings, 'TWIN_SIMILARITY_THRESHOLD', 0.85)

def _generate_twin_metadata(challenges: list) -> dict:
    """Uses Gemini to generate a cohesive title and reasoning for a Problem Twin."""
    try:
        import google.generativeai as genai
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            return {
                "title": f"Civic Problem ({challenges[0].category.name})",
                "reasoning": "Automatically grouped based on high semantic similarity of reports.",
                "confidence": 0.85
            }

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash'),
            generation_config={"temperature": 0.2, "max_output_tokens": 1024},
        )

        texts = []
        for i, c in enumerate(challenges, 1):
            texts.append(f"Report {i}:\nTitle: {c.title}\nDesc: {c.description}\nLocation: {c.location}")

        combined = "\n\n".join(texts)

        prompt = f"""You are an AI grouping multiple similar citizen complaints into a single 'Problem Twin'.
Analyze the following reports which refer to the same underlying civic problem.

REPORTS:
{combined}

Respond in EXACT JSON format:
{{
  "title": "<A concise, descriptive title for the overall problem (max 10 words)>",
  "reasoning": "<1-2 sentence explanation of why these reports represent the exact same underlying problem, referencing common locations or symptoms>",
  "confidence": <float between 0.85 and 1.0 representing how certain you are they are the same issue>
}}"""
        timeout = getattr(settings, 'AI_TIMEOUT_SECONDS', 20)
        response = model.generate_content(prompt, request_options={"timeout": timeout})
        raw = response.text.strip()
        print("GEMINI RAW:", raw)
        
        import re, json
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        data = json.loads(raw)
        
        return {
            "title": data.get("title", f"Civic Problem ({challenges[0].category.name})")[:300],
            "reasoning": data.get("reasoning", "Automatically grouped based on high semantic similarity of reports."),
            "confidence": float(data.get("confidence", 0.85))
        }

    except Exception as e:
        logger.warning(f"Failed to generate twin metadata with Gemini: {e}")
        return {
            "title": f"Civic Problem ({challenges[0].category.name})",
            "reasoning": "Automatically grouped based on high semantic similarity.",
            "confidence": 0.85
        }

def _check_escalation(twin: ProblemTwin):
    """
    Check if the twin is escalating based on the number of linked reports
    and the rate of new reports coming in over time.
    """
    now = timezone.now()
    
    # 1. Trend-based check: Last 24h vs the 6 days before that
    recent_start = now - timedelta(days=1)
    prior_start = now - timedelta(days=7)
    
    recent_reports = twin.linked_challenges.filter(created_at__gte=recent_start).count()
    prior_reports = twin.linked_challenges.filter(created_at__gte=prior_start, created_at__lt=recent_start).count()
    
    recent_rate = recent_reports / 1.0  # Daily rate in last 1 day
    prior_rate = prior_reports / 6.0    # Daily rate in prior 6 days
    
    reason = None
    
    # Escalate if recent rate is 2x prior rate, and we have a meaningful volume (e.g. >= 3 recent)
    if prior_rate > 0 and recent_rate >= (prior_rate * 2) and recent_reports >= 3:
        if twin.risk_level != ProblemTwin.RISK_ESCALATED:
            twin.risk_level = ProblemTwin.RISK_ESCALATED
            twin.save(update_fields=['risk_level'])
        reason = f"Trend escalation: Recent daily report rate ({recent_rate:.1f}/day) is >= 2x the prior 6-day rate ({prior_rate:.1f}/day)."
        return reason

    # 2. Fallback static check
    report_count = twin.linked_challenges.count()
    if report_count >= 10:
        if twin.risk_level != ProblemTwin.RISK_ESCALATED:
            twin.risk_level = ProblemTwin.RISK_ESCALATED
            twin.save(update_fields=['risk_level'])
        reason = f"Static escalation: Total report count ({report_count}) reached threshold (10)."
        return reason
    elif report_count >= 5 and twin.risk_level == ProblemTwin.RISK_LOW:
        twin.risk_level = ProblemTwin.RISK_MEDIUM
        twin.save(update_fields=['risk_level'])
        reason = f"Static upgrade: Medium risk reached ({report_count} reports)."
        return reason
        
    return None


def detect_problem_twin(challenge: Challenge):
    """
    Detects if the given challenge belongs to an existing ProblemTwin, 
    or forms a new ProblemTwin with an existing challenge.
    """
    if not challenge.category_id or not challenge.district_id:
        return

    try:
        # Generate embedding if not present
        if not challenge.embedding:
            text = f"{challenge.title}. {challenge.description}"
            challenge.embedding = generate_embedding(text)
            Challenge.objects.filter(pk=challenge.pk).update(embedding=challenge.embedding)

        # Find candidates in the same category & district
        candidates = Challenge.objects.filter(
            category_id=challenge.category_id,
            district_id=challenge.district_id,
            embedding__isnull=False
        ).exclude(pk=challenge.pk).only('pk', 'embedding', 'problem_twin_id')

        best_match = None
        highest_score = 0.0

        for candidate in candidates:
            score = cosine_similarity(challenge.embedding, candidate.embedding)
            if score > highest_score:
                highest_score = score
                best_match = candidate

        if best_match and highest_score >= TWIN_SIMILARITY_THRESHOLD:
            logger.info(f"Twin detection: CHL-{challenge.pk} matched CHL-{best_match.pk} with score {highest_score:.2f}")
            
            # Fetch full candidate object
            best_match = Challenge.objects.get(pk=best_match.pk)
            
            if best_match.problem_twin:
                # Add to existing twin
                twin = best_match.problem_twin
                challenge.problem_twin = twin
                challenge.twin_association_status = Challenge.TWIN_STATUS_PENDING
                challenge.save(update_fields=['problem_twin', 'twin_association_status'])
                
                # Update twin dates
                twin.last_reported = timezone.now()
                twin.save(update_fields=['last_reported'])
                _check_escalation(twin)
                
            else:
                # Create a new Twin
                meta = _generate_twin_metadata([best_match, challenge])
                
                twin = ProblemTwin.objects.create(
                    title=meta['title'],
                    category=challenge.category,
                    district=challenge.district,
                    ai_confidence=meta['confidence'],
                    ai_reasoning=meta['reasoning'],
                    first_reported=min(best_match.created_at, challenge.created_at),
                    last_reported=max(best_match.created_at, challenge.created_at),
                )
                
                # Link both
                best_match.problem_twin = twin
                best_match.twin_association_status = Challenge.TWIN_STATUS_PENDING
                best_match.save(update_fields=['problem_twin', 'twin_association_status'])
                
                challenge.problem_twin = twin
                challenge.twin_association_status = Challenge.TWIN_STATUS_PENDING
                challenge.save(update_fields=['problem_twin', 'twin_association_status'])

    except Exception as exc:
        logger.error(f"Problem twin detection failed for challenge {challenge.pk}: {exc}", exc_info=True)

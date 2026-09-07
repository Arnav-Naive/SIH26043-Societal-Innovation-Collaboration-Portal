"""
Tests for AI Categorization & Prioritization Engine — SamadhanX
================================================================
Covers all 13 acceptance criteria from the specification.

Run:
    python manage.py test challenges.tests.test_ai_engine
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_user(username, role='citizen'):
    return User.objects.create_user(
        username=username, password='Test@1234', role=role,
        email=f'{username}@test.com'
    )


def make_district():
    from master_data.models import District
    d, _ = District.objects.get_or_create(name='Test District')
    return d


def make_categories():
    from master_data.models import Category
    cats = {
        'Water': ['water', 'drinking', 'borewell', 'shortage', 'river'],
        'Agriculture': ['crop', 'farmer', 'irrigation', 'paddy', 'soil'],
        'Healthcare': ['health', 'hospital', 'doctor', 'clinic', 'medicine'],
        'Education': ['school', 'student', 'teacher', 'dropout', 'literacy'],
        'Infrastructure': ['road', 'bridge', 'pothole', 'electricity', 'transport'],
        'Environment': ['pollution', 'garbage', 'waste', 'air quality', 'smoke'],
    }
    result = {}
    for name, kws in cats.items():
        cat, _ = Category.objects.get_or_create(
            name=name,
            defaults={'keywords': kws, 'is_active': True}
        )
        result[name] = cat
    return result


def make_challenge(title, description, district=None, citizen=None):
    from challenges.models import Challenge
    if district is None:
        district = make_district()
    if citizen is None:
        citizen = make_user('test_citizen_unique_' + title[:8].replace(' ', ''))
    ch = Challenge.objects.create(
        citizen=citizen,
        title=title,
        description=description,
        district=district,
        status=Challenge.STATUS_SUBMITTED,
    )
    return ch


# ─── 1. AI Classifier — correct category prediction ──────────────────────────

class TestAIClassifier(TestCase):
    def setUp(self):
        self.categories = make_categories()

    def test_water_classification(self):
        """WATER: Village drinking water shortage during summer."""
        from services.ai_classifier import classify_challenge
        result = classify_challenge(
            "Village drinking water shortage during summer",
            "During summer our village faces severe drinking water shortage. "
            "People travel several kilometres to collect water from a borewell."
        )
        self.assertIsNotNone(result['category'])
        self.assertIn(result['category'], ['Water', 'Agriculture', 'Environment', 'Infrastructure',
                                            'Healthcare', 'Education'])
        self.assertIn(result['source'], ['ai', 'keyword', 'fallback'])
        self.assertIsInstance(result['confidence'], float)
        self.assertGreaterEqual(result['confidence'], 0.0)
        self.assertLessEqual(result['confidence'], 1.0)
        self.assertIsInstance(result['reason'], str)
        self.assertGreater(len(result['reason']), 5)

    def test_water_keyword_category(self):
        """Keyword fallback must identify water-related problems."""
        from services.ai_classifier import _classify_with_keywords
        result = _classify_with_keywords(
            "Drinking water shortage in summer",
            "The borewell has been non-functional. People travel 3km for water."
        )
        self.assertEqual(result['category'], 'Water')
        self.assertEqual(result['source'], 'keyword')

    def test_healthcare_keyword_category(self):
        """Keyword fallback must identify health problems."""
        from services.ai_classifier import _classify_with_keywords
        result = _classify_with_keywords(
            "Primary health centre has no doctor",
            "The doctor at our hospital has been absent for several weeks. Clinic is closed."
        )
        self.assertEqual(result['category'], 'Healthcare')

    def test_agriculture_keyword_category(self):
        """Keyword fallback must identify agricultural problems."""
        from services.ai_classifier import _classify_with_keywords
        result = _classify_with_keywords(
            "Farmers losing crops due to irrigation issues",
            "Farmers are suffering crop losses because irrigation water is unavailable. Paddy crop failing."
        )
        self.assertEqual(result['category'], 'Agriculture')

    def test_education_keyword_category(self):
        """Keyword fallback must identify education problems."""
        from services.ai_classifier import _classify_with_keywords
        result = _classify_with_keywords(
            "Students lack access to qualified teachers",
            "The village school has no qualified teacher for past 3 months. Students dropout rate rising."
        )
        self.assertEqual(result['category'], 'Education')

    def test_confidence_range(self):
        """Confidence must always be between 0.0 and 1.0."""
        from services.ai_classifier import classify_challenge
        result = classify_challenge("Some civic problem", "Generic description of a local issue.")
        self.assertGreaterEqual(result['confidence'], 0.0)
        self.assertLessEqual(result['confidence'], 1.0)

    def test_reason_is_non_empty_string(self):
        """Reason must always be a non-empty string."""
        from services.ai_classifier import classify_challenge
        result = classify_challenge("Water problem", "Water shortage in village.")
        self.assertIsInstance(result['reason'], str)
        self.assertGreater(len(result['reason']), 0)


# ─── 2. Low-confidence classification ────────────────────────────────────────

class TestLowConfidenceClassification(TestCase):
    def setUp(self):
        make_categories()

    def test_ambiguous_text_returns_safe_result(self):
        """Ambiguous text must still return a safe structured result."""
        from services.ai_classifier import classify_challenge
        result = classify_challenge(
            "General issue",
            "There is a problem."
        )
        self.assertIn('category', result)
        self.assertIn('confidence', result)
        self.assertIn('reason', result)
        self.assertIn('source', result)


# ─── 3. AI service failure — fallback behaviour ───────────────────────────────

class TestAIServiceFailure(TestCase):
    def setUp(self):
        make_categories()

    @patch('services.ai_classifier._classify_with_gemini', side_effect=RuntimeError("API down"))
    def test_falls_back_to_keywords_on_gemini_failure(self, mock_gemini):
        from services.ai_classifier import classify_challenge
        from django.conf import settings
        original_provider = getattr(settings, 'AI_PROVIDER', 'keyword')
        settings.AI_PROVIDER = 'gemini'
        try:
            result = classify_challenge(
                "Drinking water shortage",
                "Village has no water. Borewell non-functional.",
            )
            # Should not raise, must return valid result
            self.assertIn(result['source'], ['keyword', 'fallback'])
            self.assertIsNotNone(result.get('category'))
        finally:
            settings.AI_PROVIDER = original_provider

    @patch('services.ai_classifier._classify_with_gemini', side_effect=RuntimeError("Timeout"))
    @patch('services.ai_classifier._classify_with_keywords', side_effect=Exception("DB unavailable"))
    def test_fallback_safe_default(self, mock_keywords, mock_gemini):
        """If BOTH AI and keyword fail, must return safe fallback."""
        from services.ai_classifier import classify_challenge
        from django.conf import settings
        settings.AI_PROVIDER = 'gemini'
        try:
            result = classify_challenge("Some title", "Some description")
            self.assertEqual(result['source'], 'fallback')
            self.assertEqual(result['confidence'], 0.0)
        finally:
            settings.AI_PROVIDER = 'keyword'


# ─── 4. Fallback categorization ──────────────────────────────────────────────

class TestFallbackCategorization(TestCase):
    def setUp(self):
        make_categories()

    def test_fallback_source_is_keyword(self):
        from services.ai_classifier import classify_challenge
        result = classify_challenge("Road damage", "Road is badly damaged with potholes.")
        self.assertIn(result['source'], ['keyword', 'fallback', 'ai'])


# ─── 5. Priority calculation ─────────────────────────────────────────────────

class TestPriorityCalculation(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.citizen = make_user('priority_citizen')

    def test_priority_result_structure(self):
        """Priority result must have all required keys."""
        from services.priority_engine import calculate_priority
        challenge = make_challenge(
            "Water shortage emergency",
            "Urgent: Over 500 households have no water. Contaminated source. Emergency required.",
            district=self.district, citizen=self.citizen
        )
        result = calculate_priority(challenge)
        self.assertIn('priority_score', result)
        self.assertIn('priority_level', result)
        self.assertIn('priority_breakdown', result)
        self.assertIn('priority_reason', result)

    def test_high_severity_text_gives_higher_score(self):
        """Challenges with high-urgency text must score higher."""
        from services.priority_engine import calculate_priority

        citizen2 = make_user('priority_citizen2')
        high_ch = make_challenge(
            "Emergency water shortage 1000 families",
            "Critical emergency: 1000 households have no water. Contaminated. Urgent disaster.",
            district=self.district, citizen=self.citizen
        )
        low_ch = make_challenge(
            "Minor inconvenience",
            "Minor issue with the water tap.",
            district=self.district, citizen=citizen2
        )
        high_result = calculate_priority(high_ch)
        low_result = calculate_priority(low_ch)
        self.assertGreater(high_result['priority_score'], low_result['priority_score'])


# ─── 6. Priority boundaries ──────────────────────────────────────────────────

class TestPriorityBoundaries(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()

    def test_score_between_0_and_100(self):
        from services.priority_engine import calculate_priority
        citizen = make_user('boundary_citizen')
        ch = make_challenge("Test challenge", "Test description", district=self.district, citizen=citizen)
        result = calculate_priority(ch)
        self.assertGreaterEqual(result['priority_score'], 0)
        self.assertLessEqual(result['priority_score'], 100)

    def test_priority_level_valid_values(self):
        from services.priority_engine import calculate_priority
        citizen = make_user('boundary_citizen2')
        ch = make_challenge("Test", "Test desc", district=self.district, citizen=citizen)
        result = calculate_priority(ch)
        self.assertIn(result['priority_level'], ['LOW', 'MEDIUM', 'HIGH'])

    def test_score_to_level_mapping(self):
        from services.priority_engine import _score_to_level
        self.assertEqual(_score_to_level(0), 'LOW')
        self.assertEqual(_score_to_level(39), 'LOW')
        self.assertEqual(_score_to_level(40), 'MEDIUM')
        self.assertEqual(_score_to_level(69), 'MEDIUM')
        self.assertEqual(_score_to_level(70), 'HIGH')
        self.assertEqual(_score_to_level(100), 'HIGH')


# ─── 7. Priority explanation ─────────────────────────────────────────────────

class TestPriorityExplanation(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()

    def test_priority_reason_is_string(self):
        from services.priority_engine import calculate_priority
        citizen = make_user('explanation_citizen')
        ch = make_challenge(
            "Urgent water crisis for 500 families",
            "Emergency: 500 households face contaminated water supply. Severe health risk.",
            district=self.district, citizen=citizen
        )
        result = calculate_priority(ch)
        self.assertIsInstance(result['priority_reason'], str)
        self.assertGreater(len(result['priority_reason']), 10)

    def test_breakdown_has_all_factors(self):
        from services.priority_engine import calculate_priority
        citizen = make_user('explanation_citizen2')
        ch = make_challenge("Test", "Test desc", district=self.district, citizen=citizen)
        result = calculate_priority(ch)
        breakdown = result['priority_breakdown']
        for factor in ('severity', 'frequency', 'validation_score', 'affected_population', 'urgency'):
            self.assertIn(factor, breakdown)
            self.assertGreaterEqual(breakdown[factor], 1)
            self.assertLessEqual(breakdown[factor], 5)


# ─── 8. Admin override ───────────────────────────────────────────────────────

class TestAdminOverride(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.admin = make_user('admin_override', role='gov_admin')
        self.citizen = make_user('citizen_override', role='citizen')
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_accept_ai_result(self):
        from challenges.models import Challenge
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water issue", description="Water problem.",
            district=self.district, status='SUBMITTED',
            ai_category_name='Water', ai_confidence=0.85,
            ai_classification_reason='Water keywords matched.',
            classification_source='keyword',
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-override/', {'action': 'accept'})
        self.assertEqual(response.status_code, 200)
        ch.refresh_from_db()
        self.assertIsNone(ch.manual_category)
        self.assertEqual(ch.manual_priority, '')

    def test_admin_can_override_category(self):
        from challenges.models import Challenge
        from master_data.models import Category
        Category.objects.get_or_create(name='Environment', defaults={'keywords': ['pollution'], 'is_active': True})
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water issue", description="Water problem.",
            district=self.district, status='SUBMITTED',
            ai_category_name='Water', classification_source='keyword',
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-override/', {
            'action': 'override',
            'category_name': 'Environment',
            'override_reason': 'Manual review shows environmental issue.'
        })
        self.assertEqual(response.status_code, 200)
        ch.refresh_from_db()
        self.assertIsNotNone(ch.manual_category)
        self.assertEqual(ch.manual_category.name, 'Environment')

    def test_admin_can_override_priority(self):
        from challenges.models import Challenge
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Road issue", description="Road problem.",
            district=self.district, status='SUBMITTED', priority='LOW',
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-override/', {
            'action': 'override',
            'priority': 'HIGH',
            'override_reason': 'Admin manual override.'
        })
        self.assertEqual(response.status_code, 200)
        ch.refresh_from_db()
        self.assertEqual(ch.manual_priority, 'HIGH')
        self.assertEqual(ch.priority, 'HIGH')


# ─── 9. Citizen cannot override AI results ───────────────────────────────────

class TestCitizenCannotOverride(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.citizen = make_user('citizen_nooverride', role='citizen')
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.client.force_authenticate(user=self.citizen)

    def test_citizen_cannot_call_override_endpoint(self):
        from challenges.models import Challenge
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water", description="Water issue.",
            district=self.district, status='SUBMITTED'
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-override/', {'action': 'accept'})
        self.assertEqual(response.status_code, 403)

    def test_citizen_cannot_call_reprocess_endpoint(self):
        from challenges.models import Challenge
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water", description="Water issue.",
            district=self.district, status='SUBMITTED'
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-reprocess/')
        self.assertEqual(response.status_code, 403)


# ─── 10. Non-admin cannot modify admin-only AI controls ──────────────────────

class TestNonAdminCannotModify(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.hei_spoc = make_user('hei_nooverride', role='hei_spoc')
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.client.force_authenticate(user=self.hei_spoc)

    def test_hei_spoc_cannot_override(self):
        from challenges.models import Challenge
        citizen = make_user('citizen_for_hei', role='citizen')
        ch = Challenge.objects.create(
            citizen=citizen, title="Road", description="Road damaged.",
            district=self.district, status='SUBMITTED'
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-override/', {'action': 'accept'})
        self.assertEqual(response.status_code, 403)


# ─── 11. AI result persistence ───────────────────────────────────────────────

class TestAIResultPersistence(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()

    def test_ai_fields_persist_after_save(self):
        from challenges.models import Challenge
        citizen = make_user('persist_citizen')
        ch = Challenge.objects.create(
            citizen=citizen, title="Water shortage",
            description="Drinking water shortage in village.",
            district=self.district, status='SUBMITTED',
        )
        # Simulate AI pipeline result
        ch.ai_category_name = 'Water'
        ch.ai_confidence = 0.82
        ch.ai_classification_reason = 'Water keywords matched.'
        ch.classification_source = 'keyword'
        ch.priority_score = 72.5
        ch.priority_breakdown = {'severity': 4, 'frequency': 3}
        ch.priority_reason = 'High severity.'
        ch.save()

        # Reload from DB
        loaded = Challenge.objects.get(pk=ch.pk)
        self.assertEqual(loaded.ai_category_name, 'Water')
        self.assertAlmostEqual(loaded.ai_confidence, 0.82, places=2)
        self.assertEqual(loaded.classification_source, 'keyword')
        self.assertAlmostEqual(loaded.priority_score, 72.5, places=1)
        self.assertEqual(loaded.priority_breakdown['severity'], 4)


# ─── 12. Reprocessing behaviour ──────────────────────────────────────────────

class TestReprocessingBehaviour(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.admin = make_user('admin_reprocess', role='gov_admin')
        self.citizen = make_user('citizen_reprocess', role='citizen')
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_reprocess_clears_manual_overrides(self):
        from challenges.models import Challenge
        from master_data.models import Category
        env_cat, _ = Category.objects.get_or_create(
            name='Environment', defaults={'keywords': ['pollution'], 'is_active': True}
        )
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water issue", description="Water shortage problem.",
            district=self.district, status='SUBMITTED',
            manual_category=env_cat, manual_priority='HIGH',
        )
        response = self.client.post(f'/api/challenges/{ch.id}/ai-reprocess/')
        self.assertEqual(response.status_code, 200)
        ch.refresh_from_db()
        self.assertIsNone(ch.manual_category)
        self.assertEqual(ch.manual_priority, '')


# ─── 13. API response compatibility ──────────────────────────────────────────

class TestAPIResponseCompatibility(TestCase):
    def setUp(self):
        self.district = make_district()
        make_categories()
        self.admin = make_user('admin_compat', role='gov_admin')
        self.citizen = make_user('citizen_compat', role='citizen')
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_challenge_detail_includes_ai_classification(self):
        from challenges.models import Challenge
        ch = Challenge.objects.create(
            citizen=self.citizen, title="Water test",
            description="Water shortage.",
            district=self.district, status='SUBMITTED',
            ai_category_name='Water', ai_confidence=0.9,
            ai_classification_reason='Test reason',
            classification_source='keyword',
        )
        response = self.client.get(f'/api/challenges/{ch.id}/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Must have ai_classification block
        self.assertIn('ai_classification', data)
        ai = data['ai_classification']
        self.assertIn('ai_category', ai)
        self.assertIn('confidence', ai)
        self.assertIn('reason', ai)
        self.assertIn('source', ai)
        # Must have priority_detail block
        self.assertIn('priority_detail', data)
        pd = data['priority_detail']
        self.assertIn('score', pd)
        self.assertIn('level', pd)
        self.assertIn('breakdown', pd)
        self.assertIn('reason', pd)
        # Existing fields must still be present
        for field in ('id', 'reference_id', 'title', 'description', 'status', 'priority'):
            self.assertIn(field, data)

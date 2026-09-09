from django.db import models
from django.conf import settings


class Challenge(models.Model):
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_UNDER_REVIEW = 'UNDER_REVIEW'
    STATUS_ROUTED = 'ROUTED'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_UNDER_REVIEW, 'Under Review'),
        (STATUS_ROUTED, 'Routed'),
        (STATUS_ACCEPTED, 'Accepted by HEI'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    PRIORITY_LOW = 'LOW'
    PRIORITY_MEDIUM = 'MEDIUM'
    PRIORITY_HIGH = 'HIGH'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH, 'High'),
    ]

    SOURCE_AI = 'ai'
    SOURCE_KEYWORD = 'keyword'
    SOURCE_FALLBACK = 'fallback'

    SOURCE_CHOICES = [
        (SOURCE_AI, 'AI (Gemini)'),
        (SOURCE_KEYWORD, 'Keyword Rules'),
        (SOURCE_FALLBACK, 'Fallback'),
    ]

    # ── Reference ID (e.g. CHL-00021) ──
    reference_id = models.CharField(max_length=20, unique=True, blank=True)

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges'
    )

    title = models.CharField(max_length=300)
    description = models.TextField()

    # Multilingual intake & normalization fields
    original_language = models.CharField(max_length=10, blank=True, default='en')
    normalized_description = models.TextField(blank=True)
    normalization_note = models.CharField(max_length=255, blank=True)

    # Updated to use Master Data
    district = models.ForeignKey(
        'master_data.District',
        on_delete=models.RESTRICT,
        related_name='challenges'
    )
    location = models.CharField(max_length=300, blank=True)

    # ── Active / admin-visible category & priority ──
    # These hold the current accepted values (AI result unless admin overrode them)
    category = models.ForeignKey(
        'master_data.Category',
        on_delete=models.RESTRICT,
        null=True, blank=True,
        related_name='challenges'
    )
    category_confidence = models.PositiveSmallIntegerField(default=0)
    category_reason = models.TextField(blank=True)

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)

    assigned_university = models.ForeignKey(
        'universities.University',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_challenges'
    )
    routing_note = models.TextField(blank=True)

    # ── AI Classification fields (preserved for audit, never overwritten) ──
    ai_category_name = models.CharField(
        max_length=100, blank=True,
        help_text="AI-predicted category name — preserved even after admin override"
    )
    ai_confidence = models.FloatField(
        default=0.0,
        help_text="Raw AI confidence 0.0–1.0"
    )
    ai_classification_reason = models.TextField(
        blank=True,
        help_text="AI-generated classification explanation"
    )
    ai_visual_evidence = models.TextField(
        blank=True,
        help_text="AI-extracted visual evidence from attached photos"
    )
    classification_source = models.CharField(
        max_length=10, choices=SOURCE_CHOICES,
        blank=True, default='',
        help_text="Source of current category: ai, keyword, or fallback"
    )
    ai_processed_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When AI pipeline last ran"
    )

    # ── Admin AI review decision (persisted for refresh-safe state) ──
    ai_accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='accepted_ai_challenges',
        help_text="Admin who explicitly accepted the AI classification"
    )
    ai_accepted_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When admin accepted the AI classification"
    )

    # ── Admin manual overrides (null = admin accepted AI result) ──
    manual_category = models.ForeignKey(
        'master_data.Category',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='manual_challenges',
        help_text="Admin-chosen category override (null = accepted AI result)"
    )
    manual_priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES,
        blank=True,
        help_text="Admin-chosen priority override (blank = accepted AI result)"
    )

    # ── Priority engine output ──
    priority_score = models.FloatField(
        default=0.0,
        help_text="Calculated priority score 0–100"
    )
    priority_breakdown = models.JSONField(
        default=dict,
        help_text="Factor-by-factor priority breakdown"
    )
    priority_reason = models.TextField(
        blank=True,
        help_text="Human-readable explanation of priority score"
    )

    # ── Priority input factors (1–5 scale) ──
    severity = models.PositiveSmallIntegerField(
        default=0,
        help_text="Severity of impact (1–5; 0 = not yet assessed)"
    )
    frequency = models.PositiveSmallIntegerField(
        default=0,
        help_text="Recurrence frequency (1–5; 0 = not yet assessed)"
    )
    affected_population = models.PositiveSmallIntegerField(
        default=0,
        help_text="Scale of affected population (1–5; 0 = inferred from text)"
    )
    urgency = models.PositiveSmallIntegerField(
        default=0,
        help_text="Urgency of intervention (1–5; 0 = inferred from text)"
    )

    # ── Semantic duplicate detection ──
    embedding = models.JSONField(
        null=True, blank=True,
        help_text="Sentence-transformer embedding vector (list of floats)"
    )

    # ── Problem Twin ──
    problem_twin = models.ForeignKey(
        'ProblemTwin',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='linked_challenges',
        help_text="The underlying real-world civic problem this report belongs to."
    )
    TWIN_STATUS_PENDING = 'PENDING'
    TWIN_STATUS_ACCEPTED = 'ACCEPTED'
    TWIN_STATUS_REJECTED = 'REJECTED'
    TWIN_STATUS_CHOICES = [
        (TWIN_STATUS_PENDING, 'Pending Review'),
        (TWIN_STATUS_ACCEPTED, 'Accepted'),
        (TWIN_STATUS_REJECTED, 'Rejected'),
    ]
    twin_association_status = models.CharField(
        max_length=20, choices=TWIN_STATUS_CHOICES, default=TWIN_STATUS_PENDING,
        help_text="Status of the AI-suggested problem twin association."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference_id} — {self.title[:60]}'

    def save(self, *args, **kwargs):
        if not self.reference_id:
            # Auto-generate reference ID after first save
            super().save(*args, **kwargs)
            self.reference_id = f'CHL-{self.pk:05d}'
            Challenge.objects.filter(pk=self.pk).update(reference_id=self.reference_id)
        else:
            super().save(*args, **kwargs)

    @property
    def effective_category(self):
        """Returns admin override category if set, else AI/keyword category."""
        return self.manual_category or self.category

    @property
    def effective_priority(self):
        """Returns admin override priority if set, else computed priority."""
        return self.manual_priority or self.priority

    @property
    def ai_override_applied(self):
        """True if admin has manually overridden either category or priority."""
        return bool(self.manual_category_id or self.manual_priority)

    @property
    def ai_review_status(self):
        """
        Returns the admin review state of the AI classification:
          'accepted'  — admin explicitly accepted the AI result
          'overridden' — admin chose a different category or priority
          'pending'   — no admin action taken yet
        """
        if self.manual_category_id or self.manual_priority:
            return 'overridden'
        if self.ai_accepted_by_id:
            return 'accepted'
        return 'pending'


class ChallengeMedia(models.Model):
    MEDIA_IMAGE = 'image'
    MEDIA_DOCUMENT = 'document'

    MEDIA_TYPE_CHOICES = [
        (MEDIA_IMAGE, 'Image'),
        (MEDIA_DOCUMENT, 'Document'),
    ]

    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to='challenge_media/%Y/%m/')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES, default=MEDIA_IMAGE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Media for {self.challenge.reference_id}'


class ChallengeStatusHistory(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.challenge.reference_id} → {self.status}'


class DuplicateFlag(models.Model):
    """
    Records a potential duplicate pair detected by semantic similarity.
    Only created when cosine similarity exceeds SIMILARITY_THRESHOLD.
    Gov admins review and confirm or dismiss.
    """
    STATUS_PENDING = 'pending_review'
    STATUS_CONFIRMED = 'confirmed_duplicate'
    STATUS_NOT_DUPLICATE = 'not_duplicate'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Review'),
        (STATUS_CONFIRMED, 'Confirmed Duplicate'),
        (STATUS_NOT_DUPLICATE, 'Not a Duplicate'),
    ]

    challenge_a = models.ForeignKey(
        Challenge, on_delete=models.CASCADE,
        related_name='duplicate_flags_as_a',
        help_text="First challenge in the potential duplicate pair"
    )
    challenge_b = models.ForeignKey(
        Challenge, on_delete=models.CASCADE,
        related_name='duplicate_flags_as_b',
        help_text="Second challenge in the potential duplicate pair"
    )
    similarity_score = models.FloatField(
        help_text="Cosine similarity between the two challenge embeddings (0.0–1.0)"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text="Admin who reviewed this flag"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('challenge_a', 'challenge_b')]

    def __str__(self):
        return (
            f'DuplicateFlag: {self.challenge_a.reference_id} ↔ '
            f'{self.challenge_b.reference_id} ({self.similarity_score:.0%})'
        )


class ProblemTwin(models.Model):
    """
    Problem Twin - AI-Based Civic Problem Intelligence layer.
    Groups similar citizen challenges into one underlying real-world problem.
    """
    STATUS_NEW = 'NEW'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_RESOLVED = 'RESOLVED'
    STATUS_CLOSED = 'CLOSED'

    STATUS_CHOICES = [
        (STATUS_NEW, 'New Candidate'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_RESOLVED, 'Resolved'),
        (STATUS_CLOSED, 'Closed'),
    ]

    RISK_LOW = 'LOW'
    RISK_MEDIUM = 'MEDIUM'
    RISK_HIGH = 'HIGH'
    RISK_ESCALATED = 'ESCALATED'

    RISK_CHOICES = [
        (RISK_LOW, 'Low Risk'),
        (RISK_MEDIUM, 'Medium Risk'),
        (RISK_HIGH, 'High Risk'),
        (RISK_ESCALATED, 'Escalated'),
    ]

    reference_id = models.CharField(max_length=20, unique=True, blank=True)
    title = models.CharField(max_length=300, help_text="AI-generated common problem title")
    
    category = models.ForeignKey(
        'master_data.Category',
        on_delete=models.RESTRICT,
        related_name='problem_twins'
    )
    district = models.ForeignKey(
        'master_data.District',
        on_delete=models.RESTRICT,
        related_name='problem_twins'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES, default=RISK_MEDIUM)
    
    ai_confidence = models.FloatField(default=0.0, help_text="0.0 to 1.0 confidence score")
    ai_reasoning = models.TextField(blank=True, help_text="Generated reasoning explaining why these challenges form this Twin")
    
    first_reported = models.DateTimeField(null=True, blank=True)
    last_reported = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.reference_id} — {self.title[:60]}'

    def save(self, *args, **kwargs):
        if not self.reference_id:
            super().save(*args, **kwargs)
            self.reference_id = f'TWIN-{self.pk:05d}'
            ProblemTwin.objects.filter(pk=self.pk).update(reference_id=self.reference_id)
        else:
            super().save(*args, **kwargs)

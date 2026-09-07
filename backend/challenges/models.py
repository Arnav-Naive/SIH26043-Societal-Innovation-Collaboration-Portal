from django.db import models
from django.conf import settings


class Challenge(models.Model):
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_UNDER_REVIEW = 'UNDER_REVIEW'
    STATUS_ROUTED = 'ROUTED'
    STATUS_IN_PROGRESS = 'IN_PROGRESS'
    STATUS_COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_UNDER_REVIEW, 'Under Review'),
        (STATUS_ROUTED, 'Routed'),
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

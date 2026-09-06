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

    # Reference ID (e.g. CHL-00021)
    reference_id = models.CharField(max_length=20, unique=True, blank=True)

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges'
    )

    title = models.CharField(max_length=300)
    description = models.TextField()
    
    # Updated to use Master Data
    district = models.ForeignKey(
        'master_data.District',
        on_delete=models.RESTRICT,
        related_name='challenges'
    )
    location = models.CharField(max_length=300, blank=True)

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

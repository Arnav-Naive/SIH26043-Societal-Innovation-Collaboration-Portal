from django.db import models
from django.conf import settings


class IndustryPartner(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='industry_profile',
        limit_choices_to={'role': 'industry_partner'},
    )
    company_name = models.CharField(max_length=300)
    sector = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.company_name} ({self.user.username})'


class Partnership(models.Model):
    SUPPORT_MENTORSHIP = 'MENTORSHIP'
    SUPPORT_FUNDING = 'FUNDING'
    SUPPORT_PILOT = 'PILOT'
    SUPPORT_INFRASTRUCTURE = 'INFRASTRUCTURE'
    SUPPORT_OTHER = 'OTHER'

    SUPPORT_TYPE_CHOICES = [
        (SUPPORT_MENTORSHIP, 'Mentorship'),
        (SUPPORT_FUNDING, 'Funding'),
        (SUPPORT_PILOT, 'Pilot Support'),
        (SUPPORT_INFRASTRUCTURE, 'Infrastructure'),
        (SUPPORT_OTHER, 'Other'),
    ]

    STATUS_PENDING = 'PENDING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    project_team = models.ForeignKey(
        'universities.ProjectTeam',
        on_delete=models.CASCADE,
        related_name='partnerships'
    )
    industry_partner = models.ForeignKey(
        IndustryPartner,
        on_delete=models.CASCADE,
        related_name='partnerships'
    )
    support_type = models.CharField(max_length=20, choices=SUPPORT_TYPE_CHOICES)
    contribution_details = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.industry_partner.company_name} → {self.project_team}'

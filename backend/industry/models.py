"""FILE PATH: backend/industry/models.py  (REPLACE EXISTING FILE)"""
from django.db import models
from django.conf import settings


class IndustryPartner(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Verification'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    ORG_TYPE_STARTUP = 'STARTUP'
    ORG_TYPE_MSME = 'MSME'
    ORG_TYPE_COMPANY = 'COMPANY'
    ORG_TYPE_OTHER = 'OTHER'
    ORG_TYPE_CHOICES = [
        (ORG_TYPE_STARTUP, 'Startup'),
        (ORG_TYPE_MSME, 'MSME'),
        (ORG_TYPE_COMPANY, 'Company'),
        (ORG_TYPE_OTHER, 'Other'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='industry_profile',
        limit_choices_to={'role': 'industry_partner'},
    )
    company_name = models.CharField(max_length=300)
    org_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES, default=ORG_TYPE_COMPANY)
    registration_number = models.CharField(max_length=100, blank=True, help_text='MSME/Startup/Company registration number')
    sector = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_APPROVED)
    rejection_reason = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_industry_partners',
    )
    verified_at = models.DateTimeField(null=True, blank=True)

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

    FUNDING_COMMITTED = 'COMMITTED'
    FUNDING_DISBURSED = 'DISBURSED'
    FUNDING_UTILIZED = 'UTILIZED'
    FUNDING_STATUS_CHOICES = [
        (FUNDING_COMMITTED, 'Committed'),
        (FUNDING_DISBURSED, 'Disbursed'),
        (FUNDING_UTILIZED, 'Utilized'),
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

    # Structured funding tracking — only meaningful when support_type == FUNDING,
    # but left available generally since a partnership can evolve to include funding.
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text='Amount in INR')
    funding_status = models.CharField(max_length=15, choices=FUNDING_STATUS_CHOICES, null=True, blank=True)
    funding_notes = models.TextField(blank=True)

    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='responded_partnerships',
    )
    response_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.industry_partner.company_name} → {self.project_team}'


class IndustryMentor(models.Model):
    """A staff member the industry partner assigns to mentor a project team.
    Not a platform user account — just contact details, as the industry
    partner's own staff aren't necessarily registered on the platform."""
    project_team = models.ForeignKey(
        'universities.ProjectTeam',
        on_delete=models.CASCADE,
        related_name='industry_mentors'
    )
    industry_partner = models.ForeignKey(
        IndustryPartner,
        on_delete=models.CASCADE,
        related_name='assigned_mentors'
    )
    mentor_name = models.CharField(max_length=200)
    mentor_contact = models.CharField(max_length=200, help_text='Email or phone')
    expertise_area = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.mentor_name} → {self.project_team}'


class MentorReview(models.Model):
    """A technical review/consultation note left by an assigned mentor."""
    mentor = models.ForeignKey(IndustryMentor, on_delete=models.CASCADE, related_name='reviews')
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.mentor.mentor_name} on {self.created_at:%Y-%m-%d}'


class ProjectDocument(models.Model):
    """Shared document between an industry partner and an HEI project team."""
    project_team = models.ForeignKey(
        'universities.ProjectTeam',
        on_delete=models.CASCADE,
        related_name='shared_documents'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_project_documents'
    )
    file = models.FileField(upload_to='project_documents/%Y/%m/')
    description = models.CharField(max_length=300, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'Document for {self.project_team} by {self.uploaded_by.username}'

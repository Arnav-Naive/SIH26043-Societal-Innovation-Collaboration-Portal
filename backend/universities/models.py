from django.db import models
from django.conf import settings

class University(models.Model):
    name = models.CharField(max_length=300)
    
    # Updated to use Master Data
    district = models.ForeignKey(
        'master_data.District',
        on_delete=models.RESTRICT,
        related_name='universities'
    )
    state = models.CharField(max_length=100, default='Jharkhand')
    
    expertise_areas = models.ManyToManyField(
        'master_data.ExpertiseArea',
        related_name='universities',
        blank=True
    )
    
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=15, blank=True)
    website = models.URLField(blank=True)
    spoc = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='university_spoc',
        limit_choices_to={'role': 'hei_spoc'},
    )
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Verification'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    institution_type = models.CharField(max_length=50, blank=True)
    registration_id = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    designation = models.CharField(max_length=100, blank=True)
    departments = models.TextField(blank=True, help_text="Comma separated list of departments/disciplines")
    facilities = models.TextField(blank=True, help_text="Innovation/incubation facilities")
    verification_document = models.FileField(upload_to='hei_verifications/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    rejection_reason = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Universities'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProjectTeam(models.Model):
    STAGE_FORMED = 'FORMED'
    STAGE_PROPOSAL = 'PROPOSAL'
    STAGE_DEVELOPMENT = 'DEVELOPMENT'
    STAGE_PILOT = 'PILOT'
    STAGE_IMPLEMENTATION = 'IMPLEMENTATION'
    STAGE_IMPACT = 'IMPACT'

    STAGE_CHOICES = [
        (STAGE_FORMED, 'Team Formation'),
        (STAGE_PROPOSAL, 'Proposal'),
        (STAGE_DEVELOPMENT, 'Development'),
        (STAGE_PILOT, 'Pilot'),
        (STAGE_IMPLEMENTATION, 'Implementation'),
        (STAGE_IMPACT, 'Impact'),
    ]

    challenge = models.OneToOneField(
        'challenges.Challenge',
        on_delete=models.CASCADE,
        related_name='project_team'
    )
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    faculty_mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='mentored_teams',
        limit_choices_to={'role': 'faculty_mentor'},
    )
    students = models.JSONField(default=list, help_text='List of student name strings')
    project_title = models.CharField(max_length=300, blank=True)
    objective = models.TextField(blank=True)
    domain = models.CharField(max_length=100, blank=True)
    project_description = models.TextField(blank=True)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default=STAGE_FORMED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Team for {self.challenge.reference_id}'

    @property
    def milestone_count(self):
        return self.milestones.count()

    @property
    def approved_milestones(self):
        return self.milestones.filter(status='APPROVED').count()

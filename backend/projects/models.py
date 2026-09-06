from django.db import models
from django.conf import settings


class Milestone(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_APPROVED = 'APPROVED'
    STATUS_CHANGES_REQUESTED = 'CHANGES_REQUESTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_CHANGES_REQUESTED, 'Changes Requested'),
    ]

    project_team = models.ForeignKey(
        'universities.ProjectTeam',
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    title = models.CharField(max_length=300)
    description = models.TextField()
    due_date = models.DateField()
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_milestones'
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f'{self.project_team} — {self.title}'


class MilestoneEvidence(models.Model):
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='evidence')
    file = models.FileField(upload_to='milestone_evidence/%Y/%m/')
    description = models.CharField(max_length=300, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Evidence for {self.milestone}'

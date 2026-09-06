from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CITIZEN = 'citizen'
    ROLE_HEI_SPOC = 'hei_spoc'
    ROLE_FACULTY = 'faculty_mentor'
    ROLE_INDUSTRY = 'industry_partner'
    ROLE_ADMIN = 'gov_admin'

    ROLE_CHOICES = [
        (ROLE_CITIZEN, 'Citizen'),
        (ROLE_HEI_SPOC, 'HEI SPOC'),
        (ROLE_FACULTY, 'Faculty Mentor'),
        (ROLE_INDUSTRY, 'Industry Partner'),
        (ROLE_ADMIN, 'Government Admin'),
    ]

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default=ROLE_CITIZEN)
    phone = models.CharField(max_length=15, blank=True)
    district = models.CharField(max_length=100, blank=True)
    organization = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'accounts_user'

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    @property
    def is_citizen(self):
        return self.role == self.ROLE_CITIZEN

    @property
    def is_hei_spoc(self):
        return self.role == self.ROLE_HEI_SPOC

    @property
    def is_faculty_mentor(self):
        return self.role == self.ROLE_FACULTY

    @property
    def is_industry_partner(self):
        return self.role == self.ROLE_INDUSTRY

    @property
    def is_gov_admin(self):
        return self.role == self.ROLE_ADMIN

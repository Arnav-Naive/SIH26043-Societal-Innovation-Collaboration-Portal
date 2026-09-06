from rest_framework.permissions import BasePermission


class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'citizen')


class IsGovAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'gov_admin')


class IsHEISPOC(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'hei_spoc')


class IsFacultyMentor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'faculty_mentor')


class IsIndustryPartner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'industry_partner')


class IsGovAdminOrHEISPOC(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ('gov_admin', 'hei_spoc'))


class IsHEISPOCOrFaculty(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ('hei_spoc', 'faculty_mentor'))

import os, sys, json
import django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User
from master_data.models import Category, District, ExpertiseArea
from universities.models import University, ProjectTeam
from industry.models import IndustryPartner
from challenges.models import Challenge
from projects.models import Milestone

def run():
    client = APIClient()

    print("=== SETTING UP ENVIRONMENT ===")
    User.objects.filter(username__in=['gov1', 'spoc1', 'fac1', 'ind1', 'cit2']).delete()

    cat, _ = Category.objects.get_or_create(name='Water Supply')
    dist, _ = District.objects.get_or_create(name='Ranchi', defaults={'state': 'Jharkhand'})
    exp, _ = ExpertiseArea.objects.get_or_create(name='Civil Engineering')

    gov, _ = User.objects.get_or_create(username='gov1', defaults={'email':'gov1@gov.in', 'role':'gov_admin'})
    gov.set_password('StrongPass!123')
    gov.save()

    hei_spoc, _ = User.objects.get_or_create(username='spoc1', defaults={'email':'spoc1@edu.in', 'role':'hei_spoc'})
    hei_spoc.set_password('StrongPass!123')
    hei_spoc.save()

    uni, _ = University.objects.get_or_create(name='Ranchi University', spoc=hei_spoc, district=dist, status='VERIFIED')

    fac_user, _ = User.objects.get_or_create(username='fac1', defaults={'email':'fac1@edu.in', 'role':'faculty_mentor'})
    fac_user.set_password('StrongPass!123')
    fac_user.save()
    
    ind_user, _ = User.objects.get_or_create(username='ind1', defaults={'email':'ind1@corp.com', 'role':'industry_partner'})
    ind_user.set_password('StrongPass!123')
    ind_user.save()
    IndustryPartner.objects.get_or_create(user=ind_user, company_name='Tata Steel', defaults={'status': 'APPROVED'})

    print("\n=== STEP 1: Register Citizen & Submit Challenge ===")
    User.objects.filter(username='cit2').delete()
    res_reg = client.post('/api/auth/register/', {
        'username': 'cit2', 'email': 'cit2@cit.com', 'password': 'StrongPass!123', 'password2': 'StrongPass!123',
        'first_name': 'Citizen', 'role': 'citizen'
    })
    print("Register Response:", res_reg.status_code, getattr(res_reg, 'data', res_reg.content))
    
    res_login = client.post('/api/auth/login/', {'username': 'cit2', 'password': 'StrongPass!123'})
    cit_token = res_login.data.get('access') if hasattr(res_login, 'data') else None
    if cit_token:
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + cit_token)
    else:
        print("Citizen Login failed:", getattr(res_login, 'data', res_login.content))
    
    res_sub = client.post('/api/challenges/submit/', {
        'title': 'No water pipe in my street',
        'description': 'Water pipe is broken for 5 days.',
        'category': cat.id,
        'district': dist.id
    })
    print("Submit Challenge Response:", res_sub.status_code, getattr(res_sub, 'data', res_sub.content))
    ch_id = res_sub.data.get('id') if hasattr(res_sub, 'data') and 'id' in res_sub.data else None
    if not ch_id:
        ch_id = Challenge.objects.last().id

    print("\n=== STEP 2: Gov Admin routes to University ===")
    res_gov_login = client.post('/api/auth/login/', {'username': 'gov1', 'password': 'StrongPass!123'})
    if 'access' in getattr(res_gov_login, 'data', {}):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + res_gov_login.data['access'])
    else:
        print("Gov login failed:", getattr(res_gov_login, 'data', res_gov_login.content))
    
    res_route = client.post(f'/api/challenges/{ch_id}/route/', {'university_id': uni.id})
    print("Route Challenge Response:", res_route.status_code, getattr(res_route, 'data', res_route.content))

    print("\n=== STEP 3: HEI SPOC accepts & forms team ===")
    res_spoc_login = client.post('/api/auth/login/', {'username': 'spoc1', 'password': 'StrongPass!123'})
    if 'access' in getattr(res_spoc_login, 'data', {}):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + res_spoc_login.data['access'])
    else:
        print("SPOC login failed:", getattr(res_spoc_login, 'data', res_spoc_login.content))
    
    res_accept = client.post(f'/api/universities/challenges/{ch_id}/action/', {'action': 'accept'})
    print("Accept Challenge Response:", res_accept.status_code, getattr(res_accept, 'data', res_accept.content))
    
    res_team = client.post(f'/api/universities/challenges/{ch_id}/form-team/', {
        'team_name': 'Aqua Avengers',
        'mentor_id': fac_user.id,
        'student_names': ['Alice', 'Bob']
    }, format='json')
    print("Form Team Response:", res_team.status_code, getattr(res_team, 'data', res_team.content))
    
    team_id = None
    if getattr(res_team, 'data', None):
        team_id = res_team.data.get('team', {}).get('id') or res_team.data.get('id')
    if not team_id:
        team_id = ProjectTeam.objects.last().id if ProjectTeam.objects.exists() else 1
    
    try:
        team = ProjectTeam.objects.get(id=team_id)
        team.mentor = fac_user
        team.save()
    except Exception as e:
        print("Failed to assign mentor:", e)

    print("\n=== STEP 4: Industry offers support ===")
    res_ind_login = client.post('/api/auth/login/', {'username': 'ind1', 'password': 'StrongPass!123'})
    if 'access' in getattr(res_ind_login, 'data', {}):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + res_ind_login.data['access'])
    else:
        print("Industry login failed:", getattr(res_ind_login, 'data', res_ind_login.content))
    
    res_offer = client.post(f'/api/industry/projects/{team_id}/offer-support/', {
        'support_type': 'FUNDING',
        'contribution_details': 'Will fund the pipe repair',
        'amount': 50000
    })
    print("Offer Support Response:", res_offer.status_code, getattr(res_offer, 'data', res_offer.content))

    print("\n=== STEP 5: Faculty adds milestone and marks approved ===")
    res_fac_login = client.post('/api/auth/login/', {'username': 'fac1', 'password': 'StrongPass!123'})
    if 'access' in getattr(res_fac_login, 'data', {}):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + res_fac_login.data['access'])
    else:
        print("Faculty login failed:", getattr(res_fac_login, 'data', res_fac_login.content))
    
    res_milestone = client.post(f'/api/projects/teams/{team_id}/milestones/', {
        'title': 'Procured materials',
        'description': 'Bought PVC pipes',
        'due_date': '2026-10-01'
    })
    print("Add Milestone Response:", res_milestone.status_code, getattr(res_milestone, 'data', res_milestone.content))
    
    ms_id = None
    if getattr(res_milestone, 'data', None) and 'id' in res_milestone.data:
        ms_id = res_milestone.data['id']
    else:
        ms_id = Milestone.objects.last().id if Milestone.objects.exists() else 1
    
    res_ms_sub = client.post(f'/api/projects/milestones/{ms_id}/submit/', {
        'submission_notes': 'All pipes arrived.',
        'deliverable_link': 'http://proof.com'
    })
    print("Submit Milestone Response:", res_ms_sub.status_code, getattr(res_ms_sub, 'data', res_ms_sub.content))
    
    if 'access' in getattr(res_spoc_login, 'data', {}):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + res_spoc_login.data['access'])
    res_ms_app = client.post(f'/api/projects/milestones/{ms_id}/review/', {
        'action': 'approve',
        'feedback': 'Good job'
    })
    print("Approve Milestone Response:", res_ms_app.status_code, getattr(res_ms_app, 'data', res_ms_app.content))

    print("\n=== STEP 6: Citizen checks timeline ===")
    if cit_token:
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + cit_token)
        res_cit_check = client.get(f'/api/challenges/{ch_id}/')
        print("Citizen Status Check Response:", res_cit_check.status_code)
        if getattr(res_cit_check, 'data', None):
            print("Status:", res_cit_check.data.get('status'))
            print("Milestones visible:", "Yes" if 'milestones' in res_cit_check.data else "No")
    
if __name__ == '__main__':
    run()

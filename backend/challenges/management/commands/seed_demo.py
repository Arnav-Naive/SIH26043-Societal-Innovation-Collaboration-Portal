import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from master_data.models import Category, District
from universities.models import University, ProjectTeam
from industry.models import IndustryPartner, Partnership
from challenges.models import Challenge, ProblemTwin
from projects.models import Milestone, ProjectImpact
import random

class Command(BaseCommand):
    help = 'Seeds realistic demo data covering all verified workflows.'

    def handle(self, *args, **kwargs):
        if User.objects.filter(username='gov_demo').exists():
            self.stdout.write(self.style.WARNING("Demo data already exists, skipping"))
            return
            
        self.stdout.write("Starting Demo Data Seed...")

        # 1. Clear existing demo users/data (optional, but good for clean runs)
        User.objects.filter(username__in=[
            'gov_demo', 'cit_1', 'cit_2', 'cit_3', 'cit_4', 'cit_5', 'cit_6',
            'spoc_1', 'spoc_2', 'spoc_3', 'fac_1', 'fac_2', 'ind_demo'
        ]).delete()
        
        # 2. Setup Master Data (Ensuring they exist)
        cat_water, _ = Category.objects.get_or_create(name='Water Supply')
        cat_roads, _ = Category.objects.get_or_create(name='Roads & Transport')
        cat_edu, _ = Category.objects.get_or_create(name='Education')
        cat_health, _ = Category.objects.get_or_create(name='Healthcare')
        
        dist_ranchi, _ = District.objects.get_or_create(name='Ranchi')
        dist_dhanbad, _ = District.objects.get_or_create(name='Dhanbad')
        dist_singh, _ = District.objects.get_or_create(name='East Singhbhum')

        # 3. Create Users
        gov = User.objects.create_user('gov_demo', email='gov@demo.com', password='DemoPassword123!', role=User.ROLE_ADMIN, first_name='Gov', last_name='Admin')
        
        cits = []
        for i in range(1, 7):
            c = User.objects.create_user(f'cit_{i}', email=f'cit{i}@demo.com', password='DemoPassword123!', role=User.ROLE_CITIZEN, first_name=f'Citizen {i}')
            cits.append(c)
        
        spocs = []
        for i in range(1, 4):
            s = User.objects.create_user(f'spoc_{i}', email=f'spoc{i}@demo.com', password='DemoPassword123!', role=User.ROLE_HEI_SPOC, first_name=f'SPOC {i}')
            spocs.append(s)
            
        fac1 = User.objects.create_user('fac_1', email='fac1@demo.com', password='DemoPassword123!', role=User.ROLE_FACULTY, first_name='Faculty', last_name='One')
        fac2 = User.objects.create_user('fac_2', email='fac2@demo.com', password='DemoPassword123!', role=User.ROLE_FACULTY, first_name='Faculty', last_name='Two')

        ind = User.objects.create_user('ind_demo', email='ind@demo.com', password='DemoPassword123!', role=User.ROLE_INDUSTRY, first_name='Industry', last_name='Partner')
        
        # 4. Universities & Industry Partners
        u1, _ = University.objects.get_or_create(name='Demo Ranchi University', spoc=spocs[0], district=dist_ranchi, defaults={'status': University.STATUS_APPROVED})
        u2, _ = University.objects.get_or_create(name='Demo Dhanbad Tech', spoc=spocs[1], district=dist_dhanbad, defaults={'status': University.STATUS_APPROVED})
        u3, _ = University.objects.get_or_create(name='Demo Singhbhum College', spoc=spocs[2], district=dist_singh, defaults={'status': University.STATUS_APPROVED})
        
        partner, _ = IndustryPartner.objects.get_or_create(user=ind, company_name='Demo Steel Corp', defaults={'status': IndustryPartner.STATUS_APPROVED})
        
        # 5. Challenges
        # a) Gemini-sourced classification (Routed -> Formed -> Mentored -> Industry Funded -> Milestones)
        ch1 = Challenge.objects.create(
            title="Severe water logging in main market",
            description="The market gets completely flooded with knee-deep water during any moderate rain, damaging shop goods.",
            category=cat_water,
            district=dist_ranchi,
            citizen=cits[0],
            status=Challenge.STATUS_IN_PROGRESS,
            priority=Challenge.PRIORITY_HIGH,
            ai_category_name="Water Supply",
            classification_source="ai",
            ai_classification_reason="The text clearly describes urban flooding and drainage failure.",
            assigned_university=u1
        )
        team1 = ProjectTeam.objects.create(
            challenge=ch1,
            university=u1,
            faculty_mentor=fac1,
            stage=ProjectTeam.STAGE_FORMED
        )
        ms1 = Milestone.objects.create(
            project_team=team1,
            title="Design new drainage plan",
            description="Complete CAD drawings and flow analysis",
            due_date=timezone.now().date() + datetime.timedelta(days=10),
            status=Milestone.STATUS_APPROVED
        )
        ms2 = Milestone.objects.create(
            project_team=team1,
            title="Excavation phase",
            description="Digging trenches along the market",
            due_date=timezone.now().date() + datetime.timedelta(days=20),
            status=Milestone.STATUS_PENDING
        )
        Partnership.objects.create(
            project_team=team1,
            industry_partner=partner,
            support_type=Partnership.SUPPORT_FUNDING,
            contribution_details="Funding for excavation machinery",
            amount=150000.00,
            status=Partnership.STATUS_ACTIVE
        )

        # b) Keyword-fallback classification, routed, formed, COMPLETED challenge
        ch2 = Challenge.objects.create(
            title="Potholes on school road",
            description="Huge potholes making it impossible for buses to reach the school.",
            category=cat_roads,
            district=dist_dhanbad,
            citizen=cits[1],
            status=Challenge.STATUS_COMPLETED,
            priority=Challenge.PRIORITY_MEDIUM,
            ai_category_name="Roads & Transport",
            classification_source="keyword",
            ai_classification_reason="Matched keywords: potholes, road.",
            assigned_university=u2
        )
        team2 = ProjectTeam.objects.create(
            challenge=ch2,
            university=u2,
            faculty_mentor=fac2,
            stage=ProjectTeam.STAGE_IMPACT
        )
        ProjectImpact.objects.create(
            project_team=team2,
            beneficiaries_count=450,
            cost_incurred=45000.00,
            before_metrics="Impassable road",
            after_metrics="Smooth concrete road completed"
        )
        
        # c) Problem Twin Pair
        ch3 = Challenge.objects.create(
            title="Missing teachers at village primary school",
            description="We haven't had a math teacher for 3 months.",
            category=cat_edu,
            district=dist_singh,
            citizen=cits[2],
            status=Challenge.STATUS_SUBMITTED,
            priority=Challenge.PRIORITY_MEDIUM,
            classification_source="ai"
        )
        ch4 = Challenge.objects.create(
            title="No math teacher in school",
            description="The primary school has no math teacher since July.",
            category=cat_edu,
            district=dist_singh,
            citizen=cits[3],
            status=Challenge.STATUS_SUBMITTED,
            priority=Challenge.PRIORITY_MEDIUM,
            classification_source="ai"
        )
        twin_edu = ProblemTwin.objects.create(
            title="Teacher Shortage in Primary Schools (East Singhbhum)",
            category=cat_edu,
            district=dist_singh,
            risk_level=ProblemTwin.RISK_MEDIUM
        )
        ch3.problem_twin = twin_edu
        ch3.save()
        ch4.problem_twin = twin_edu
        ch4.save()
        
        # d) ESCALATED Problem Twin
        twin_health = ProblemTwin.objects.create(
            title="Mystery Fever Outbreak",
            category=cat_health,
            district=dist_ranchi,
            risk_level=ProblemTwin.RISK_ESCALATED,
            ai_reasoning="Report rate has increased by 300% in the last 24 hours indicating a fast-spreading outbreak."
        )
        
        now = timezone.now()
        for i in range(2):
            ch = Challenge.objects.create(
                title=f"Fever case {i}",
                description="High fever and joint pain.",
                category=cat_health,
                district=dist_ranchi,
                citizen=cits[4],
                status=Challenge.STATUS_SUBMITTED,
                problem_twin=twin_health
            )
            Challenge.objects.filter(id=ch.id).update(created_at=now - datetime.timedelta(days=4))
            
        for i in range(6):
            ch = Challenge.objects.create(
                title=f"Another fever case {i+2}",
                description="Fever and rash in my family.",
                category=cat_health,
                district=dist_ranchi,
                citizen=cits[5],
                status=Challenge.STATUS_SUBMITTED,
                problem_twin=twin_health
            )
            Challenge.objects.filter(id=ch.id).update(created_at=now - datetime.timedelta(hours=2))

        self.stdout.write(self.style.SUCCESS('\n=== SEED DATA CREATED SUCCESSFULLY ==='))
        self.stdout.write(f"Citizens: {len(cits)}")
        self.stdout.write(f"Universities: {University.objects.count()}")
        self.stdout.write(f"Industry Partners: {IndustryPartner.objects.count()}")
        self.stdout.write(f"Challenges: {Challenge.objects.count()}")
        self.stdout.write(f"Problem Twins: {ProblemTwin.objects.count()} (1 Escalated)")
        self.stdout.write(f"Project Teams: {ProjectTeam.objects.count()}")
        self.stdout.write(f"Milestones: {Milestone.objects.count()}")
        self.stdout.write(f"Partnerships: {Partnership.objects.count()}")
        
        self.stdout.write(self.style.WARNING('\n=== DEMO LOGIN CREDENTIALS ==='))
        self.stdout.write("All passwords are: DemoPassword123!")
        self.stdout.write("--------------------------------")
        self.stdout.write("Role             | Username")
        self.stdout.write("--------------------------------")
        self.stdout.write("Gov Admin        | gov_demo")
        self.stdout.write("Citizen          | cit_1 (to cit_6)")
        self.stdout.write("HEI SPOC         | spoc_1 (to spoc_3)")
        self.stdout.write("Faculty Mentor   | fac_1, fac_2")
        self.stdout.write("Industry Partner | ind_demo")
        self.stdout.write("--------------------------------\n")

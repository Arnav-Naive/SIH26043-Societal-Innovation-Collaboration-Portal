"""
Management command: python manage.py seed_demo
Seeds the database with realistic demo data for the SamadhanX platform.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date


class Command(BaseCommand):
    help = 'Seeds the database with demo data for SamadhanX'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('== Seeding SamadhanX demo data...'))
        self._seed_users()
        self._seed_master_data()
        self._seed_universities()
        self._seed_challenges()
        self._seed_teams_and_milestones()
        self._seed_industry()
        self._seed_duplicate_pairs()
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
        self._print_credentials()

    def _seed_users(self):
        from accounts.models import User

        users_data = [
            {
                'username': 'admin',
                'email': 'admin@samadhanx.gov.in',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'role': 'gov_admin',
                'organization': 'Ministry of Education, GoI',
                'district': 'New Delhi',
            },
            {
                'username': 'citizen1',
                'email': 'priya@example.com',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'role': 'citizen',
                'district': 'Ranchi',
                'phone': '9876543210',
            },
            {
                'username': 'hei_spoc1',
                'email': 'spoc@bitrh.ac.in',
                'first_name': 'Dr. Suresh',
                'last_name': 'Mehta',
                'role': 'hei_spoc',
                'organization': 'BIT Ranchi',
                'district': 'Ranchi',
            },
            {
                'username': 'faculty1',
                'email': 'faculty@bitrh.ac.in',
                'first_name': 'Prof. Anita',
                'last_name': 'Singh',
                'role': 'faculty_mentor',
                'organization': 'BIT Ranchi — Dept. of Civil Engineering',
                'district': 'Ranchi',
            },
            {
                'username': 'industry1',
                'email': 'csr@tatasteeljamshedpur.com',
                'first_name': 'Vikram',
                'last_name': 'Patel',
                'role': 'industry_partner',
                'organization': 'Tata Steel CSR Division',
                'district': 'East Singhbhum',
            },
        ]

        self.users = {}
        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={**data}
            )
            if created:
                user.set_password('Demo@1234')
                user.save()
                self.stdout.write(f'  Created user: {user.username}')
            self.users[data['username']] = user

    def _seed_master_data(self):
        from master_data.models import District, Category, ExpertiseArea

        districts = [
            'Ranchi', 'Dhanbad', 'Bokaro', 'East Singhbhum', 'Seraikela-Kharsawan', 
            'West Singhbhum', 'Giridih', 'Hazaribagh', 'Chatra', 'Koderma', 
            'Lohardaga', 'Gumla', 'Simdega', 'Khunti', 'Ramgarh', 'Palamu', 
            'Latehar', 'Garhwa', 'Sahibganj', 'Pakur', 'Godda', 'Dumka', 'Deoghar', 'Jamtara'
        ]
        self.districts = {}
        for d in districts:
            dist, created = District.objects.get_or_create(name=d)
            self.districts[d] = dist
            if created:
                self.stdout.write(f'  Created district: {d}')
                
        categories = [
            ('Water', 'Water management, scarcity, flooding, irrigation', ['water', 'flood', 'drinking', 'pipeline', 'pond', 'irrigation', 'waterlogging', 'drainage', 'rainwater']),
            ('Agriculture', 'Farming, crops, livestock, pests, soil', ['crop', 'farmer', 'pest', 'soil', 'harvest', 'paddy', 'tractor']),
            ('Education', 'Schools, colleges, dropouts, literacy, infrastructure', ['school', 'education', 'dropout', 'literacy', 'college', 'student', 'teacher']),
            ('Health', 'Healthcare, hospitals, diseases, nutrition', ['health', 'hospital', 'disease', 'nutrition', 'malnutrition', 'clinic', 'medicine', 'diarrhoea', 'typhoid']),
            ('Infrastructure', 'Roads, bridges, power, buildings', ['road', 'bridge', 'power', 'electricity', 'building', 'highway', 'transport']),
            ('Environment', 'Pollution, forests, waste management, climate', ['pollution', 'forest', 'waste', 'climate', 'environment', 'air', 'smoke', 'kiln', 'garbage', 'sanitation']),
            ('Governance', 'Public administration, services, digital access', ['governance', 'administration', 'service', 'certificate', 'panchayat']),
        ]
        self.categories = {}
        for name, desc, kws in categories:
            cat, created = Category.objects.get_or_create(name=name, defaults={'description': desc, 'keywords': kws})
            self.categories[name] = cat
            if created:
                self.stdout.write(f'  Created category: {name}')

        expertise_areas = ['Water Management', 'Civil Engineering', 'Environmental Engineering', 'Agriculture', 'Health', 'Technology', 'Education', 'Governance']
        self.expertise_areas = {}
        for ea in expertise_areas:
            area, created = ExpertiseArea.objects.get_or_create(name=ea)
            self.expertise_areas[ea] = area
            if created:
                self.stdout.write(f'  Created expertise area: {ea}')

    def _seed_universities(self):
        from universities.models import University

        unis_data = [
            {
                'name': 'Birsa Institute of Technology, Ranchi',
                'district_name': 'Ranchi',
                'state': 'Jharkhand',
                'expertise_areas': ['Water Management', 'Civil Engineering', 'Environmental Engineering'],
                'contact_email': 'contact@bitrh.ac.in',
                'spoc_username': 'hei_spoc1',
            },
            {
                'name': 'National Institute of Technology, Jamshedpur',
                'district_name': 'East Singhbhum',
                'state': 'Jharkhand',
                'expertise_areas': ['Agriculture', 'Health', 'Technology'],
                'contact_email': 'contact@nitjsr.ac.in',
            },
            {
                'name': 'Vinoba Bhave University, Hazaribagh',
                'district_name': 'Hazaribagh',
                'state': 'Jharkhand',
                'expertise_areas': ['Education', 'Governance', 'Agriculture'],
                'contact_email': 'contact@vbu.ac.in',
            },
        ]

        self.universities = {}
        for data in unis_data:
            spoc_username = data.pop('spoc_username', None)
            spoc = self.users.get(spoc_username)
            district_name = data.pop('district_name')
            district = self.districts.get(district_name)
            expertise_area_names = data.pop('expertise_areas', [])
            
            uni, created = University.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'district': district, 'spoc': spoc}
            )
            
            if created:
                # Add M2M expertise areas
                areas = [self.expertise_areas.get(ea) for ea in expertise_area_names if self.expertise_areas.get(ea)]
                uni.expertise_areas.set(areas)
                self.stdout.write(f'  Created university: {uni.name}')
            
            self.universities[uni.name] = uni

    def _seed_challenges(self):
        from challenges.models import Challenge, ChallengeStatusHistory
        from challenges.categorizer import categorize_challenge, compute_priority

        self.citizen = self.users['citizen1']
        self.admin = self.users['admin']
        bit_ranchi = self.universities['Birsa Institute of Technology, Ranchi']

        challenges_data = [
            {
                'title': 'Seasonal drinking water shortage affecting households in rural Ranchi',
                'description': (
                    'Over 200 households in Nagri block, Ranchi face acute drinking water shortage '
                    'every summer from April to June. The only borewell in the area has been '
                    'non-functional for the past two years. Women and children travel over 3 km '
                    'daily to fetch water from a contaminated river source. Urgent intervention '
                    'needed to restore safe drinking water access.'
                ),
                'district_name': 'Ranchi',
                'location': 'Nagri Block, Ranchi Rural',
            },
            {
                'title': 'Damaged approach road cuts off three villages from market access',
                'description': (
                    'The 4 km approach road connecting Bero, Tapkara and Chainpur villages to the '
                    'nearest town has been severely damaged due to monsoon flooding. Around 2,500 '
                    'residents face difficulty in accessing healthcare, markets and schools. '
                    'The road has multiple collapsed sections and large potholes making it '
                    'impassable for vehicles. Emergency road repair is required.'
                ),
                'district_name': 'Khunti',
                'location': 'Bero–Tapkara Road, Khunti',
            },
            {
                'title': 'High school dropout rate among tribal girls in Gumla district',
                'description': (
                    'Approximately 40% of tribal girls in the Gumla district are dropping out '
                    'of school after Class 8 due to lack of safe transportation, absence of '
                    'hostel facilities, and economic pressures. The nearest higher secondary '
                    'school is 12 km from most villages. Many families are forced to send '
                    'girls to work rather than continue their education.'
                ),
                'district_name': 'Gumla',
                'location': 'Gumla District — tribal belt',
            },
            {
                'title': 'Open defecation and lack of sanitation in migrant workers colony',
                'description': (
                    'A migrant workers colony near the industrial belt of Adityapur has over '
                    '400 families living without access to toilets or safe sanitation. Open '
                    'defecation near the water source has caused repeated outbreaks of diarrhoea '
                    'and typhoid in the area. Children are particularly vulnerable. Community '
                    'sanitation blocks are urgently needed.'
                ),
                'district_name': 'Seraikela-Kharsawan',
                'location': 'Adityapur Industrial Area, Seraikela',
            },
            {
                'title': 'Paddy crop losses due to irregular irrigation and pest infestation',
                'description': (
                    'Farmers in the Simdega district are suffering significant paddy crop losses '
                    'due to uneven water distribution from the irrigation canal and an increasing '
                    'incidence of stem borer pest infestation. Over 500 farmers across 15 villages '
                    'are affected. Lack of access to agronomical guidance and pest control support '
                    'is compounding the problem. Need technical intervention for crop protection.'
                ),
                'district_name': 'Simdega',
                'location': 'Simdega Irrigation Command Area',
            },
            {
                'title': 'Air pollution from brick kilns affecting residential areas in Dhanbad',
                'description': (
                    'Residents in the vicinity of 12 brick kilns operating in Dhanbad are '
                    'experiencing severe air pollution with visible smoke and particulate matter. '
                    'Respiratory illnesses have increased among elderly and children. The kilns '
                    'operate without pollution control equipment. Community health is deteriorating. '
                    'Need environmental monitoring and regulatory enforcement support.'
                ),
                'district_name': 'Dhanbad',
                'location': 'Jharia–Dhanbad Brick Kiln Belt',
            },
        ]

        statuses_to_assign = [
            'IN_PROGRESS',    # CHL-1: fully progressed
            'ROUTED',         # CHL-2: routed, no team yet
            'UNDER_REVIEW',   # CHL-3
            'SUBMITTED',      # CHL-4
            'SUBMITTED',      # CHL-5
            'COMPLETED',      # CHL-6
        ]

        self.challenges = []
        for i, data in enumerate(challenges_data):
            cat_result = categorize_challenge(data['title'], data['description'])
            priority = compute_priority(data['title'], data['description'], cat_result['category'])

            district = self.districts.get(data['district_name'])
            category = self.categories.get(cat_result['category'])

            challenge, created = Challenge.objects.get_or_create(
                title=data['title'],
                defaults={
                    'citizen': self.citizen,
                    'description': data['description'],
                    'district': district,
                    'location': data['location'],
                    'category': category,
                    'category_confidence': cat_result['confidence'],
                    'category_reason': cat_result['reason'],
                    'priority': priority,
                    'status': Challenge.STATUS_SUBMITTED,
                }
            )

            if created:
                target_status = statuses_to_assign[i]

                # Build status history
                ChallengeStatusHistory.objects.create(
                    challenge=challenge,
                    status='SUBMITTED',
                    changed_by=self.citizen,
                    note='Challenge submitted by citizen.',
                )

                if target_status in ('UNDER_REVIEW', 'ROUTED', 'IN_PROGRESS', 'COMPLETED'):
                    challenge.status = 'UNDER_REVIEW'
                    challenge.save()
                    ChallengeStatusHistory.objects.create(
                        challenge=challenge,
                        status='UNDER_REVIEW',
                        changed_by=self.admin,
                        note='Challenge accepted for review.',
                    )

                if target_status in ('ROUTED', 'IN_PROGRESS', 'COMPLETED'):
                    challenge.assigned_university = bit_ranchi
                    challenge.status = 'ROUTED'
                    challenge.routing_note = 'Assigned to BIT Ranchi based on expertise match.'
                    challenge.save()
                    ChallengeStatusHistory.objects.create(
                        challenge=challenge,
                        status='ROUTED',
                        changed_by=self.admin,
                        note=f'Routed to {bit_ranchi.name}.',
                    )

                if target_status in ('IN_PROGRESS', 'COMPLETED'):
                    challenge.status = 'IN_PROGRESS'
                    challenge.save()
                    ChallengeStatusHistory.objects.create(
                        challenge=challenge,
                        status='IN_PROGRESS',
                        changed_by=self.users['hei_spoc1'],
                        note='Project team formed at BIT Ranchi.',
                    )

                if target_status == 'COMPLETED':
                    challenge.status = 'COMPLETED'
                    challenge.save()
                    ChallengeStatusHistory.objects.create(
                        challenge=challenge,
                        status='COMPLETED',
                        changed_by=self.users['faculty1'],
                        note='All milestones approved. Challenge marked as completed.',
                    )

                self.stdout.write(f'  Created challenge: {challenge.reference_id} [{target_status}]')
            self.challenges.append(challenge)

    def _seed_teams_and_milestones(self):
        from universities.models import ProjectTeam
        from projects.models import Milestone

        bit_ranchi = self.universities['Birsa Institute of Technology, Ranchi']
        faculty = self.users['faculty1']
        hei_spoc = self.users['hei_spoc1']

        # Team for challenge 1 (IN_PROGRESS)
        challenge_1 = self.challenges[0]
        team, created = ProjectTeam.objects.get_or_create(
            challenge=challenge_1,
            defaults={
                'university': bit_ranchi,
                'faculty_mentor': faculty,
                'students': [
                    'Arjun Kumar (BIT/Civil/2023)',
                    'Sunita Oraon (BIT/Civil/2023)',
                    'Rahul Munda (BIT/Environmental/2022)',
                ],
                'project_description': (
                    'The team will design and pilot a low-cost rainwater harvesting system '
                    'for the Nagri block. Phase 1 involves site assessment and community mapping. '
                    'Phase 2 involves prototype construction and testing. Phase 3 covers community '
                    'handover and maintenance training.'
                ),
                'stage': ProjectTeam.STAGE_DEVELOPMENT,
            }
        )

        if created:
            self.stdout.write(f'  Created team for: {challenge_1.reference_id}')

            # Create milestones
            milestones_data = [
                {
                    'title': 'Site Assessment and Community Survey',
                    'description': 'Conduct site visits, geotechnical surveys and household surveys in Nagri block.',
                    'due_date': date.today() - timedelta(days=45),
                    'status': Milestone.STATUS_APPROVED,
                },
                {
                    'title': 'System Design and Material Procurement',
                    'description': 'Finalize rainwater harvesting system design. Procure materials.',
                    'due_date': date.today() - timedelta(days=15),
                    'status': Milestone.STATUS_APPROVED,
                },
                {
                    'title': 'Prototype Construction and Testing',
                    'description': 'Construct pilot rainwater harvesting unit. Test for water quality and flow.',
                    'due_date': date.today() + timedelta(days=30),
                    'status': Milestone.STATUS_SUBMITTED,
                },
                {
                    'title': 'Community Handover and Training',
                    'description': 'Train community members on system operation and maintenance.',
                    'due_date': date.today() + timedelta(days=60),
                    'status': Milestone.STATUS_PENDING,
                },
            ]

            for m_data in milestones_data:
                Milestone.objects.create(project_team=team, **m_data)

        # Team for challenge 6 (COMPLETED)
        challenge_6 = self.challenges[5]
        team_6, created_6 = ProjectTeam.objects.get_or_create(
            challenge=challenge_6,
            defaults={
                'university': bit_ranchi,
                'faculty_mentor': faculty,
                'students': [
                    'Deepak Mahto (BIT/Environmental/2023)',
                    'Kavita Sinha (BIT/Chemical/2023)',
                ],
                'project_description': (
                    'Environmental monitoring of brick kiln pollution and design of '
                    'low-cost emission reduction retrofits.'
                ),
                'stage': ProjectTeam.STAGE_IMPACT,
            }
        )

        if created_6:
            self.stdout.write(f'  Created team for: {challenge_6.reference_id}')
            Milestone.objects.create(
                project_team=team_6,
                title='Environmental Baseline Survey',
                description='Baseline air quality measurement around all 12 kilns.',
                due_date=date.today() - timedelta(days=90),
                status=Milestone.STATUS_APPROVED,
            )
            Milestone.objects.create(
                project_team=team_6,
                title='Emission Control Retrofit Pilot',
                description='Install and test emission control devices on 2 kilns.',
                due_date=date.today() - timedelta(days=30),
                status=Milestone.STATUS_APPROVED,
            )

    def _seed_industry(self):
        from industry.models import IndustryPartner, Partnership
        from universities.models import ProjectTeam

        industry_user = self.users['industry1']
        partner, created = IndustryPartner.objects.get_or_create(
            user=industry_user,
            defaults={
                'company_name': 'Tata Steel Foundation',
                'sector': 'Infrastructure',
                'description': (
                    'Tata Steel Foundation CSR division supporting community water, '
                    'health and environmental projects in Jharkhand.'
                ),
                'website': 'https://www.tatasteelfoundation.org',
                'contact_email': 'csr@tatasteeljamshedpur.com',
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(f'  Created industry partner: {partner.company_name}')

            # Link to team for challenge 1
            try:
                team = ProjectTeam.objects.get(challenge=self.challenges[0])
                Partnership.objects.create(
                    project_team=team,
                    industry_partner=partner,
                    support_type='FUNDING',
                    contribution_details=(
                        'Tata Steel Foundation is providing ₹5 lakh in seed funding for the '
                        'rainwater harvesting system pilot in Nagri block. Additionally, '
                        'we will provide technical guidance from our civil engineering team.'
                    ),
                    status='ACTIVE',
                )
                self.stdout.write('  Created partnership for challenge CHL-00001')
            except ProjectTeam.DoesNotExist:
                pass

    def _seed_duplicate_pairs(self):
        """
        Create 2 pairs of deliberately similar challenges (same category + district,
        different phrasing) to demonstrate duplicate detection.
        """
        from challenges.models import Challenge, ChallengeStatusHistory, DuplicateFlag
        from challenges.categorizer import categorize_challenge, compute_priority

        self.stdout.write(self.style.MIGRATE_HEADING('  Seeding duplicate detection demo pairs...'))

        citizen = self.users['citizen1']
        ranchi = self.districts['Ranchi']
        water_cat = self.categories['Water']
        infra_cat = self.categories['Infrastructure']

        # ── Pair 1: Water, Ranchi ──
        pair1_challenges = [
            {
                'title': 'Contaminated drinking water supply in Kanke area of Ranchi',
                'description': (
                    'Residents of Kanke block in Ranchi are facing severe contamination '
                    'in their drinking water supply. The piped water has a yellowish tint '
                    'and foul odour. Multiple families have reported gastrointestinal '
                    'illnesses after consuming the water. Water quality testing is urgently '
                    'needed along with provision of clean water through tanker supply.'
                ),
            },
            {
                'title': 'Unsafe and polluted water sources in Kanke block, Ranchi',
                'description': (
                    'The water supply in Kanke area of Ranchi district is heavily polluted '
                    'and unsafe for drinking. The tap water appears discoloured and smells '
                    'bad. Several residents, especially children, have fallen sick with '
                    'stomach infections after drinking this water. Immediate water quality '
                    'assessment and emergency clean water provision is required.'
                ),
            },
        ]

        # ── Pair 2: Infrastructure, Ranchi ──
        pair2_challenges = [
            {
                'title': 'Frequent power outages disrupting daily life in Doranda, Ranchi',
                'description': (
                    'Residents in Doranda locality of Ranchi are experiencing frequent and '
                    'prolonged power outages lasting 8-10 hours daily. The electricity supply '
                    'infrastructure is outdated with rusted transformers and damaged power '
                    'lines. Small businesses are suffering losses and students cannot study '
                    'after dark. Urgent upgrading of electrical infrastructure is needed.'
                ),
            },
            {
                'title': 'Electricity supply failures causing hardship in Doranda locality, Ranchi',
                'description': (
                    'The Doranda area in Ranchi has been facing severe electricity disruptions '
                    'with daily power cuts of 8 to 10 hours. Old and poorly maintained '
                    'transformers and power cables are the root cause. Local shops lose '
                    'revenue and children are unable to study in the evenings. The power '
                    'distribution infrastructure needs immediate repair and modernization.'
                ),
            },
        ]

        all_pairs = [
            (pair1_challenges, water_cat),
            (pair2_challenges, infra_cat),
        ]

        created_challenges = []
        for pair, category in all_pairs:
            for data in pair:
                challenge, created = Challenge.objects.get_or_create(
                    title=data['title'],
                    defaults={
                        'citizen': citizen,
                        'description': data['description'],
                        'district': ranchi,
                        'location': 'Ranchi Urban',
                        'category': category,
                        'category_confidence': 95,
                        'category_reason': 'Seeded for duplicate detection demo',
                        'priority': 'MEDIUM',
                        'status': Challenge.STATUS_SUBMITTED,
                        'classification_source': 'keyword',
                    }
                )
                if created:
                    ChallengeStatusHistory.objects.create(
                        challenge=challenge,
                        status='SUBMITTED',
                        changed_by=citizen,
                        note='Challenge submitted by citizen.',
                    )
                    self.stdout.write(f'    Created duplicate-demo challenge: {challenge.reference_id}')
                created_challenges.append(challenge)

        # Run duplicate detection to generate embeddings and DuplicateFlag records
        try:
            from challenges.duplicate_detection import detect_duplicates
            total_flags = 0
            for challenge in created_challenges:
                flags = detect_duplicates(challenge)
                total_flags += flags

            flag_count = DuplicateFlag.objects.filter(status='pending_review').count()
            self.stdout.write(
                self.style.SUCCESS(f'    Duplicate detection complete: {flag_count} pending flag(s) created.')
            )
        except Exception as exc:
            self.stdout.write(
                self.style.WARNING(f'    Duplicate detection skipped (model may not be available): {exc}')
            )

    def _print_credentials(self):
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('Demo Login Credentials (password: Demo@1234)'))
        self.stdout.write('  gov_admin    : username=admin')
        self.stdout.write('  citizen      : username=citizen1')
        self.stdout.write('  hei_spoc     : username=hei_spoc1')
        self.stdout.write('  faculty      : username=faculty1')
        self.stdout.write('  industry     : username=industry1')

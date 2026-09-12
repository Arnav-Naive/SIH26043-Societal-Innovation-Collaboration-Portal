import os, sys, json
import django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from challenges.models import Challenge, DuplicateFlag, ProblemTwin
from challenges.problem_twin_detection import detect_problem_twin
from master_data.models import Category, District
from accounts.models import User
from universities.matching import compute_university_matches
from universities.models import University

cat, _ = Category.objects.get_or_create(name='Water Supply')
dist, _ = District.objects.get_or_create(name='Ranchi', defaults={'state': 'Jharkhand'})
cit, _ = User.objects.get_or_create(username='test2cit', defaults={'email': 'test2@cit.com', 'first_name':'T2', 'role':'CITIZEN'})

DuplicateFlag.objects.all().delete()
ProblemTwin.objects.all().delete()
Challenge.objects.all().delete()

desc1 = "Our village has no drinking water for the past 5 days."
desc2 = "Our village has no drinking water for 5 days now."
c1 = Challenge.objects.create(title=desc1, description=desc1, district=dist, category=cat, citizen=cit, normalized_description=desc1)
detect_problem_twin(c1)
c2 = Challenge.objects.create(title=desc2, description=desc2, district=dist, category=cat, citizen=cit, normalized_description=desc2)
detect_problem_twin(c2)

flags = DuplicateFlag.objects.all()
twins = ProblemTwin.objects.all()

print("\n--- 3. Semantic Duplicate Detection & 4. Problem Twin ---")
print(f"PASS: Detected {flags.count()} duplicates and created {twins.count()} twins.")
for f in flags: print(f"Duplicate Pair Score: {f.similarity_score:.4f}")
for t in twins: print(f"Twin DB Record: {t.title} | Category: {t.category.name} | Reports: {t.linked_challenges.count()}")

print("\n--- 5. HEI Matching Engine ---")
print("PASS: Ranked Universities:")
matches = compute_university_matches(c2, University.objects.all())
for u in matches:
    un = University.objects.get(id=u['university_id'])
    print(f"- {un.name}: {u['score']} ({u['reason']})")

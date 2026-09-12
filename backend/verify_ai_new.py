import os, sys, json
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.ai_classifier import _classify_with_gemini, _classify_with_keywords
from master_data.models import Category, District, ExpertiseArea
from challenges.models import Challenge, DuplicateFlag, ProblemTwin
from challenges.problem_twin_detection import detect_problem_twin
from universities.models import University
from universities.matching import compute_university_matches
from accounts.models import User
from PIL import Image

def run():
    print('==============================')
    # SETUP
    cat, _ = Category.objects.get_or_create(name='Water Supply')
    dist, _ = District.objects.get_or_create(name='Ranchi', defaults={'state': 'Jharkhand'})
    cats = list(Category.objects.values_list('name', flat=True))
    if not cats:
        cats = ['Water Supply', 'Road Infrastructure', 'Healthcare']
        
    citizen, _ = User.objects.get_or_create(email='test@cit.com', defaults={'first_name':'Test','role':'CITIZEN'})

    # 1. Text Classification
    print('\n--- 1. Text Classification ---')
    try:
        res = _classify_with_gemini('No drinking water', 'no drinking water in our village for 5 days', 'Ranchi', cats)
        print('PASS:\n', json.dumps(res, indent=2))
    except Exception as e:
        print('FAIL:', str(e)[:300])
        print('Triggering Fallback:')
        try:
            fb = _classify_with_keywords('No drinking water', 'no drinking water in our village for 5 days')
            print('FALLBACK PASS:\n', json.dumps(fb, indent=2))
        except Exception as e2:
            print('FALLBACK FAIL:', e2)

    # 2. Vision Analysis
    print('\n--- 2. Vision Analysis ---')
    try:
        img = Image.new('RGB', (10, 10), color='red')
        img.save('dummy.jpg')
        res2 = _classify_with_gemini('Broken road', 'large pothole here', 'Ranchi', cats, ['dummy.jpg'])
        print('PASS:\n', json.dumps(res2, indent=2))
    except Exception as e:
        print('FAIL:', str(e)[:300])

    # 3. Duplicate Detection & 4. Problem Twin
    print('\n--- 3. Semantic Duplicate Detection & 4. Problem Twin ---')
    try:
        DuplicateFlag.objects.all().delete()
        ProblemTwin.objects.all().delete()
        Challenge.objects.all().delete()
        
        c1 = Challenge.objects.create(title='No water in village for a week', description='No water in village for a week', district=dist, category=cat, normalized_description='No water in village for a week', citizen=citizen)
        detect_problem_twin(c1)
        
        c2 = Challenge.objects.create(title='Water supply cut off for 5 days', description='Water supply cut off for 5 days', district=dist, category=cat, normalized_description='Water supply cut off for 5 days', citizen=citizen)
        detect_problem_twin(c2)

        flags = DuplicateFlag.objects.all()
        twins = ProblemTwin.objects.all()
        
        print(f'PASS: Detected {flags.count()} duplicates and created {twins.count()} twins.')
        for f in flags:
            print(f'Duplicate Pair: {f.challenge_a.title} & {f.challenge_b.title} (Score: {f.similarity_score:.4f})')
        for t in twins:
            print(f'Twin DB Record: {t.title} | Category: {t.category.name} | Reports: {t.linked_challenges.count()}')
            
    except Exception as e:
        print('FAIL:', e)
        
    # 5. HEI Matching Engine
    print('\n--- 5. HEI Matching Engine ---')
    try:
        University.objects.all().delete()
        ExpertiseArea.objects.all().delete()
        e1, _ = ExpertiseArea.objects.get_or_create(name='Water management and civil engineering')
        e2, _ = ExpertiseArea.objects.get_or_create(name='Healthcare and medicine')
        
        u1, _ = University.objects.get_or_create(name='Tech Uni', district=dist)
        u1.expertise_areas.add(e1)
        
        u2, _ = University.objects.get_or_create(name='Med Uni', district=dist)
        u2.expertise_areas.add(e2)
        
        matches = compute_university_matches(c2, University.objects.all())
        print('PASS: Ranked Universities:')
        for u in matches:
            print(f"- {u['university'].name}: {u['score']:.4f}")
    except Exception as e:
        print('FAIL:', e)

if __name__ == '__main__':
    run()

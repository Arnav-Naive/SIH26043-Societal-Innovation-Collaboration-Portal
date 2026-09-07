import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from challenges.models import Challenge
from master_data.models import District, Category, AuditLog
from master_data.utils import log_audit
from challenges.views import run_ai_pipeline

User = get_user_model()
admin = User.objects.filter(role='gov_admin').first()
citizen = User.objects.filter(role='citizen').first()
district = District.objects.first()

print('--- Test 1: Creating a Water Challenge ---')
c1 = Challenge.objects.create(
    title='Severe water shortage in village',
    description='We have no drinking water for the last 5 days. People are falling sick.',
    citizen=citizen,
    district=district
)
run_ai_pipeline(c1)
c1.refresh_from_db()

print(f'Category: {c1.ai_category_name}')
print(f'Confidence: {c1.ai_confidence}')
print(f'Reason: {c1.ai_classification_reason}')
print(f'Priority Score: {c1.priority_score}')
print(f'Priority Level: {c1.priority}')
print(f'Priority Breakdown: {c1.priority_breakdown}')

print('\n--- Test 2: Creating an Education Challenge ---')
c2 = Challenge.objects.create(
    title='No teachers in primary school',
    description='The local primary school has been without teachers for months. Students are dropping out.',
    citizen=citizen,
    district=district
)
run_ai_pipeline(c2)
c2.refresh_from_db()
print(f'Category: {c2.ai_category_name}')
print(f'Confidence: {c2.ai_confidence}')
print(f'Reason: {c2.ai_classification_reason}')
print(f'Priority Score: {c2.priority_score}')

print('\n--- Test 3: Creating a Health Challenge ---')
c3 = Challenge.objects.create(
    title='Outbreak of dengue in locality',
    description='Multiple cases of dengue reported. Hospitals are full. Urgent fogging needed.',
    citizen=citizen,
    district=district
)
run_ai_pipeline(c3)
c3.refresh_from_db()
print(f'Category: {c3.ai_category_name}')
print(f'Priority Score: {c3.priority_score}')

print('\n--- Checking Audit Logs ---')
# Simulate Accept
c1.ai_accepted_by = admin
c1.save()
log_audit(
    user=admin,
    action='Accepted AI Classification',
    entity_type='Challenge',
    entity_id=c1.reference_id,
    new_value=f'category={c1.ai_category_name}, priority={c1.priority}'
)

logs = AuditLog.objects.filter(entity_type='Challenge', entity_id=c1.reference_id).order_by('-timestamp')
for log in logs:
    print(f'[{log.timestamp}] {log.user.username if log.user else "System"} - {log.action} - {log.new_value}')

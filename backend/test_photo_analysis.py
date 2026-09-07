import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import logging
logging.basicConfig(level=logging.WARNING)

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from challenges.models import Challenge, ChallengeMedia
from master_data.models import District
from challenges.views import run_ai_pipeline

User = get_user_model()
citizen = User.objects.filter(role='citizen').first()
district = District.objects.first()

print('--- Test: Photo Evidence Analysis ---')

# Create a dummy image
from PIL import Image
import io
img = Image.new('RGB', (100, 100), color = 'blue')
img_io = io.BytesIO()
img.save(img_io, format='JPEG')
img_file = SimpleUploadedFile("test_flood.jpg", img_io.getvalue(), content_type="image/jpeg")

c1 = Challenge.objects.create(
    title='Huge flooded road near school',
    description='The road is completely underwater and kids cannot cross safely.',
    citizen=citizen,
    district=district
)

# Add media
ChallengeMedia.objects.create(
    challenge=c1,
    file=img_file,
    media_type='image'
)

run_ai_pipeline(c1)
c1.refresh_from_db()

print(f'Category: {c1.ai_category_name}')
print(f'Confidence: {c1.ai_confidence}')
print(f'Reason: {c1.ai_classification_reason}')
print(f'Visual Evidence: {c1.ai_visual_evidence}')
print(f'Priority Score: {c1.priority_score}')
print(f'Priority Reason: {c1.priority_reason}')
print(f'Validation Score: {c1.priority_breakdown.get("validation_score")}')

# Ensure it still works without photo
print('\n--- Test: No Photo ---')
c2 = Challenge.objects.create(
    title='Potholes on main road',
    description='Several deep potholes causing accidents daily.',
    citizen=citizen,
    district=district
)

run_ai_pipeline(c2)
c2.refresh_from_db()
print(f'Category: {c2.ai_category_name}')
print(f'Visual Evidence: {c2.ai_visual_evidence}')
print(f'Validation Score: {c2.priority_breakdown.get("validation_score")}')


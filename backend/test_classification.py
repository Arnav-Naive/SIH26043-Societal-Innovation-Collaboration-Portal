import os, sys, json
import django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.ai_classifier import _classify_with_gemini
from PIL import Image

cats = ['Water Supply', 'Road Infrastructure', 'Healthcare']

print('\n--- 1. Text Classification ---')
try:
    res = _classify_with_gemini('No drinking water', 'no drinking water in our village for 5 days', 'Ranchi', cats)
    print('PASS:\n', json.dumps(res, indent=2))
except Exception as e:
    print('FAIL:', str(e))

print('\n--- 2. Vision Analysis ---')
try:
    from PIL import ImageDraw
    img = Image.new('RGB', (200, 200), color='gray')
    d = ImageDraw.Draw(img)
    d.text((10,10), "Pothole", fill=(255,0,0))
    img.save('dummy.jpg')
    res2 = _classify_with_gemini('Broken road', 'large pothole here', 'Ranchi', cats, ['dummy.jpg'])
    print('PASS:\n', json.dumps(res2, indent=2))
except Exception as e:
    print('FAIL:', str(e))

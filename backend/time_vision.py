import os, sys, time
import django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.ai_classifier import _classify_with_gemini
from PIL import ImageDraw, Image

cats = ['Water Supply', 'Road Infrastructure', 'Healthcare']

img = Image.new('RGB', (200, 200), color='gray')
d = ImageDraw.Draw(img)
d.text((10,10), "Pothole", fill=(255,0,0))
img.save('dummy.jpg')

print("Starting vision call...")
start_time = time.time()
try:
    res = _classify_with_gemini('Broken road', 'large pothole here', 'Ranchi', cats, ['dummy.jpg'])
    end_time = time.time()
    print(f"SUCCESS. Time taken: {end_time - start_time:.2f} seconds")
except Exception as e:
    end_time = time.time()
    print(f"FAILED with {e}. Time taken before failure: {end_time - start_time:.2f} seconds")

import os, sys
import django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(
    model_name=getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash'),
    generation_config={"temperature": 0.2, "max_output_tokens": 256},
)

prompt = """You are an AI tasked with merging similar civic issues.
Here are the descriptions of two issues reported by citizens:
- Our village has no drinking water for the past 5 days.
- Our village has no drinking water for 5 days now.

Provide a consolidated title and a reason for grouping them. Output JSON ONLY:
{
  "title": "<Consolidated Title>",
  "reasoning": "<1-2 sentence explanation of why these reports represent the exact same underlying problem, referencing common locations or symptoms>",
  "confidence": <float between 0.85 and 1.0 representing how certain you are they are the same issue>
}"""

print("Calling API...")
response = model.generate_content(prompt)
print("TEXT:")
print(repr(response.text))
print("FINISH REASON:", response.candidates[0].finish_reason)

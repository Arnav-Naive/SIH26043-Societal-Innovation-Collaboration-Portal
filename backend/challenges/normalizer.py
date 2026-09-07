"""
Multilingual problem intake & normalization service.
Detects the language of a citizen submission and produces a normalized
English version so downstream categorization, matching, and HEI review
always work on clean, structured English text.

FILE PATH: backend/challenges/normalizer.py  (NEW FILE)
"""
from langdetect import detect, DetectorFactory, LangDetectException
from deep_translator import GoogleTranslator

DetectorFactory.seed = 0

SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
}


def detect_language(text: str) -> str:
    if not text or not text.strip():
        return 'en'
    try:
        return detect(text)
    except LangDetectException:
        return 'en'


def normalize_text(text: str, detected_lang: str) -> dict:
    if not text or not text.strip():
        return {'normalized_text': '', 'note': 'Empty submission.'}

    if detected_lang == 'en':
        return {
            'normalized_text': text.strip(),
            'note': 'Submitted in English; no translation needed.',
        }

    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        return {
            'normalized_text': translated,
            'note': f'Auto-translated from detected language "{detected_lang}" to English.',
        }
    except Exception as e:
        return {
            'normalized_text': text.strip(),
            'note': f'Translation unavailable ({str(e)[:80]}); showing original text.',
        }


def process_submission(title: str, description: str) -> dict:
    combined = f'{title}. {description}'
    detected_lang = detect_language(combined)
    result = normalize_text(description, detected_lang)
    return {
        'original_language': detected_lang,
        'normalized_description': result['normalized_text'],
        'normalization_note': result['note'],
    }

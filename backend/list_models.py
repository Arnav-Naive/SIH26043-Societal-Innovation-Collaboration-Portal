import os, urllib.request, json
key = 'AQ.Ab8RN6KWfeETM4anhmuPcIyZ1xIeFxgCNWTmj9TEftvywf_-PA'
url = f'https://generativelanguage.googleapis.com/v1beta/models?key={key}'
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for model in data.get('models', []):
            if 'generateContent' in model.get('supportedGenerationMethods', []):
                print(f"Model: {model['name']}, Methods: {model['supportedGenerationMethods']}")
except Exception as e:
    print('Error:', e)

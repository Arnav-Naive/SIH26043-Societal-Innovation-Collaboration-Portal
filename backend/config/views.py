from django.http import JsonResponse

def handler404(request, exception):
    return JsonResponse({'error': 'Not found'}, status=404)

def handler500(request):
    return JsonResponse({'error': 'Internal server error'}, status=500)

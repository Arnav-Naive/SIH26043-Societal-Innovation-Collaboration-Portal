from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/challenges/', include('challenges.urls')),
    path('api/duplicate-flags/', include('challenges.duplicate_urls')),
    path('api/universities/', include('universities.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/industry/', include('industry.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/master/', include('master_data.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'config.views.handler404'
handler500 = 'config.views.handler500'

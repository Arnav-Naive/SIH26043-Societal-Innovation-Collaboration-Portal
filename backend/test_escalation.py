import os, sys
import django
from django.utils import timezone
from datetime import timedelta

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from challenges.models import Challenge, ProblemTwin
from challenges.problem_twin_detection import _check_escalation
from master_data.models import Category, District
from accounts.models import User

# Setup base data
cat, _ = Category.objects.get_or_create(name='Water Supply')
dist, _ = District.objects.get_or_create(name='Ranchi', defaults={'state': 'Jharkhand'})
cit, _ = User.objects.get_or_create(username='test3cit', defaults={'email': 'test3@cit.com', 'role':'CITIZEN'})

ProblemTwin.objects.all().delete()
Challenge.objects.all().delete()

# Create a manual Twin
twin = ProblemTwin.objects.create(title="Water Shortage Escalation Test", category=cat, district=dist)

now = timezone.now()

# Helper to create reports
def create_reports(count, days_ago):
    timestamp = now - timedelta(days=days_ago)
    for _ in range(count):
        c = Challenge.objects.create(
            title=f"Test {days_ago} days ago", 
            description="Test", 
            category=cat, 
            district=dist, 
            citizen=cit,
            problem_twin=twin
        )
        # Override auto_now_add
        Challenge.objects.filter(id=c.id).update(created_at=timestamp)

print("--- Simulating Time-based Reports ---")
# The logic uses "last 24h" vs "prior 6 days".
# So:
# Prior 6 days (days 1 to 6 ago): Let's put 5 reports 4 days ago.
# Recent 24h (day 0): Let's put 14 reports 0 days ago (today).
# The prompt asked for: Day 1 (3), Day 3 (5), Day 5 (9), Day 7 (14).
# If we mean Day 7 is "today", then:
# Day 1 (6 days ago): 3 reports
# Day 3 (4 days ago): 5 reports
# Day 5 (2 days ago): 9 reports
# Day 7 (0 days ago / today): 14 reports

create_reports(3, 6) # 6 days ago (Day 1)
create_reports(5, 4) # 4 days ago (Day 3)
create_reports(9, 2) # 2 days ago (Day 5)

# At this point, let's see what happens before the surge
reason = _check_escalation(twin)
print(f"Before surge check (Total {twin.linked_challenges.count()}): {reason} | Risk: {twin.risk_level}")

# Now add the surge today (14 reports)
create_reports(14, 0) # Today (Day 7)

reason = _check_escalation(twin)
print(f"After surge check (Total {twin.linked_challenges.count()}): {reason} | Risk: {twin.risk_level}")

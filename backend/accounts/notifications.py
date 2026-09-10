"""
Small helper to create in-app notifications, reusing the existing
Notification model (accounts.models.Notification) which was already
built but not yet wired up anywhere in the codebase.

FILE PATH: backend/accounts/notifications.py  (NEW FILE)
"""
from .models import Notification


def notify(user, title, message, link=''):
    """
    Creates a notification for a user. Never raises — a failed
    notification should never break the action that triggered it.
    """
    if user is None:
        return
    try:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            link=link,
        )
    except Exception:
        pass

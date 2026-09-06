from .models import AuditLog

def log_audit(user, action, entity_type, entity_id, previous_value=None, new_value=None):
    """Utility function to create an AuditLog entry."""
    AuditLog.objects.create(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        previous_value=previous_value or '',
        new_value=new_value or ''
    )

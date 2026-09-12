from django.apps import AppConfig


class ChallengesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'challenges'

    def ready(self):
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Challenges app ready (lazy-loading models to save RAM).")

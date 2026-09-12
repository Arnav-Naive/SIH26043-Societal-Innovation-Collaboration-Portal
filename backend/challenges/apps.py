from django.apps import AppConfig


class ChallengesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'challenges'

    def ready(self):
        import os
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Initializing SentenceTransformer at startup...")
        try:
            from challenges import duplicate_detection
            duplicate_detection.get_embedding_model()
            logger.info("SentenceTransformer initialized successfully at startup.")
        except Exception as e:
            logger.error(f"Failed to initialize SentenceTransformer: {e}")

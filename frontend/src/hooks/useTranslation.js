import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';

export function useTranslation() {
  const { user } = useAuth();
  const lang = user?.preferred_language || 'en';
  
  const t = useMemo(() => {
    return translations[lang] || translations['en'];
  }, [lang]);

  return { t, lang };
}

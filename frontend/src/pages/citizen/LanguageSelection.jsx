import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { translations, SUPPORTED_LANGUAGES } from '../../utils/translations';
import { updateProfile } from '../../api/auth'; // Ensure this exists or use a generic api call

export default function LanguageSelection() {
  const { user, login } = useAuth(); // We can trigger a user state update by reusing logic or directly updating localstorage if login doesn't support generic update
  const navigate = useNavigate();
  
  // Default to what user has, or empty to force selection
  const [selectedLang, setSelectedLang] = useState(user?.preferred_language || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fallback to English for this specific screen if nothing selected yet
  const t = translations[selectedLang] || translations['en'];

  const handleContinue = async () => {
    if (!selectedLang) {
      setError(t.selectToContinue);
      return;
    }
    
    setLoading(true);
    try {
      const res = await updateProfile({ preferred_language: selectedLang });
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(res.data));
      
      // Easiest is to reload to citizen dashboard so AuthContext picks up new user from localStorage
      window.location.href = '/citizen/dashboard';
      
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-page)',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            {t.chooseLanguage}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
            {t.changeLanguageAnytime}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { setSelectedLang(lang.code); setError(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--gray-800)', fontSize: 'var(--font-size-md)' }}>
                      {lang.nativeName}
                    </div>
                    {lang.code !== 'en' && (
                      <div style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)' }}>
                        {lang.label}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div style={{ color: 'var(--color-primary)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && <div className="form-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

          <button 
            className="btn btn-primary btn-block btn-lg" 
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? t.saving : t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}

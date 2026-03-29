import { useState } from 'react';
import type { LoginResponse } from '@workflow/shared-types';
import { useAuthStore } from '@/store/authStore';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', { method: 'POST' });

      if (!res.ok) {
        throw new Error('Falha ao autenticar');
      }

      const data: LoginResponse = await res.json();
      login(data.user, data.token, data.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Workflow de Aprovações</h1>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: '#111827',
            color: '#fff',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p style={{ color: '#dc2626', marginTop: '1rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;

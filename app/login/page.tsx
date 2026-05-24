'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Ошибка');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3.5" stroke="var(--text-2)" strokeWidth="1.5" />
              <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1
          style={{
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
            color: 'var(--text-1)', textAlign: 'center', marginBottom: 8,
          }}
        >
          Трекер
        </h1>
        <p style={{ color: 'var(--text-3)', textAlign: 'center', fontSize: 14, marginBottom: 36 }}>
          Введите пароль для входа
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              background: 'var(--bg-card)',
              color: 'var(--text-1)',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: loading || !password ? 'var(--bg-elevated)' : '#ffffff',
              color: loading || !password ? 'var(--text-3)' : '#0a0a0b',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !password ? 'default' : 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

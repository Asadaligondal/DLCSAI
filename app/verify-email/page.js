'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Sparkles } from 'lucide-react';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing token. Open the link from your email or request a new one in Settings.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
          return;
        }
        setStatus('ok');
        setMessage(data.message || 'Email verified.');
        toast.success('Email verified');

        const auth = localStorage.getItem('token');
        if (auth) {
          const me = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth}` } });
          const meData = await me.json();
          if (meData.success && meData.user) {
            const cur = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...cur, ...meData.user }));
            window.dispatchEvent(new CustomEvent('user-updated', { detail: meData.user }));
          }
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl shadow-card border border-slate-200/60 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">IEP Genius</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Email verification</h1>
        <p className="text-sm text-slate-600 mt-3">
          {status === 'loading' && 'Verifying…'}
          {status !== 'loading' && message}
        </p>
        <div className="mt-6">
          <Link href="/settings" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Back to Settings
          </Link>
          <span className="text-slate-300 mx-2">·</span>
          <Link href="/dashboard" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-slate-500 text-sm">Loading…</div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}

'use client';

import { Suspense, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Lock, ArrowLeft, Sparkles } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await axios.post('/api/auth/reset-password', { token, password });
      if (data.success) {
        toast.success(data.message);
        router.push('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <Link
          href="/login"
          className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-200/60">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">IEP Genius</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 text-center">Set new password</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">Choose a strong password (at least 8 characters).</p>

          {!token ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
              Missing reset token. Use the link from your email or{' '}
              <Link href="/forgot-password" className="font-semibold underline">
                request a new reset
              </Link>
              .
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-sm text-slate-900"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-sm text-slate-900"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-slate-500 text-sm">Loading…</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

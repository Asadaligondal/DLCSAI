'use client';

import { useRouter } from 'next/navigation';
import {
  Brain,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Search,
  FileText,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (!token || !raw) return;
    try {
      const user = JSON.parse(raw);
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      /* ignore corrupt storage */
    }
  }, [router]);

  const features = [
    { icon: Brain, title: 'AI-Powered Drafting', description: 'Turn raw notes into professional narratives. Generate PLAAFPs, goals, and interventions in seconds.' },
    { icon: Shield, title: '100% Compliant', description: 'Aligned with state standards and IDEA regulations. Audit-safe documentation every time.' },
    { icon: Clock, title: 'Save 10+ Hours/Week', description: 'Focus on students, not paperwork. Reduce administrative burden dramatically.' },
  ];

  const benefits = [
    'Florida-compliant IEP templates',
    'AI-generated annual goals',
    'Professional PLAAFP narratives',
    'Services & accommodations recommendations',
    'Export to Word format',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero + guest nav overlay */}
      <section className="relative overflow-hidden bg-brand-hero">
        <nav className="absolute top-0 left-0 right-0 z-50 border-b border-white/15">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-center justify-between h-14">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => router.push('/')}
                >
                  <div className="w-8 h-8 bg-brand-cta rounded-lg flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[15px] font-bold text-white tracking-tight">IEP Genius</span>
                </div>

                <div className="hidden md:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Profile"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="button"
                  className="md:hidden p-2 text-white/90 hover:text-white"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

              {mobileMenuOpen && (
                <div className="md:hidden py-3 border-t border-white/15 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 rounded-lg"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 rounded-lg"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10 rounded-lg"
                  >
                    Profile / Login
                  </button>
                </div>
              )}
            </div>
          </nav>

        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 pt-24 lg:pt-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.2] tracking-tight max-w-xl">
                Write Audit-Safe IEPs in Minutes, Not Hours
              </h1>

              <p className="text-lg font-normal text-white/85 leading-relaxed max-w-lg">
                The AI assistant that drafts goals, PLAAFPs, and interventions instantly. Built for Special Education
                professionals.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="group h-12 px-7 text-sm font-semibold text-white bg-brand-cta hover:bg-brand-cta-hover rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="h-12 px-7 text-sm font-semibold text-white border-2 border-brand-secondary bg-brand-secondary/80 hover:bg-brand-secondary rounded-xl transition-all"
                >
                  View Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                  14-day free trial
                </div>
              </div>
            </div>

            {/* Product mockup */}
            <div className="relative">
              <div
                className="bg-white rounded-xl border border-black/5 p-5 sm:p-6"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 ml-2">IEP Genius</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-brand-emerald shrink-0" />
                  <span className="text-sm text-slate-500 truncate">Ask AI to draft PLAAFP from meeting notes…</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2 text-brand-emerald">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Document preview</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                    <div className="h-2 bg-slate-100 rounded-full w-11/12" />
                    <div className="h-2 bg-slate-100 rounded-full w-4/5" />
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                  </div>
                  <div className="rounded-lg bg-brand-features border border-brand-emerald/15 p-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
                      <span className="text-[11px] font-bold text-brand-emerald">AI suggestion</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-brand-emerald/20 rounded-full w-full" />
                      <div className="h-1.5 bg-brand-emerald/20 rounded-full w-5/6" />
                      <div className="h-1.5 bg-brand-emerald/20 rounded-full w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-xl p-3.5 border border-slate-200/80"
                style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-features flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand-emerald" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-brand-body">10hrs</div>
                    <div className="text-[11px] text-slate-500 font-medium">Saved/Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-[80px] bg-brand-features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl font-bold text-brand-body tracking-tight mb-3">Why Special Ed Teachers Love Us</h2>
            <p className="text-lg text-brand-body/80 max-w-2xl mx-auto leading-relaxed">
              Powerful features designed to make IEP writing faster, easier, and more compliant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 lg:gap-[40px]">
            {features.map((feature, i) => (
              <div key={i} className="text-left">
                <div className="w-12 h-12 rounded-xl bg-white/80 border border-brand-emerald/20 flex items-center justify-center mb-5 shadow-sm">
                  <feature.icon className="w-6 h-6 text-brand-emerald stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-semibold text-brand-body mb-3">{feature.title}</h3>
                <p className="text-base text-brand-body/90 leading-[1.6]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + CTA */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <h2 className="text-3xl font-bold text-brand-body tracking-tight mb-4">
                Everything you need for compliant IEPs
              </h2>
              <p className="text-lg text-brand-body/80 mb-6 leading-relaxed">From initial assessment to final documentation.</p>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-features flex items-center justify-center flex-shrink-0 border border-brand-emerald/25">
                      <CheckCircle2 className="w-3 h-3 text-brand-emerald" />
                    </div>
                    <span className="text-sm text-brand-body font-medium leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border border-slate-200/80 bg-brand-features/40 p-8 text-center"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 text-brand-emerald rounded-full text-sm font-semibold mb-4 border border-brand-emerald/20">
                <Sparkles className="w-3.5 h-3.5" />
                Free Trial
              </div>
              <h3 className="text-2xl font-bold text-brand-body mb-1">Start today</h3>
              <p className="text-sm text-brand-body/75 mb-5">No credit card required</p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full h-12 text-sm font-semibold text-white bg-brand-cta hover:bg-brand-cta-hover rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-features/60 border-t border-brand-emerald/10 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-cta rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-brand-body">IEP Genius</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brand-body/80">
              <a href="#" className="hover:text-brand-emerald transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-brand-emerald transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-brand-emerald transition-colors">
                Contact
              </a>
            </div>
            <div className="text-sm text-brand-body/70">© {new Date().getFullYear()} IEP Genius. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

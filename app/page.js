'use client';

import { useRouter } from 'next/navigation';
import { Brain, Shield, Clock, Sparkles, ArrowRight, CheckCircle2, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!(token && user));
  }, []);

  const features = [
    { icon: Brain, title: "AI-Powered Drafting", description: "Turn raw notes into professional narratives. Generate PLAAFPs, goals, and interventions in seconds.", color: "bg-primary-100 text-primary-600" },
    { icon: Shield, title: "100% Compliant", description: "Aligned with state standards and IDEA regulations. Audit-safe documentation every time.", color: "bg-blue-100 text-blue-600" },
    { icon: Clock, title: "Save 10+ Hours/Week", description: "Focus on students, not paperwork. Reduce administrative burden dramatically.", color: "bg-emerald-100 text-emerald-600" }
  ];

  const benefits = [
    "Florida-compliant IEP templates",
    "AI-generated annual goals",
    "Professional PLAAFP narratives",
    "Services & accommodations recommendations",
    "Export to Word format"
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {isLoggedIn ? (
        <Navbar />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-[15px] font-bold text-slate-900 tracking-tight">IEP Genius</span>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <button onClick={() => router.push('/login')} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Login
                </button>
                <button onClick={() => router.push('/login')} className="h-9 px-5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md">
                  Get Started
                </button>
              </div>

              <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden py-3 border-t border-slate-100 space-y-2">
                <button onClick={() => router.push('/login')} className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Login</button>
                <button onClick={() => router.push('/login')} className="block w-full h-9 text-sm font-semibold text-white bg-primary-600 rounded-lg">Get Started</button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered IEP Writing
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                Write Audit-Safe IEPs in{' '}
                <span className="text-primary-600">Minutes</span>, Not Hours
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed">
                The AI assistant that drafts goals, PLAAFPs, and interventions instantly.
                Built for Special Education professionals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="group h-12 px-7 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="h-12 px-7 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
                >
                  View Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  14-day free trial
                </div>
              </div>
            </div>

            {/* Mockup card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 ml-3">IEP Generation</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-full animate-pulse"></div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="bg-primary-50/50 rounded-xl p-4 border border-primary-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                      <span className="text-[11px] font-bold text-primary-800">AI Generated</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-primary-200/60 rounded-full w-full"></div>
                      <div className="h-2 bg-primary-200/60 rounded-full w-4/5"></div>
                      <div className="h-2 bg-primary-200/60 rounded-full w-11/12"></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 h-9 text-sm font-semibold text-white bg-primary-600 rounded-lg">Accept</button>
                    <button className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Edit</button>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-float p-3.5 border border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">10hrs</div>
                    <div className="text-[11px] text-slate-500 font-medium">Saved/Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Why Special Ed Teachers Love Us</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Powerful features designed to make IEP writing faster, easier, and more compliant.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Everything you need for compliant IEPs</h2>
              <p className="text-lg text-slate-500 mb-6">From initial assessment to final documentation.</p>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 p-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Free Trial
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Start today</h3>
              <p className="text-sm text-slate-500 mb-5">No credit card required</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">IEP Genius</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-xs">2026 IEP Genius</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!(token && user));
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Drafting",
      description: "Turn raw notes into professional narratives. Generate PLAAFPs, goals, and interventions in seconds.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "100% Compliant",
      description: "Aligned with state standards and IDEA regulations. Audit-safe documentation every time.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Clock,
      title: "Save 10+ Hours/Week",
      description: "Focus on students, not paperwork. Reduce administrative burden dramatically.",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const benefits = [
    "Florida-compliant IEP templates",
    "AI-generated annual goals",
    "Professional PLAAFP narratives",
    "Services & accommodations recommendations",
    "Export to Word format"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Conditional Navbar - Show authenticated navbar if logged in, otherwise show landing navbar */}
      {isLoggedIn ? (
        <Navbar />
      ) : (
        <>
      {/* Glassmorphism Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-indigo-600">IEP Genius</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered IEP Writing Assistant
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Write Audit-Safe IEPs in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  Minutes
                </span>
                , Not Hours
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                The AI-powered assistant that drafts goals, PLAAFPs, and interventions instantly. 
                Built for Special Education professionals who want to focus on students, not paperwork.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/login')}
                  className="group px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  View Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Right Mockup */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 ml-4">IEP Generation</span>
                </div>

                {/* Mockup Content */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-900">AI Generated</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 bg-indigo-200 rounded w-full"></div>
                      <div className="h-2.5 bg-indigo-200 rounded w-4/5"></div>
                      <div className="h-2.5 bg-indigo-200 rounded w-11/12"></div>
                      <div className="h-2.5 bg-indigo-200 rounded w-3/4"></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg">
                      Accept
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">10hrs</div>
                    <div className="text-xs text-slate-600">Saved/Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
              Why Special Ed Teachers Love Us
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make IEP writing faster, easier, and more compliant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
                Everything you need for compliant IEPs
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                From initial assessment to final documentation, we've got you covered.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg text-slate-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Free Trial
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Start today</h3>
                <p className="text-slate-600">No credit card required • 14-day trial</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">IEP Genius</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="text-sm">
              © 2026 IEP Genius. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


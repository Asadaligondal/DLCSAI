'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Check, CreditCard, Sparkles, Building2 } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Basic access for teachers getting started with IEP drafting.',
    icon: CreditCard,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    features: ['Generate IEP drafts (limited)', 'Manage students (basic)', 'Export to Word', 'Email support'],
    btnLabel: 'Current Plan',
    btnCls: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    desc: 'For active classrooms — unlimited generations, priority support.',
    icon: Sparkles,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    features: ['Unlimited IEP generations', 'Grouped goals & objectives', 'Priority email support', 'Team sharing & role controls'],
    btnLabel: 'Upgrade to Pro',
    btnCls: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md',
    highlight: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For districts needing SSO, SLA-backed support, and bulk licensing.',
    icon: Building2,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    features: ['SSO / SAML integrations', 'Dedicated account manager', 'Bulk licensing & onboarding', 'Uptime SLA & priority support'],
    btnLabel: 'Contact Sales',
    btnCls: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    highlight: false,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Guest' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <CreditCard className="w-[18px] h-[18px] text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Billing & Plans</h2>
              <p className="text-xs text-slate-500">Manage your subscription and invoices</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-xl border overflow-hidden flex flex-col transition-shadow ${
                      plan.highlight
                        ? 'border-primary-200 shadow-card-hover ring-1 ring-primary-100'
                        : 'border-slate-200/60 shadow-card'
                    }`}
                  >
                    {plan.badge && (
                      <div className="bg-primary-600 text-white text-[11px] font-bold text-center py-1.5 tracking-wide uppercase">
                        {plan.badge}
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg ${plan.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      </div>

                      <div className="mb-3">
                        <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                        {plan.period && <span className="text-sm text-slate-500 font-medium">{plan.period}</span>}
                      </div>

                      <p className="text-sm text-slate-500 mb-5 leading-relaxed">{plan.desc}</p>

                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button className={`w-full h-10 rounded-lg text-sm font-semibold transition-all ${plan.btnCls}`}>
                        {plan.btnLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-10 text-center text-sm text-slate-400">
              All plans include secure storage and regular feature updates. Invoices appear here once a billing provider is connected.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

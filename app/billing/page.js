'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function BillingPage() {
  const [user, setUser] = useState({ name: 'Guest' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar user={user} />

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Billing & Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your subscription and invoices.</p>
        </header>

        <section className="max-w-7xl mx-auto">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Free Tier */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Free</h4>
                <span className="text-xs font-medium text-slate-500">Forever</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">$0<span className="text-sm font-medium text-slate-500">/mo</span></div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Basic access for teachers getting started with IEP drafting.</p>

              <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Generate IEP drafts (limited per month)</li>
                <li>Manage students (basic)</li>
                <li>Export to Word</li>
                <li>Email support</li>
              </ul>

              <div className="mt-auto">
                <button className="w-full py-2 px-4 rounded-md bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 transition">Current Plan</button>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-b from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-900/10 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-700 p-6 flex flex-col transform md:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Pro</h4>
                <span className="text-xs font-medium text-emerald-600">Most popular</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">$19<span className="text-sm font-medium text-slate-500">/mo</span></div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">For active classrooms and power users — more generations, priority support.</p>

              <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <li>Unlimited IEP generations</li>
                <li>Grouped goals & objectives</li>
                <li>Priority email support</li>
                <li>Team sharing and role controls</li>
              </ul>

              <div className="mt-auto">
                <button className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition">Choose Pro</button>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Enterprise</h4>
                <span className="text-xs font-medium text-slate-500">Custom</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Contact<span className="text-sm font-medium text-slate-500">Sales</span></div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">For districts and institutions requiring single-sign-on and SLA-backed support.</p>

              <ul className="mb-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>SSO / SAML integrations</li>
                <li>Dedicated account manager</li>
                <li>Bulk licensing and onboarding</li>
                <li>Uptime SLA and priority support</li>
              </ul>

              <div className="mt-auto">
                <button className="w-full py-2 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition">Contact Sales</button>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>All plans include secure storage and regular feature updates. Invoices and payment methods will appear here when integrated with a billing provider.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

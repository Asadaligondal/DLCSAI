'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Users } from 'lucide-react';

export default function StudentsPage() {
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
              <Users className="w-[18px] h-[18px] text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Manage Classrooms</h2>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-card border border-slate-200/60 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Student Management Module</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                This module is under construction. Soon you will be able to view, edit, and archive student profiles here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

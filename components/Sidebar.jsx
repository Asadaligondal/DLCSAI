"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Home,
  Accessibility,
  ChevronLeft,
  Menu,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [syncUser, setSyncUser] = useState(user);
  const pathname = usePathname();

  useEffect(() => {
    setSyncUser(user);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || user?.role === 'admin') return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.user) return;
        setSyncUser((prev) => ({ ...prev, ...d.user }));
        try {
          const cur = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...cur, ...d.user }));
        } catch {
          /* ignore */
        }
        if (d.user.emailVerified === false && !sessionStorage.getItem('ev-nudge-toast')) {
          sessionStorage.setItem('ev-nudge-toast', '1');
          toast.info('Verify your email in Settings for password recovery.', { autoClose: 8000 });
        }
      })
      .catch(() => {});
  }, [user?.role]);

  const isAdmin = (syncUser || user)?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
    { name: 'Accommodations', icon: Accessibility, path: '/accommodations' },
    { name: 'Manage Classrooms', icon: Users, path: '/students' },
    { name: 'IEP Writer', icon: FileText, path: '/iep-writer', badge: 'WIP' },
    { name: 'Billing / Plan', icon: CreditCard, path: '/billing' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin' || pathname.startsWith('/admin/');
    }
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/students') || pathname.startsWith('/students/');
    }
    return pathname === path;
  };

  return (
    <aside
      className={`h-screen ${collapsed ? 'w-[72px]' : 'w-[260px]'} bg-white border-r border-slate-200/80 flex flex-col transition-all duration-200 flex-shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-slate-100`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">IEP Genius</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? 'hidden' : ''} p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <div className="flex justify-center pt-3 pb-1">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      {!collapsed && syncUser?.role === 'professor' && syncUser?.emailVerified === false && (
        <div className="mx-3 mt-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200/90 text-xs text-amber-950">
          <p className="font-semibold">Verify your email</p>
          <p className="mt-0.5 text-amber-900/85 leading-snug">Needed for password recovery if you forget your password.</p>
          <Link href="/settings" className="mt-1.5 inline-block font-semibold text-amber-900 underline underline-offset-2">
            Open Settings
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/"
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Home className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Home</span>}
        </Link>

        {!collapsed && (
          <div className="pt-4 pb-2 px-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Workspace</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-primary-600' : ''}`} />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        {!collapsed && (syncUser || user) && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
              {(syncUser || user).name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{(syncUser || user).name}</div>
              <div className="text-[11px] text-slate-500 truncate">{(syncUser || user).email || 'Professor'}</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

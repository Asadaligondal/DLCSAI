"use client";

import { useState } from 'react';
import Link from 'next/link';
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
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Accommodations', icon: Accessibility, path: '/accommodations' },
    { name: 'Manage Classrooms', icon: Users, path: '/students' },
    { name: 'IEP Writer', icon: FileText, path: '/iep-writer', badge: 'WIP' },
    { name: 'Billing / Plan', icon: CreditCard, path: '/billing' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/students/');
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
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.email || 'Professor'}</div>
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

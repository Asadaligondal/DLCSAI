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
  Menu
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Accommodations', icon: Accessibility, path: '/accommodations' },
    { name: 'Manage Classrooms', icon: Users, path: '/students' },
    { name: 'IEP Writer', icon: FileText, path: '/iep-writer' },
    { name: 'Billing / Plan', icon: CreditCard, path: '/billing' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const pathname = usePathname();

  return (
    <aside
      className={`h-screen ${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-200`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="text-white font-bold text-lg">IEP</div>
          {!collapsed && <div className="text-white font-bold text-xl">Genius</div>}
        </div>

        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-800/60"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <Link href="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors ${'hover:bg-slate-800'}`}>
          <Home className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Home</span>}
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className={`w-full p-3 flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

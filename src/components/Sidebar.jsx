'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/students' },
    { name: 'My Students', icon: Users, path: '/students' },
    { name: 'IEP Writer', icon: FileText, path: '/iep-writer' },
    { name: 'Billing / Plan', icon: CreditCard, path: '/billing' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (p) => pathname === p;

  return (
    <aside
      className={`h-screen ${collapsed ? 'w-20' : 'w-64'} bg-white/60 backdrop-blur-md text-slate-700 flex flex-col transition-all duration-200 border-r border-slate-100`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="text-slate-900 font-bold text-lg">IEP</div>
          {!collapsed && <div className="text-slate-900 font-bold text-xl">Genius</div>}
        </div>

        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-100"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <Link href="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors ${isActive('/') ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'}`}>
          <Home className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Home</span>}
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg transition-colors ${
                active ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onLogout}
          className={`w-full p-3 flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 hover:bg-red-50 rounded transition-colors text-sm text-slate-700`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

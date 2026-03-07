'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Target, LogOut, User, Settings, LayoutDashboard, Home, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = () => {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) {
        setUserRole(u.role);
        setUserName(u.name);
        setProfilePicture(u.profilePicture || null);
      }
    };
    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allNavItems = [
    { name: 'Home', path: '/', icon: Home, roles: ['admin', 'professor'] },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['professor'] },
    { name: 'Teacher/Service Providers', path: '/professors', icon: Users, roles: ['admin'] },
    { name: 'Goals', path: '/goals', icon: Target, roles: ['admin'] }
  ];

  const hideTopLinksOnPaths = pathname && (pathname.startsWith('/students') || pathname.startsWith('/services'));
  const navItems = allNavItems.filter(item => {
    if (!item.roles.includes(userRole)) return false;
    if (hideTopLinksOnPaths && (item.name === 'Home' || item.name === 'Dashboard')) return false;
    return true;
  });

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-full px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">IEP Genius</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/settings" className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <Settings className="w-[18px] h-[18px]" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-primary-100 ring-2 ring-white">
                {profilePicture ? (
                  <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-primary-700">{userName?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-float border border-slate-200/60 overflow-hidden py-1">
                {userName && (
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900">{userName}</div>
                    <div className="text-xs text-slate-500 capitalize">{userRole}</div>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

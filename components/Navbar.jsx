'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, Settings, Sparkles } from 'lucide-react';

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

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-full px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-cta rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-brand-body tracking-tight">IEP Genius</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/settings" className="p-2 rounded-lg text-brand-body/60 hover:text-brand-body hover:bg-slate-50 transition-colors">
            <Settings className="w-[18px] h-[18px]" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-brand-features ring-2 ring-white">
                {profilePicture ? (
                  <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-brand-emerald">{userName?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-float border border-slate-200/60 overflow-hidden py-1">
                {userName && (
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-sm font-semibold text-brand-body">{userName}</div>
                    <div className="text-xs text-brand-body/60 capitalize">{userRole}</div>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="w-full px-4 py-2.5 text-left text-sm text-brand-body hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-brand-body/45" />
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

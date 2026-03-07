'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { User, Lock, Bell, Globe, Camera, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState({ name: 'Guest', email: '' });
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfilePicture(data.user.profilePicture);
      }
    } catch {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        setProfilePicture(u.profilePicture || null);
      }
      fetchUser();
    } catch {}
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.message || 'Upload failed'); return; }
      setProfilePicture(data.profilePicture);
      const updatedUser = { ...user, profilePicture: data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedUser }));
    } catch { setUploadError('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const inputCls = "w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all";
  const selectCls = `${inputCls} bg-white`;

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 h-16 flex items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <SettingsIcon className="w-[18px] h-[18px] text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Settings</h2>
              <p className="text-xs text-slate-500">Manage your account and preferences</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-2xl space-y-5">
            {/* Profile */}
            <section className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name</label>
                    <input type="text" defaultValue={user?.name || ''} placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <input type="email" defaultValue={user?.email || ''} placeholder="you@school.edu" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Profile photo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold overflow-hidden ring-2 ring-white">
                        {profilePicture ? (
                          <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      {uploading && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {profilePicture ? 'Change' : 'Upload'}
                      </button>
                      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Password */}
            <section className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Password</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current password</label>
                    <input type="password" placeholder="Enter current password" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">New password</label>
                    <input type="password" placeholder="New password" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm password</label>
                    <input type="password" placeholder="Confirm new password" className={inputCls} />
                  </div>
                </div>
                <button className="h-9 px-4 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all hover:shadow-md">
                  Update password
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
              </div>
              <div className="p-5 space-y-3">
                {['Email notifications', 'IEP reminders', 'Student updates'].map((label) => (
                  <label key={label} className="flex items-center justify-between py-1 cursor-pointer group">
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-checked:bg-primary-500 rounded-full transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform"></div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Preferences */}
            <section className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Language</label>
                  <select className={selectCls}>
                    <option>English</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timezone</label>
                  <select className={selectCls}>
                    <option>Eastern Time (ET)</option>
                    <option>Central Time (CT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Pacific Time (PT)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

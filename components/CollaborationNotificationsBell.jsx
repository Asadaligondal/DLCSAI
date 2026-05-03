'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Bell, Users } from 'lucide-react';

export const NOTIFICATIONS_INVALIDATE_EVENT = 'dlcsai-notifications-invalidate';

export function invalidateNotificationsCache() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_INVALIDATE_EVENT));
  }
}

export default function CollaborationNotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const onInv = () => fetchList();
    window.addEventListener(NOTIFICATIONS_INVALIDATE_EVENT, onInv);
    return () => window.removeEventListener(NOTIFICATIONS_INVALIDATE_EVENT, onInv);
  }, [fetchList]);

  useEffect(() => {
    if (!open) return;
    fetchList();
  }, [open, fetchList]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        panelRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const markReadAndNavigate = async (n) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      if (!n.readAt) {
        await axios.patch(
          `/api/notifications/${n._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      /* still navigate */
    }
    setOpen(false);
    invalidateNotificationsCache();
    router.push(`/students/${n.studentId}/collaborate`);
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 mt-1 w-[min(100vw-2rem,20rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg z-50 flex flex-col"
        >
          <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-600">
            Notifications
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">No notifications</div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((n) => {
                  const unread = !n.readAt;
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => markReadAndNavigate(n)}
                        className={`w-full text-left px-3 py-2.5 flex gap-2 transition-colors hover:bg-slate-50 ${
                          unread ? 'bg-primary-50/70 border-l-2 border-primary-500' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-slate-800 leading-snug">
                            {n.title || 'Team collaboration'}
                          </p>
                          <p className="text-[12px] text-slate-600 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FileText, UserPlus, CheckCircle2, Clock, Users } from 'lucide-react';
import { invalidateNotificationsCache } from '@/components/CollaborationNotificationsBell';

function timeAgo(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EVENT_CONFIG = {
  iep_reviewed: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50', verb: 'IEP reviewed' },
  iep_generated: { icon: FileText, color: 'text-blue-500 bg-blue-50', verb: 'IEP generated' },
  student_added: { icon: UserPlus, color: 'text-primary-500 bg-primary-50', verb: 'Student added' },
  collab_invite: { icon: Users, color: 'text-violet-600 bg-violet-50', verb: 'Team invite' },
};

export default function ActivityFeed({ students = [], userRole = 'professor' }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (userRole !== 'professor') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setNotifLoading(true);
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined' || userRole !== 'professor') return;
    const onInv = () => fetchNotifications();
    window.addEventListener('dlcsai-notifications-invalidate', onInv);
    return () => window.removeEventListener('dlcsai-notifications-invalidate', onInv);
  }, [fetchNotifications, userRole]);

  const studentEvents = useMemo(() => {
    const items = [];

    students.forEach((s) => {
      const sid = s._id != null ? String(s._id) : '';
      items.push({
        kind: 'student',
        type: 'student_added',
        name: s.name,
        date: s.createdAt || s._id?.toString().substring(0, 8),
        id: `add-${s._id}`,
        studentId: sid,
      });

      const iep = s.iep_plan_data;
      if (iep) {
        const hasContent =
          iep.original_ai_draft?.plaafp_narrative ||
          (iep.original_ai_draft?.annual_goals?.length > 0);

        if (hasContent) {
          items.push({
            kind: 'student',
            type: 'iep_generated',
            name: s.name,
            date: iep.last_updated || s.createdAt,
            id: `gen-${s._id}`,
            studentId: sid,
          });
        }

        if (iep.is_reviewed) {
          items.push({
            kind: 'student',
            type: 'iep_reviewed',
            name: s.name,
            date: iep.last_updated || s.createdAt,
            id: `rev-${s._id}`,
            studentId: sid,
          });
        }
      }
    });

    return items;
  }, [students]);

  const mergedEvents = useMemo(() => {
    const collabItems =
      userRole === 'professor'
        ? notifications.map((n) => ({
            kind: 'collab',
            type: 'collab_invite',
            id: `notif-${n._id}`,
            notificationId: n._id,
            name: n.studentName || 'Student',
            date: n.createdAt,
            studentId: n.studentId,
            unread: !n.readAt,
            body: n.body || n.title,
          }))
        : [];

    const combined = [
      ...collabItems,
      ...studentEvents.map((ev) => ({
        ...ev,
        kind: 'student',
        unread: false,
      })),
    ];

    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    return combined.slice(0, 20);
  }, [notifications, studentEvents, userRole]);

  const handleCollabClick = async (ev) => {
    const token = localStorage.getItem('token');
    if (!token || !ev.notificationId) return;
    try {
      if (ev.unread) {
        await axios.patch(
          `/api/notifications/${ev.notificationId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      /* navigate anyway */
    }
    invalidateNotificationsCache();
    router.push(`/students/${ev.studentId}/collaborate`);
  };

  const handleStudentEventClick = (ev) => {
    if (ev.studentId) router.push(`/students/${ev.studentId}`);
  };

  const empty =
    mergedEvents.length === 0 && !notifLoading && students.length === 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
      </div>

      {empty ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400">
          No activity yet. Add your first student to get started.
        </div>
      ) : (
        <ul className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
          {mergedEvents.map((ev) => {
            const cfg = EVENT_CONFIG[ev.type];
            const Icon = cfg.icon;
            const isCollab = ev.kind === 'collab';
            const unread = isCollab && ev.unread;

            const go = () => {
              if (isCollab) handleCollabClick(ev);
              else handleStudentEventClick(ev);
            };

            return (
              <li
                key={ev.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-slate-50/50 ${
                  unread ? 'bg-primary-50/60 border-l-2 border-primary-500' : ''
                }`}
                onClick={go}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-slate-700 leading-snug">
                    {isCollab ? (
                      <>
                        <span className="font-medium">{ev.name}</span>
                        <span className="text-slate-500"> — {cfg.verb}</span>
                        {unread ? (
                          <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary-600">New</span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{ev.name}</span>
                        <span className="text-slate-500"> — {cfg.verb}</span>
                      </>
                    )}
                  </p>
                  {isCollab && ev.body ? (
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{ev.body}</p>
                  ) : null}
                  <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(ev.date)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

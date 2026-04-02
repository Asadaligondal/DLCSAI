'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, UserPlus, CheckCircle2, Clock } from 'lucide-react';

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
};

export default function ActivityFeed({ students = [] }) {
  const router = useRouter();

  const events = useMemo(() => {
    const items = [];

    students.forEach((s) => {
      const sid = s._id != null ? String(s._id) : '';
      items.push({
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
            type: 'iep_generated',
            name: s.name,
            date: iep.last_updated || s.createdAt,
            id: `gen-${s._id}`,
            studentId: sid,
          });
        }

        if (iep.is_reviewed) {
          items.push({
            type: 'iep_reviewed',
            name: s.name,
            date: iep.last_updated || s.createdAt,
            id: `rev-${s._id}`,
            studentId: sid,
          });
        }
      }
    });

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items.slice(0, 12);
  }, [students]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400">
          No activity yet. Add your first student to get started.
        </div>
      ) : (
        <ul className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
          {events.map((ev) => {
            const cfg = EVENT_CONFIG[ev.type];
            const Icon = cfg.icon;
            const go = () => {
              if (ev.studentId) router.push(`/students/${ev.studentId}`);
            };
            return (
              <li
                key={ev.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
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
                    <span className="font-medium">{ev.name}</span>
                    <span className="text-slate-500"> — {cfg.verb}</span>
                  </p>
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

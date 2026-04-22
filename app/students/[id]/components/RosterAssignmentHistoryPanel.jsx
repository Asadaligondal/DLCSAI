'use client';

import { History } from 'lucide-react';

function lineUser(u) {
  if (!u) return '—';
  return u.name || u.email || 'Unknown';
}

function lineRoom(r) {
  if (!r) return 'Unassigned';
  return r.name || '—';
}

/**
 * Read-only roster / classroom reassignment log (admin actions).
 * Data comes from GET /api/students/[id] as formatted rosterAssignmentHistory.
 */
export default function RosterAssignmentHistoryPanel({ history }) {
  const rows = Array.isArray(history) ? history : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Roster & classroom history</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            When an <span className="font-semibold text-slate-700">admin</span> assigns this student to a case manager or
            classroom, a row is added here. Case managers can view this log but cannot change assignments here.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500 pl-[52px]">No reassignment events recorded yet.</p>
      ) : (
        <ul className="mt-5 space-y-4 pl-[52px] border-l border-slate-200 ml-5">
          {rows.map((row, i) => (
            <li key={i} className="relative pl-4 -ml-px border-l-2 border-primary-400/80 first:mt-0">
              <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary-500 ring-4 ring-white" />
              <time className="text-[11px] font-semibold text-slate-500 tabular-nums">
                {row.at ? new Date(row.at).toLocaleString() : '—'}
              </time>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">By:</span> {lineUser(row.actor)}
                {row.actor?.email ? <span className="text-slate-400"> · {row.actor.email}</span> : null}
              </p>
              <p className="mt-1.5 text-xs text-slate-700">
                <span className="font-semibold text-slate-800">From:</span> {lineUser(row.fromCaseManager)} ·{' '}
                {lineRoom(row.fromClassroom)}
              </p>
              <p className="mt-0.5 text-xs text-slate-700">
                <span className="font-semibold text-slate-800">To:</span> {lineUser(row.toCaseManager)} ·{' '}
                {lineRoom(row.toClassroom)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

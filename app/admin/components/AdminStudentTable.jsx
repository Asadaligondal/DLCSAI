'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, Users, ExternalLink, BookOpen } from 'lucide-react';

/**
 * Read-only student table for admin (classroom / provider scoped).
 * Each row links to the existing /students/[id] IEP view.
 */
export default function AdminStudentTable({
  students,
  emptyTitle = 'No students yet',
  emptyHint = 'When a provider adds students, they will appear here.',
  showClassroomCol = false,
  showCaseManagerCol = false,
  /** Provider “all students” list: slimmer columns, no row action; use profile to assign. */
  rosterOnlyView = false,
  onRowAction, // optional: (student) => void — e.g. "Move to classroom"
  actionLabel = 'Move',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const base =
        s.name?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase?.().includes(q) ||
        s.createdBy?.name?.toLowerCase?.().includes(q);
      if (rosterOnlyView) return base;
      return (
        base ||
        s.gradeLevel?.toLowerCase?.().includes(q) ||
        s.primaryExceptionality?.toLowerCase?.().includes(q)
      );
    });
  }, [students, searchQuery, rosterOnlyView]);

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-slate-900">
          Students <span className="text-slate-400 font-normal">({students.length})</span>
        </h2>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {searchQuery ? 'No students match your search' : emptyTitle}
          </p>
          {!searchQuery ? (
            <p className="mt-1 text-xs text-slate-400">{emptyHint}</p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                {!rosterOnlyView ? (
                  <>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Primary exceptionality</th>
                  </>
                ) : null}
                {showCaseManagerCol && (
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Case manager</th>
                )}
                {showClassroomCol && (
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Classroom</th>
                )}
                {!rosterOnlyView ? (
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accommodations</th>
                ) : null}
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Open</th>
                {!rosterOnlyView && onRowAction ? (
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-xs">{s.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                      {s.hasRosterReassignmentHistory ? (
                        <span
                          className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90"
                          title="This student has admin roster or classroom reassignment history"
                        >
                          History
                        </span>
                      ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 font-mono tabular-nums">{s.studentId}</td>
                  {!rosterOnlyView ? (
                    <>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{s.gradeLevel || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 truncate max-w-[220px]">
                        {s.primaryExceptionality || '—'}
                      </td>
                    </>
                  ) : null}
                  {showCaseManagerCol && (
                    <td className="px-5 py-3.5 text-sm text-slate-600 truncate max-w-[180px]">
                      {s.createdBy?.name || '—'}
                    </td>
                  )}
                  {showClassroomCol && (
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {s.classroomId?.name ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                          <BookOpen className="w-3 h-3" />
                          {s.classroomId.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  )}
                  {!rosterOnlyView ? (
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700 tabular-nums">
                      {s.accommodations_count || 0}
                    </td>
                  ) : null}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                      <Link
                        href={`/students/${s._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                      >
                        IEP <ExternalLink className="w-3 h-3" />
                      </Link>
                      {rosterOnlyView ? (
                        <Link
                          href={`/students/${s._id}/profile`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                        >
                          Profile
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  {!rosterOnlyView && onRowAction ? (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onRowAction(s)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                      >
                        {actionLabel}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

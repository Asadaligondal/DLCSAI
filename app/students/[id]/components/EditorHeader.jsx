"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LayoutDashboard, User, FileText } from 'lucide-react';

export default function EditorHeader({ student }) {
  const router = useRouter();

  const studentName = student
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'
    : 'Student';

  const crumbs = [
    { label: 'Dashboard', icon: LayoutDashboard, onClick: () => router.push('/dashboard') },
    { label: studentName, icon: User, onClick: () => router.push('/dashboard') },
    { label: 'IEP Plan', icon: FileText },
  ];

  return (
    <nav className="mb-2 flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
            {isLast ? (
              <span className="flex items-center gap-1.5 px-2 py-1 text-slate-800 font-semibold">
                <crumb.icon className="w-3.5 h-3.5" />
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={crumb.onClick}
                className="flex items-center gap-1.5 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors font-medium"
              >
                <crumb.icon className="w-3.5 h-3.5" />
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, FileText, User } from 'lucide-react';

export default function StudentWorkspaceNav({ studentId, studentName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const base = `/students/${studentId}`;
  const profilePath = `${base}/profile`;
  const onProfile = pathname === profilePath;
  const onIep = pathname === base;

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const label = studentName?.trim() || 'Student';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1.5 max-w-[200px] sm:max-w-[280px] rounded-lg px-2.5 py-1.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/80 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-slate-200/80 bg-white py-1 shadow-float"
          role="menu"
        >
          <Link
            href={base}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 text-sm ${onIep ? 'bg-primary-50 text-primary-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4 shrink-0 opacity-70" />
            IEP plan
          </Link>
          <Link
            href={profilePath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 text-sm ${onProfile ? 'bg-primary-50 text-primary-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <User className="w-4 h-4 shrink-0 opacity-70" />
            Student profile
          </Link>
        </div>
      )}
    </div>
  );
}

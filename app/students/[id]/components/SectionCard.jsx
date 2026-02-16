"use client";

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SectionCard({ id, title, subtitle, count, rightUtilities, open = true, onToggle, children }) {
  const isControlled = typeof onToggle === 'function';

  return (
    <div id={id} style={{ scrollMarginTop: '120px' }} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h4>
            {typeof count === 'number' && (
              <span className="text-xs font-medium text-slate-600 px-2.5 py-1 rounded-md bg-slate-200/60">{count}</span>
            )}
          </div>
          {subtitle && <div className="text-sm text-slate-500 mt-1.5 leading-snug">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-3">
          {rightUtilities}
          {isControlled ? (
            <button onClick={onToggle} className="p-2 rounded-lg hover:bg-slate-200/50 transition-colors" aria-label={open ? 'Collapse' : 'Expand'}>
              {open ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-5">
        {children}
      </div>
    </div>
  );
}

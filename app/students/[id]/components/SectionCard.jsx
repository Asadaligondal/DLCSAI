"use client";

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SectionCard({ id, title, subtitle, count, rightUtilities, open = true, onToggle, children }) {
  const isControlled = typeof onToggle === 'function';

  return (
    <div id={id} style={{ scrollMarginTop: '120px' }} className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-[15px] font-semibold text-slate-900">{title}</h4>
            {typeof count === 'number' && (
              <span className="text-xs text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100">{count}</span>
            )}
          </div>
          {subtitle && <div className="text-[13px] text-slate-500 mt-1">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-3">
          {rightUtilities}
          {isControlled ? (
            <button onClick={onToggle} className="p-1 rounded hover:bg-slate-50">
              {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

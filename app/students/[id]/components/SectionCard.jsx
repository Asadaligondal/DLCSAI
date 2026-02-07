"use client";

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SectionCard({ id, title, subtitle, count, rightUtilities, open = true, onToggle, children }) {
  const isControlled = typeof onToggle === 'function';

  return (
    <div id={id} style={{ scrollMarginTop: '120px' }} className="bg-white border border-gray-100 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            {typeof count === 'number' && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{count}</span>
            )}
          </div>
          {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
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

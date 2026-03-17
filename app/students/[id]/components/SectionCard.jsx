"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';

const ACCENTS = {
  slate:   { left: 'border-l-slate-300',   bg: 'bg-slate-50/40',   badge: 'bg-slate-100 text-slate-600' },
  blue:    { left: 'border-l-blue-400',    bg: 'bg-blue-50/30',    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  indigo:  { left: 'border-l-indigo-400',  bg: 'bg-indigo-50/30',  badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  purple:  { left: 'border-l-purple-400',  bg: 'bg-purple-50/30',  badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' },
  emerald: { left: 'border-l-emerald-400', bg: 'bg-emerald-50/30', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  amber:   { left: 'border-l-amber-400',   bg: 'bg-amber-50/30',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  rose:    { left: 'border-l-rose-400',    bg: 'bg-rose-50/30',    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  violet:  { left: 'border-l-violet-400',  bg: 'bg-violet-50/30',  badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  orange:  { left: 'border-l-orange-400',  bg: 'bg-orange-50/30',  badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
};

export default function SectionCard({ id, title, subtitle, count, rightUtilities, open = true, onToggle, children, accent = 'slate', nested = false }) {
  const isControlled = typeof onToggle === 'function';
  const a = ACCENTS[accent] || ACCENTS.slate;

  const outerClass = nested
    ? `bg-white rounded-lg border border-slate-200/70 overflow-hidden`
    : `bg-white rounded-xl border border-slate-200/80 border-l-[3px] ${a.left} shadow-sm overflow-hidden`;

  return (
    <div id={id} style={id ? { scrollMarginTop: '120px' } : undefined} className={outerClass}>
      <div
        role={isControlled ? 'button' : undefined}
        tabIndex={isControlled ? 0 : undefined}
        onClick={isControlled ? onToggle : undefined}
        onKeyDown={isControlled ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } } : undefined}
        className={`flex items-center justify-between px-5 ${nested ? 'py-3' : 'py-3.5'} ${a.bg} ${isControlled ? 'cursor-pointer select-none hover:brightness-[0.97] transition-all' : ''}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className={`${nested ? 'text-sm' : 'text-[15px]'} font-semibold text-slate-900 tracking-tight`}>{title}</h4>
            {typeof count === 'number' && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.badge}`}>{count}</span>
            )}
          </div>
          {subtitle && <div className={`${nested ? 'text-[11px]' : 'text-xs'} text-slate-500 mt-0.5 leading-snug`}>{subtitle}</div>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {rightUtilities}
          {isControlled && (
            <div className={`p-1 text-slate-400 transition-transform duration-300 ease-in-out ${open ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className={`${nested ? 'px-4 py-3' : 'px-5 py-4'} border-t border-slate-100 transition-opacity duration-300 ease-in-out ${open ? 'opacity-100 delay-100' : 'opacity-0'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

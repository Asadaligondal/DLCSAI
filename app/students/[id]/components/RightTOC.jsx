"use client";

import React from 'react';

export default function RightTOC({ sections = [] }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="hidden lg:block w-[260px]">
      <div className="sticky top-24 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">On this page</h4>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <button onClick={() => scrollTo(s.id)} className="text-left w-full py-2 px-2 -mx-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">{s.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

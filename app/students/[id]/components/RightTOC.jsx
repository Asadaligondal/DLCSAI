"use client";

import React from 'react';

export default function RightTOC({ sections = [] }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="hidden lg:block w-[260px]">
      <div className="sticky top-24 p-4 bg-white border border-gray-100 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">On this page</h4>
        <ul className="space-y-2 text-sm text-slate-600">
          {sections.map((s) => (
            <li key={s.id}>
              <button onClick={() => scrollTo(s.id)} className="text-left w-full hover:text-slate-900 hover:underline">{s.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

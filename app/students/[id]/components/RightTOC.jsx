"use client";

import React, { useState, useEffect } from 'react';

export default function RightTOC({ sections = [] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="hidden lg:block w-[260px]">
      <div className="sticky top-24 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">On this page</h4>
        <ul className="space-y-0.5">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => scrollTo(s.id)}
                className={`text-left w-full py-1.5 px-2.5 -mx-1 text-[13px] rounded-md transition-colors ${
                  activeId === s.id
                    ? 'text-indigo-700 bg-indigo-50 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

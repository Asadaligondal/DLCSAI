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
    <aside className="hidden lg:block self-start sticky top-16">
      <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl shadow-card">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2">On this page</h4>
        <ul className="space-y-0.5">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => scrollTo(s.id)}
                className={`text-left w-full py-1.5 px-2 text-[12px] rounded-md transition-colors ${
                  activeId === s.id
                    ? 'text-primary-700 bg-primary-50 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
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

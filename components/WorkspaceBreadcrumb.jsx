'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

/**
 * items: { label: string, icon?: LucideIcon, href?: string }[]
 * Last item is shown as current (semibold). Earlier items with href navigate; without href render as plain label.
 */
export default function WorkspaceBreadcrumb({ items = [] }) {
  const router = useRouter();
  if (!items.length) return null;

  return (
    <nav className="mb-2 flex items-center gap-1 text-sm flex-wrap" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const Icon = item.icon;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            {isLast ? (
              <span className="flex items-center gap-1.5 px-2 py-1 text-slate-800 font-semibold">
                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                {item.label}
              </span>
            ) : item.href ? (
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className="flex items-center gap-1.5 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors font-medium"
              >
                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                {item.label}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 text-slate-600 font-medium">
                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

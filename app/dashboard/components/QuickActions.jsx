'use client';

import { Plus, Upload, Shield, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACTIONS = [
  { key: 'add',   label: 'Add Student',            icon: Plus,     color: 'primary', route: null },
  { key: 'docs',  label: 'Upload Documents',        icon: Upload,   color: 'blue',    route: '/iep-writer' },
  { key: 'accom', label: 'Accommodations',          icon: Shield,   color: 'emerald', route: '/accommodations' },
  { key: 'goals', label: 'Goal Bank',               icon: FileText, color: 'amber',   route: '/goals' },
];

const COLOR_MAP = {
  primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-100',
  blue:    'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  amber:   'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
};

export default function QuickActions({ onAddStudent }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map(({ key, label, icon: Icon, color, route }) => (
        <button
          key={key}
          type="button"
          onClick={() => (route ? router.push(route) : onAddStudent?.())}
          className="group flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all text-left"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${COLOR_MAP[color]}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

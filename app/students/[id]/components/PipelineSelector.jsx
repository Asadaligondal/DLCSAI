"use client";

import React from 'react';
import { Zap, Layers, Target } from 'lucide-react';

const STRATEGIES = [
  {
    key: 'baseline',
    label: 'A: Baseline',
    shortLabel: '6 queries',
    description: '6 independent queries by student attribute (exceptionalities, weaknesses, accommodations, custom goals, strengths, instructional setting). Global dedup to 60 chunks.',
    icon: Zap,
    color: 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-100'
  },
  {
    key: 'grouped',
    label: 'B: Grouped',
    shortLabel: '3-4 queries',
    description: 'Merges related axes: Needs (except. + weaknesses), Support (accomm. + setting), Custom Goals, Strengths. Score threshold > 0.4 filters noise.',
    icon: Layers,
    color: 'text-amber-600 bg-amber-50 border-amber-200 ring-amber-100'
  },
  {
    key: 'section_aligned',
    label: 'C: Section-Aligned',
    shortLabel: '5 queries',
    description: '5 purpose-built queries, one per IEP section. Direct 1:1 routing — each section gets its own dedicated chunk pool. No cross-section dedup.',
    icon: Target,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-100'
  }
];

export default function PipelineSelector({ value, onChange, disabled }) {
  const selected = STRATEGIES.find(s => s.key === value) || STRATEGIES[0];

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl shadow-card overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">RAG Pipeline</span>
        <div className="flex items-center gap-1.5">
          {STRATEGIES.map(s => {
            const Icon = s.icon;
            const isActive = s.key === value;
            return (
              <button
                key={s.key}
                onClick={() => !disabled && onChange(s.key)}
                disabled={disabled}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${isActive
                    ? `${s.color} ring-2 shadow-sm`
                    : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
                <span className="text-[10px] opacity-70">({s.shortLabel})</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-3 pt-0">
        <p className="text-[12px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">{selected.label}:</span>{' '}
          {selected.description}
        </p>
      </div>
    </div>
  );
}

export { STRATEGIES };

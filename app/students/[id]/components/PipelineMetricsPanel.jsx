"use client";

import React, { useState } from 'react';
import { ChevronDown, Zap, Layers, Target, Clock, Hash, BarChart3, Database } from 'lucide-react';

const PIPELINE_META = {
  baseline: { label: 'A: Baseline', icon: Zap, accent: 'border-blue-200 bg-blue-50/30', headerBg: 'bg-blue-50', headerText: 'text-blue-700' },
  grouped: { label: 'B: Grouped', icon: Layers, accent: 'border-amber-200 bg-amber-50/30', headerBg: 'bg-amber-50', headerText: 'text-amber-700' },
  section_aligned: { label: 'C: Section-Aligned', icon: Target, accent: 'border-emerald-200 bg-emerald-50/30', headerBg: 'bg-emerald-50', headerText: 'text-emerald-700' }
};

const SECTION_SHORT = {
  exceptionality_goals: 'Except. Goals',
  broad_goals: 'Broad Goals',
  narratives: 'Narratives',
  accommodations_interventions: 'Accomm/Interv',
  custom_goals: 'Custom Goals'
};

function formatTime(ms) {
  if (!ms) return '--';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function MetricRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <div className="text-right">
        <span className="text-[12px] font-semibold text-slate-800">{value}</span>
        {sub && <span className="text-[10px] text-slate-400 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

function PipelineColumn({ strategyKey, data }) {
  const meta = PIPELINE_META[strategyKey];
  const Icon = meta.icon;
  const m = data?.metrics;
  const hasData = !!m && m.queryCount > 0;

  return (
    <div className={`flex-1 min-w-0 border rounded-xl overflow-hidden ${meta.accent}`}>
      <div className={`px-3 py-2 ${meta.headerBg} border-b ${meta.accent.split(' ')[0]}`}>
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${meta.headerText}`} />
          <span className={`text-[12px] font-bold ${meta.headerText}`}>{meta.label}</span>
        </div>
        {data?.generatedAt ? (
          <span className="text-[10px] text-slate-500">{timeAgo(data.generatedAt)}</span>
        ) : (
          <span className="text-[10px] text-slate-400 italic">not yet run</span>
        )}
      </div>

      {hasData ? (
        <div className="px-3 py-2 space-y-0">
          <MetricRow icon={Hash} label="Queries" value={m.queryCount} />
          <MetricRow icon={Clock} label="Total" value={formatTime(m.retrievalTimeMs)} />
          <MetricRow label="Embed" value={formatTime(m.embeddingTimeMs)} />
          <MetricRow label="Search" value={formatTime(m.searchTimeMs)} />
          <MetricRow label="Tokens (est)" value={m.embeddingTokensEstimate || '--'} />

          <div className="border-t border-slate-200/60 my-1.5" />

          <MetricRow icon={Database} label="Chunks raw" value={m.chunksRawTotal} />
          <MetricRow label="After dedup" value={m.chunksAfterDedup} />

          <div className="border-t border-slate-200/60 my-1.5" />

          <MetricRow icon={BarChart3} label="Score range" value={`${m.scoreMin} – ${m.scoreMax}`} />
          <MetricRow label="Mean" value={m.scoreMean} />
          <MetricRow label="Median" value={m.scoreMedian} />

          {m.chunksPerSection && Object.keys(m.chunksPerSection).length > 0 && (
            <>
              <div className="border-t border-slate-200/60 my-1.5" />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Per Section</div>
              {Object.entries(SECTION_SHORT).map(([key, short]) => {
                const chunks = m.chunksPerSection?.[key] ?? '--';
                const chars = m.contextCharsPerSection?.[key];
                const charsStr = chars ? `${(chars / 1000).toFixed(1)}k` : '';
                return (
                  <div key={key} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px] text-slate-500 truncate">{short}</span>
                    <span className="text-[11px] font-medium text-slate-700">
                      {chunks}{charsStr && <span className="text-slate-400 ml-1">({charsStr})</span>}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <div className="px-3 py-6 text-center">
          <p className="text-[11px] text-slate-400 italic">Run {meta.label} to see metrics</p>
        </div>
      )}
    </div>
  );
}

export default function PipelineMetricsPanel({ pipelineMetrics }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAny = Object.values(pipelineMetrics || {}).some(d => d?.metrics?.queryCount > 0);

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl shadow-card overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] font-bold text-slate-700">Pipeline Metrics Comparison</span>
          {hasAny && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
              {Object.values(pipelineMetrics || {}).filter(d => d?.metrics?.queryCount > 0).length}/3 run
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 pt-1 border-t border-slate-100 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex gap-3 mt-2">
              <PipelineColumn strategyKey="baseline" data={pipelineMetrics?.baseline} />
              <PipelineColumn strategyKey="grouped" data={pipelineMetrics?.grouped} />
              <PipelineColumn strategyKey="section_aligned" data={pipelineMetrics?.section_aligned} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Upload,
  FileSearch,
  FileText,
  User,
  Search,
  Layers,
  Zap,
  ChevronDown,
  FileCode
} from 'lucide-react';

const STEPS = [
  {
    id: 'upload',
    title: 'Upload Document',
    desc: 'PDF or Word document with student records',
    icon: Upload,
    color: 'indigo'
  },
  {
    id: 'rag',
    title: 'RAG Pipeline',
    desc: 'Chunk → Embed → Index',
    icon: FileSearch,
    color: 'violet',
    subSteps: ['Parse & Chunk', 'Generate Embeddings', 'Store in Vector DB']
  },
  {
    id: 'output',
    title: 'Document Output',
    desc: 'Extracted chunks & metadata',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'student',
    title: 'Student Form Context',
    desc: 'Name, grade, disabilities, strengths, weaknesses',
    icon: User,
    color: 'emerald'
  },
  {
    id: 'embed',
    title: 'Vector Embedding',
    desc: 'Student context → embedding vectors',
    icon: Layers,
    color: 'amber'
  },
  {
    id: 'similarity',
    title: 'Similarity Search',
    desc: 'Retrieve relevant chunks',
    icon: Search,
    color: 'rose'
  },
  {
    id: 'context',
    title: 'Final Context',
    desc: 'Combined document + student context',
    icon: FileCode,
    color: 'cyan'
  },
  {
    id: 'llm',
    title: 'LLM API Call',
    desc: 'Generate IEP',
    icon: Zap,
    color: 'green'
  }
];

const colorMap = {
  indigo: 'border-indigo-200 bg-indigo-50/60 text-indigo-700',
  violet: 'border-violet-200 bg-violet-50/60 text-violet-700',
  blue: 'border-blue-200 bg-blue-50/60 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50/60 text-amber-700',
  rose: 'border-rose-200 bg-rose-50/60 text-rose-700',
  cyan: 'border-cyan-200 bg-cyan-50/60 text-cyan-700',
  green: 'border-green-200 bg-green-50/60 text-green-700'
};

export default function IEPWriterPage() {
  const [user, setUser] = useState({ name: 'Guest' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Work in Progress
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">IEP Writer</h1>
          <p className="text-sm text-slate-500 mt-0.5">Coming soon: RAG-powered IEP generation pipeline</p>
        </header>

        <div className="max-w-2xl">
          <div className="relative pl-8">
            {/* Vertical timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const colorClass = colorMap[step.color];
                return (
                  <div key={step.id} className="relative flex items-start gap-4">
                    {/* Step dot on timeline */}
                    <div className="absolute -left-5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm z-10">
                      <span className="text-[10px] font-semibold text-slate-600">{i + 1}</span>
                    </div>

                    <div
                      className={`flex-1 flex items-start gap-4 p-4 rounded-xl border ${colorClass} transition-colors ml-2`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/80 border border-slate-200/80 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                        {step.subSteps && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {step.subSteps.map((s, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-white/80 border border-slate-200/60 text-slate-600"
                              >
                                <ChevronDown className="w-2.5 h-2.5 rotate-[-90deg]" />
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
            <p className="text-xs text-slate-500 text-center">
              This flow will combine document retrieval (RAG) with student context to generate personalized IEPs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

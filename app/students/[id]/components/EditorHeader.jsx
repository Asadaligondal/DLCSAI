"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function EditorHeader({ student }) {
  const router = useRouter();
  
  const accommodationsCount = (() => {
    const acc = student?.student_accommodations || {};
    const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
    const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
    return total;
  })();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">IEP Writer</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review & Edit</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">ID: {student?.studentId || '—'}</span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Grade: {student?.gradeLevel || '—'}</span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Accommodations: {accommodationsCount}</span>
        </div>
      </div>
    </div>
  );
}

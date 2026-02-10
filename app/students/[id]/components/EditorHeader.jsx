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
    <div className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">IEP Writer</h1>
            <p className="text-sm text-slate-600 mt-1">Review & Edit</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-800">ID: {student?.studentId || '—'}</div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-800">Grade: {student?.gradeLevel || '—'}</div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-800">Accommodations: {accommodationsCount}</div>
        </div>
      </div>
    </div>
  );
}

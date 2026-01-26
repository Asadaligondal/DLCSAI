'use client';
import { useEffect, useState } from 'react';

import Sidebar from '@/components/Sidebar';

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
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">IEP Writer</h1>
          <p className="text-slate-600">Draft compliant goals and PLAAFPs.</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          
          
          <div className="w-full max-w-3xl text-left mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-4 border-indigo-400 pl-4 bg-indigo-50/40 rounded-md p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF Extraction Prompt</label>
              <textarea
                readOnly
                rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-800"
                value={`You are a Data Extraction Assistant. Extract the following fields from the student document text:\n- name, studentId, gradeLevel, age, disabilities, strengths, weaknesses, state, instructionalSetting, performanceQuantitative, performanceNarrative, areaOfNeed.\n\nRules:\n- Return ONLY valid JSON with these exact field names.\n- Use \\\"add manually\\\" for missing values.\n- Do not include any explanatory text.`}
              />
            </div>

            <div className="border-l-4 border-amber-400 pl-4 bg-amber-50/40 rounded-md p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Personalized IEP Generator Prompt</label>
              <textarea
                readOnly
                rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-800"
                value={`You are an expert special education IEP author. Given student data (JSON with name, studentId, gradeLevel, age, disabilities, strengths, weaknesses, state, instructionalSetting, performanceQuantitative, performanceNarrative, areaOfNeed), analyze the student's present levels and produce:\n1) A clear PLAAFP (Present Levels of Academic Achievement and Functional Performance) paragraph.\n2) A list of measurable annual goals (array).\n3) For each goal, 2-3 short-term objectives (array).\n4) Recommended accommodations and supports (comma-separated string).\n5) Recommended related services (comma-separated string).\n6) A short rationale for each recommendation.\n\nOutput Rules:\n- Return ONLY valid JSON with these exact top-level keys: 'plaafp', 'goals' (array of objects with 'goal' and 'objectives'), 'accommodations' (string), 'services' (string), 'rationale' (string).\n- Use plain text values; if information is missing, use the literal string \"add manually\" for that value.`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

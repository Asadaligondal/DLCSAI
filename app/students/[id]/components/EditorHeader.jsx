"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function EditorHeader({ student }) {
  const router = useRouter();

  return (
    <div className="mb-2">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    </div>
  );
}

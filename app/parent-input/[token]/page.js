'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Send } from 'lucide-react';

export default function ParentInputPublicPage() {
  const params = useParams();
  const token = params?.token;
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    strengths: '',
    successesYear: '',
    concerns: '',
    additional: '',
    parentSignerName: '',
    parentFormDate: '',
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parent-input/${token}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setMeta({ error: data.message || 'Unable to load this form.' });
          return;
        }
        setMeta(data);
      } catch {
        if (!cancelled) setMeta({ error: 'Unable to load this form.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || meta?.alreadySubmitted) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parent-input/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Submit failed');
        return;
      }
      toast.success(data.message || 'Submitted. Thank you.');
      setMeta((prev) => ({ ...prev, alreadySubmitted: true }));
    } catch {
      toast.error('Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-label="Loading" />
      </div>
    );
  }

  if (meta?.error) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-700 shadow-sm">
          {meta.error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exceptional Student Education</p>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Parent input — IEP / EP / SP</h1>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
          <p className="text-sm text-slate-700 leading-relaxed">{meta.intro}</p>

          {meta.alreadySubmitted ? (
            <p className="mt-8 text-center text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl py-4 px-4">
              This form has already been submitted. If you need to make changes, please contact your child&apos;s school.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <p className="text-xs text-slate-500">
                Student: <span className="font-semibold text-slate-800">{meta.studentFirstName}</span>
              </p>

              <TextArea
                label="1. Describe your child’s strengths"
                value={form.strengths}
                onChange={(v) => setForm((f) => ({ ...f, strengths: v }))}
                required
              />
              <TextArea
                label="2. Describe your child’s successes this year"
                hint="Think about areas in which your child does well — educational and social."
                value={form.successesYear}
                onChange={(v) => setForm((f) => ({ ...f, successesYear: v }))}
                required
              />
              <TextArea
                label="3. Describe concerns you may have about your child"
                hint="Think about areas that are most difficult or challenging."
                value={form.concerns}
                onChange={(v) => setForm((f) => ({ ...f, concerns: v }))}
                required
              />
              <TextArea
                label="4. Additional concerns, helpful information, or questions"
                value={form.additional}
                onChange={(v) => setForm((f) => ({ ...f, additional: v }))}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Signature (type your full name)</label>
                  <input
                    type="text"
                    required
                    value={form.parentSignerName}
                    onChange={(e) => setForm((f) => ({ ...f, parentSignerName: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. May 4, 2026"
                    value={form.parentFormDate}
                    onChange={(e) => setForm((f) => ({ ...f, parentFormDate: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-snug border-t border-slate-100 pt-4">
                Submission of this form electronically constitutes the equivalent of a signature. You may attach or send
                additional information separately if your school allows it.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit parent input
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Parent input — IEP/EP/SP · Florida Department of Education (adapted)
        </p>
      </div>
    </div>
  );
}

function TextArea({ label, hint, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-slate-500 mb-1.5">{hint}</p>}
      <textarea
        required={required}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y min-h-[96px]"
      />
    </div>
  );
}

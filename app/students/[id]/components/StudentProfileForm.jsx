'use client';

import { Save } from 'lucide-react';
import { calcAgeFromDob } from '@/lib/studentFormConstants';

export default function StudentProfileForm({
  formData,
  setFormData,
  onSubmit,
  disabled = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Name <span className="text-slate-500 font-normal">— write only initials</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={disabled}
            className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">School</label>
          <input
            type="text"
            value={formData.schoolName || ''}
            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
            disabled={disabled}
            className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
            placeholder="School or campus"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Student ID</label>
          <input
            type="text"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
            disabled={disabled}
            className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Grade level</label>
          <select
            value={formData.gradeLevel}
            onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
            required
            disabled={disabled}
            className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
          >
            <option value="">Select grade…</option>
            {['KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
            {formData.gradeLevel &&
              !['KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].includes(formData.gradeLevel) && (
                <option value={formData.gradeLevel}>{formData.gradeLevel}</option>
              )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Date of birth</label>
          <input
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => {
              const dob = e.target.value;
              const { numeric } = calcAgeFromDob(dob);
              setFormData({ ...formData, dateOfBirth: dob, age: numeric !== '' ? String(numeric) : '' });
            }}
            max={new Date().toISOString().split('T')[0]}
            disabled={disabled}
            className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Age</label>
          {formData.dateOfBirth ? (
            <div className="w-full h-11 px-3 border border-gray-200 rounded-md bg-slate-50 text-sm text-slate-900 flex items-center">
              {(() => {
                const { years } = calcAgeFromDob(formData.dateOfBirth);
                return `${years} year(s)`;
              })()}
            </div>
          ) : (
            <input
              type="number"
              min={0}
              max={30}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              disabled={disabled}
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
            />
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={disabled}
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
              placeholder="Mailing or home address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Parent / guardian</label>
            <input
              type="text"
              value={formData.parentGuardian1 || ''}
              onChange={(e) => setFormData({ ...formData, parentGuardian1: e.target.value })}
              disabled={disabled}
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Parent / guardian (second)</label>
            <input
              type="text"
              value={formData.parentGuardian2 || ''}
              onChange={(e) => setFormData({ ...formData, parentGuardian2: e.target.value })}
              disabled={disabled}
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-2">Case manager</label>
            <input
              type="text"
              value={formData.caseManager || ''}
              onChange={(e) => setFormData({ ...formData, caseManager: e.target.value })}
              disabled={disabled}
              className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 disabled:opacity-50"
              placeholder="Staff managing this student’s case"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-2">Related services / therapy</label>
            <textarea
              value={formData.relatedServicesTherapy || ''}
              onChange={(e) => setFormData({ ...formData, relatedServicesTherapy: e.target.value })}
              rows={2}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 resize-y disabled:opacity-50"
              placeholder="e.g. Speech, OT, counseling"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        Save profile
      </button>
    </form>
  );
}

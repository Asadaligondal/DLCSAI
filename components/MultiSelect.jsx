'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function MultiSelect({ label, options, value = [], onChange, placeholder = 'Select options...', allowMultiplePerGroup = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const isGrouped = Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0] !== null && 'label' in options[0] && 'options' in options[0];

  const toggleFlatOption = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const toggleGroupedOption = (group, option) => {
    const groupOptions = group.options;
    const isSelected = value.includes(option);
    if (isSelected) {
      onChange(value.filter((v) => v !== option));
    } else if (allowMultiplePerGroup) {
      onChange([...value, option]);
    } else {
      const filtered = value.filter((v) => !groupOptions.includes(v));
      onChange([...filtered, option]);
    }
  };

  const removeOption = (option, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="relative">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[40px] w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:border-primary-400 transition-colors flex flex-wrap gap-1.5 items-center"
      >
        {value.length === 0 ? (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
              <span className="truncate max-w-[180px]">{item}</span>
              <button onClick={(e) => removeOption(item, e)} className="hover:bg-primary-100 rounded-full p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200/60 rounded-xl shadow-float max-h-60 overflow-auto">
          {isGrouped ? (
            options.map((group) => (
              <div key={group.label} className="pb-1 border-b border-slate-100 last:border-b-0">
                <div className="px-3.5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 sticky top-0">{group.label}</div>
                {group.options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => toggleGroupedOption(group, opt)}
                    className={`px-3.5 py-2 cursor-pointer hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${value.includes(opt) ? 'bg-primary-50/50' : ''}`}
                  >
                    <input
                      type={allowMultiplePerGroup ? 'checkbox' : 'radio'}
                      name={allowMultiplePerGroup ? undefined : group.label}
                      checked={value.includes(opt)}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            options.map((option) => (
              <div
                key={option}
                onClick={() => toggleFlatOption(option)}
                className={`px-3.5 py-2 cursor-pointer hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${value.includes(option) ? 'bg-primary-50/50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{option}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

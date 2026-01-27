'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function MultiSelect({ label, options, value = [], onChange, placeholder = 'Select options...' }) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine if options is grouped (array of { label, options }) or flat (array of strings)
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
    } else {
      // remove any other selected option from the same group, then add this one
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
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 transition-colors flex flex-wrap gap-2 items-center"
      >
        {value.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              {item}
              <button
                onClick={(e) => removeOption(item, e)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isGrouped ? (
            options.map((group) => (
              <div key={group.label} className="pb-2 border-b last:border-b-0">
                <div className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50">{group.label}</div>
                {group.options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => toggleGroupedOption(group, opt)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${value.includes(opt) ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name={group.label}
                      checked={value.includes(opt)}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            options.map((option) => (
              <div
                key={option}
                onClick={() => toggleFlatOption(option)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
                  value.includes(option) ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">{option}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function MultiSelect({ label, options, value = [], onChange, placeholder = 'Select options...' }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
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
          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
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
          ))}
        </div>
      )}
    </div>
  );
}

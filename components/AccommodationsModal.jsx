'use client';

import { useState, useMemo } from 'react';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { ACCOMMODATIONS_MASTER } from '@/lib/accommodationsList';

export default function AccommodationsModal({ initial = null, onClose, onSave }) {
  const init = initial || {
    consent: { parentConsentRequired: false, parentConsentObtained: false, consentNotes: '' },
    classroom: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] },
    assessment: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] }
  };

  const [data, setData] = useState(init);
  const [scope, setScope] = useState('classroom');
  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState({});

  const categories = useMemo(() => [
    { key: 'presentation', label: 'Presentation', items: ACCOMMODATIONS_MASTER.presentation },
    { key: 'response', label: 'Response', items: ACCOMMODATIONS_MASTER.response },
    { key: 'scheduling', label: 'Scheduling', items: ACCOMMODATIONS_MASTER.scheduling },
    { key: 'setting', label: 'Setting', items: ACCOMMODATIONS_MASTER.setting },
    { key: 'assistive', label: 'Other Assistive Technology or Device', items: ACCOMMODATIONS_MASTER.assistive }
  ], []);

  const toggleItem = (catKey, item) => {
    const scopeObj = { ...data[scope] };
    const arr = [...(scopeObj[catKey] || [])];
    const idx = arr.findIndex(a => a.id === item.id);
    if (idx === -1) {
      arr.push({ id: item.id, label: item.label, selected: true, subOptions: [], otherText: '', notes: '', tags: item.tags || [] });
    } else {
      arr.splice(idx, 1);
    }
    scopeObj[catKey] = arr;
    setData({ ...data, [scope]: scopeObj });
  };

  const toggleSubOption = (catKey, itemId, subId) => {
    const scopeObj = { ...data[scope] };
    const arr = [...(scopeObj[catKey] || [])];
    const item = arr.find(a => a.id === itemId);
    if (!item) return;
    const sidx = item.subOptions.indexOf(subId);
    if (sidx === -1) item.subOptions.push(subId); else item.subOptions.splice(sidx, 1);
    scopeObj[catKey] = arr;
    setData({ ...data, [scope]: scopeObj });
  };

  const updateOtherText = (catKey, itemId, value) => {
    const scopeObj = { ...data[scope] };
    const arr = [...(scopeObj[catKey] || [])];
    const item = arr.find(a => a.id === itemId);
    if (!item) return;
    item.otherText = value;
    scopeObj[catKey] = arr;
    setData({ ...data, [scope]: scopeObj });
  };

  const updateCategoryNotes = (catKey, value) => {
    const scopeObj = { ...data[scope] };
    scopeObj[catKey + '_notes'] = value;
    setData({ ...data, [scope]: scopeObj });
  };

  const clearScope = () => {
    setData({ ...data, [scope]: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] } });
  };

  const filteredItems = (items) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(it => it.label.toLowerCase().includes(q) || (it.subOptions || []).some(s => s.label && s.label.toLowerCase().includes(q)));
  };

  const isSelected = (catKey, itemId) => {
    const arr = data[scope][catKey] || [];
    return arr.some(a => a.id === itemId);
  };

  const savedCount = (catKey) => (data[scope] && data[scope][catKey] ? data[scope][catKey].length : 0);

  return (
    <Modal title="Student Accommodations" onClose={onClose} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Select classroom and assessment accommodations to be included in the student’s IEP.</p>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-2 rounded-md ${scope === 'classroom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={() => setScope('classroom')}>Classroom</div>
          <div className={`px-3 py-2 rounded-md ${scope === 'assessment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={() => setScope('assessment')}>State/Districtwide Assessment</div>
          <div className="ml-auto flex items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accommodations..." className="px-3 h-10 border rounded-md" />
            <button onClick={clearScope} className="px-3 h-10 bg-gray-100 rounded-md">Clear selections</button>
          </div>
        </div>

        {/* categories */}
        <div className="space-y-3">
          {categories.map(({ key, label, items }) => (
            <div key={key} className="border rounded-md">
              <button
                onClick={() => setOpenCats({ ...openCats, [key]: !openCats[key] })}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-gray-500">{savedCount(key)} selected</span>
                </div>
                <div className="text-sm text-gray-500">{openCats[key] ? '−' : '+'}</div>
              </button>

              {openCats[key] && (
                <div className="p-4">
                  <div className="space-y-2">
                    {filteredItems(items).map(item => (
                      <div key={item.id} className="flex flex-col border-b pb-2">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" checked={isSelected(key, item.id)} onChange={() => toggleItem(key, item)} />
                          <span className="text-sm">{item.label}</span>
                          {item.tags && item.tags.length > 0 && (
                            <span className="ml-2 text-xs text-amber-700">{item.tags.join(', ')}</span>
                          )}
                        </label>

                        {/* suboptions or textarea */}
                        {isSelected(key, item.id) && (
                          <div className="pl-8 mt-2 space-y-2">
                            {item.subOptions && item.subOptions.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {item.subOptions.map(so => (
                                  <label key={so.id} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" onChange={() => toggleSubOption(key, item.id, so.id)} checked={(data[scope][key] || []).find(it => it.id === item.id)?.subOptions.includes(so.id) || false} />
                                    <span>{so.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {item.other && (
                              <div>
                                <input placeholder="Specify other" className="w-full border rounded-md px-3 h-10" value={(data[scope][key] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(key, item.id, e.target.value)} />
                              </div>
                            )}

                            {item.textarea && (
                              <textarea placeholder="Details..." className="w-full border rounded-md p-2" value={(data[scope][key] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(key, item.id, e.target.value)} />
                            )}

                          </div>
                        )}
                      </div>
                    ))}

                    {/* category-level notes */}
                    <div className="mt-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <textarea value={data[scope][key + '_notes'] || ''} onChange={(e) => updateCategoryNotes(key, e.target.value)} className="w-full border rounded-md p-2 mt-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={data.consent.parentConsentObtained} onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentObtained: e.target.checked } })} />
              <span className="text-sm">Parent consent obtained (if required)</span>
            </label>
            <textarea placeholder="Consent notes / implications acknowledged..." className="w-full border rounded-md p-2 mt-2" value={data.consent.consentNotes} onChange={(e) => setData({ ...data, consent: { ...data.consent, consentNotes: e.target.value } })} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500">Actions</div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
              <button onClick={() => { onSave(data); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Accommodations</button>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

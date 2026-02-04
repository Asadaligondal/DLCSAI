"use client";

import { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { ACCOMMODATIONS_MASTER } from '@/lib/accommodationsList';

const TAG_BADGE_LABELS = {
  'allowable_for_alternate_only': 'Alternate assessment only',
  'vi_dsi_only': 'VI/DSI only',
  'vi_dsi_only_for_general': 'VI/DSI limitation',
  'allowable_for_alternate_only_real_objects': 'Alternate only: real objects',
  'allowable_for_alternate_only_physical_cuing': 'Alternate only: physical cuing',
  'allowable_for_alternate_only_wait_time': 'Alternate only: extended wait',
  'allowable_for_alternate_only_if_used_consistently': 'Alternate only: use consistently',
  'valid_thru_dec_2022': 'Deprecated after Dec 2022'
};

export default function AccommodationsModal({ initial = null, onClose, onSave, inline = false, onApply = null }) {
  const init = initial || {
    consent: { parentConsentRequired: false, parentConsentObtained: false, consentNotes: '', parentConsentName: '', parentConsentDate: '' },
    classroom: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] },
    assessment: { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] }
  };

  const [data, setData] = useState(init);
  const [scope, setScope] = useState('classroom');
  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('presentation');
  const [selectedCollapsed, setSelectedCollapsed] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [filterHasSubOptions, setFilterHasSubOptions] = useState(false);
  const [filterNeedsConsent, setFilterNeedsConsent] = useState(false);

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
        if (scope === 'classroom' && Array.isArray(item.tags) && item.tags.length > 0) {
          const assessmentLimitedTags = ['allowable_for_alternate_only','vi_dsi_only','vi_dsi_only_for_general','allowable_for_alternate_only_real_objects','allowable_for_alternate_only_physical_cuing','allowable_for_alternate_only_wait_time','allowable_for_alternate_only_if_used_consistently'];
          if (item.tags.some(t => assessmentLimitedTags.includes(t))) {
            setData(prev => ({ ...prev, consent: { ...prev.consent, parentConsentRequired: true } }));
          }
        }
      } else {
        arr.splice(idx, 1);
      }
      scopeObj[catKey] = arr;
      setData({ ...data, [scope]: scopeObj });
    };

    // auto-apply when inline
    useEffect(() => {
      if (inline && onApply) {
        try { onApply(data); } catch (e) { /* ignore */ }
      }
    }, [data]);

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

    const assessmentLimitedTags = ['allowable_for_alternate_only','vi_dsi_only','vi_dsi_only_for_general','allowable_for_alternate_only_real_objects','allowable_for_alternate_only_physical_cuing','allowable_for_alternate_only_wait_time','allowable_for_alternate_only_if_used_consistently'];
    const classroomSelectedItems = Object.keys(data.classroom || {}).reduce((acc, k) => acc.concat(data.classroom[k] || []), []);
    const hasAssessmentLimited = classroomSelectedItems.some(it => (it.tags || []).some(tag => assessmentLimitedTags.includes(tag)));

    const collectSelected = (d) => {
      const out = {};
      ['classroom','assessment'].forEach(scopeKey => {
        out[scopeKey] = {};
        ['presentation','response','scheduling','setting','assistive_technology_device'].forEach(cat => {
          out[scopeKey][cat] = (d[scopeKey]?.[cat] || []).map(item => ({
            id: item.id,
            label: item.label,
            subOptions: item.subOptions || [],
            otherText: item.otherText || '',
            notes: item.notes || ''
          }));
        });
      });
      return out;
    };

    const generatePrintableHTML = (d) => {
      const sel = collectSelected(d);
      const escape = (s) => (s + '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      let html = `<html><head><title>Accommodations Consent Summary</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h2{margin-bottom:4px} .section{margin-bottom:16px} .item{margin-left:12px}</style></head><body>`;
      html += `<h1>Accommodations Consent Summary</h1>`;
      ['classroom','assessment'].forEach(scopeKey => {
        html += `<div class="section"><h2>${scopeKey === 'classroom' ? 'Classroom Accommodations' : 'State/Districtwide Assessment Accommodations'}</h2>`;
        ['presentation','response','scheduling','setting','assistive_technology_device'].forEach(cat => {
          const items = sel[scopeKey][cat] || [];
          if (!items || items.length === 0) return;
          html += `<h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
          items.forEach(it => {
            html += `<div class="item"><strong>${escape(it.label)}</strong>`;
            if (it.subOptions && it.subOptions.length) html += `<div>Sub-options: ${escape(it.subOptions.join(', '))}</div>`;
            if (it.otherText) html += `<div>Details: ${escape(it.otherText)}</div>`;
            if (it.notes) html += `<div>Notes: ${escape(it.notes)}</div>`;
            html += `</div>`;
          });
        });
        html += `</div>`;
      });
      html += `<div class="section"><h2>Consent</h2><div>Parent consent required: ${d.consent.parentConsentRequired ? 'Yes' : 'No'}</div><div>Parent consent obtained: ${d.consent.parentConsentObtained ? 'Yes' : 'No'}</div>`;
      if (d.consent.parentConsentObtained) {
        html += `<div>Parent/Guardian: ${escape(d.consent.parentConsentName || '')}</div><div>Consent date: ${escape(d.consent.parentConsentDate || '')}</div>`;
      }
      if (d.consent.consentNotes) html += `<div>Notes: ${escape(d.consent.consentNotes)}</div>`;
      html += `</div>`;

      html += `<div style="margin-top:24px;font-size:12px;color:#666">Generated on ${new Date().toLocaleString()}</div>`;
      html += `</body></html>`;
      return html;
    };

    const Content = (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Select classroom and assessment accommodations to be included in the student’s IEP.</p>

        {!inline ? (
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
                              <span className="ml-2 flex gap-1">
                                {item.tags.map(t => (
                                  TAG_BADGE_LABELS[t] ? (
                                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{TAG_BADGE_LABELS[t]}</span>
                                  ) : (
                                    <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{t}</span>
                                  )
                                ))}
                              </span>
                            )}
                          </label>

                          {(item.note || item.helper || item.extras) && (
                            <div className="ml-8 mt-1 text-xs text-gray-500">
                              {item.helper || item.note || (item.extras ? 'Includes additional options — expand to view details.' : '')}
                            </div>
                          )}

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
        ) : (
          // Inline two-column layout
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 min-w-0">
            {/* Left nav */}
            <div className="hidden md:flex flex-col h-full min-w-0">
              <div className="space-y-2">
                {categories.map(({ key, label }) => (
                  <button key={key} onClick={() => setSelectedCategory(key)} className={`w-full text-left px-3 py-2 rounded-r-md flex items-center justify-between ${selectedCategory === key ? 'bg-white border-l-4 border-blue-500 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{label}</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">{savedCount(key)}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto p-3 border-t">
                <div className="text-sm font-medium">Selected ({(data && data[scope]) ? Object.values(data[scope]).flat().length : 0})</div>
                <div className="mt-2 text-xs text-gray-600">Click an item on the right to remove it.</div>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col h-full min-w-0">
              {/* Small screens: category dropdown */}
              <div className="md:hidden mb-3">
                <label className="block text-xs text-gray-600 mb-1">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full h-10 border rounded-md px-3">
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sticky top-0 bg-white z-10 py-3">
                {/* Row A: Tabs */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-md text-sm cursor-pointer ${scope === 'classroom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setScope('classroom')}>Classroom ({Object.values(data.classroom || {}).flat().length})</div>
                  <div className={`px-3 py-1 rounded-md text-sm cursor-pointer ${scope === 'assessment' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setScope('assessment')}>State/Districtwide Assessment ({Object.values(data.assessment || {}).flat().length})</div>
                </div>

                <div className="mt-1 text-xs text-gray-500">Use statewide/district assessment accommodations that match classroom supports when possible.</div>

                {/* Row B: Search + actions */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accommodations..." className="w-full px-3 h-10 border rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setQuery(''); setSelectedOnly(false); setFilterHasSubOptions(false); }} className="h-10 px-3 text-sm text-gray-600 border rounded-md bg-white hover:bg-gray-50">Clear</button>
                    <button onClick={() => { const html = generatePrintableHTML(data); const w = window.open('', '_blank', 'noopener,noreferrer'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); } }} className="h-10 px-3 text-sm text-gray-600 border rounded-md bg-white hover:bg-gray-50">Print</button>
                  </div>
                </div>

                {/* Quick filter chips */}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setSelectedOnly(!selectedOnly)} className={`text-sm px-3 py-1 rounded-full ${selectedOnly ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Selected only</button>
                  <button onClick={() => setFilterHasSubOptions(!filterHasSubOptions)} className={`text-sm px-3 py-1 rounded-full ${filterHasSubOptions ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Has sub-options</button>
                  <button onClick={() => setFilterNeedsConsent(!filterNeedsConsent)} className={`text-sm px-3 py-1 rounded-full ${filterNeedsConsent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Needs consent</button>
                </div>
              </div>

              <div className="mt-3 overflow-y-auto pb-24" style={{ minWidth: 0 }}>
                <div className="space-y-3">
                  {(() => {
                    const items = filteredItems((ACCOMMODATIONS_MASTER[selectedCategory] || []));
                    const visible = items.filter(item => {
                      if (selectedOnly && !isSelected(selectedCategory, item.id)) return false;
                      if (filterHasSubOptions && (!item.subOptions || item.subOptions.length === 0)) return false;
                      if (filterNeedsConsent && !((item.tags || []).includes('requires_consent') || (item.tags || []).includes('assessment_limited'))) return false;
                      return true;
                    });
                    return visible.map(item => (
                      <div key={item.id} className="border rounded-md p-3 hover:bg-gray-50 hover:shadow-sm min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input type="checkbox" checked={isSelected(selectedCategory, item.id)} onChange={() => toggleItem(selectedCategory, item)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold truncate">{item.label}</div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex-shrink-0 ml-2 flex gap-1">
                                  {item.tags.map(t => (
                                    TAG_BADGE_LABELS[t] ? (
                                      <span key={t} className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-800">{TAG_BADGE_LABELS[t]}</span>
                                    ) : (
                                      <span key={t} className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-700">{t}</span>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 text-sm text-gray-600">{item.helper || item.note}</div>

                            {isSelected(selectedCategory, item.id) && (
                              <div className="mt-3 bg-gray-50 p-3 rounded border">
                                {item.subOptions && item.subOptions.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.subOptions.map(so => (
                                      <label key={so.id} className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" onChange={() => toggleSubOption(selectedCategory, item.id, so.id)} checked={(data[scope][selectedCategory] || []).find(it => it.id === item.id)?.subOptions.includes(so.id) || false} />
                                        <span>{so.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {item.other && (
                                  <div className="mt-2">
                                    <label className="text-xs text-gray-600">Specify</label>
                                    <input placeholder="Specify" className="w-full border rounded-md px-3 h-9 mt-1" value={(data[scope][selectedCategory] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(selectedCategory, item.id, e.target.value)} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>

                {/* Selected summary collapsible (moved to right panel top) */}
                {/* Consent card */}
                <div className="mt-6 p-4 border rounded-md bg-gray-50">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={data.consent.parentConsentObtained} onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentObtained: e.target.checked } })} />
                    <span className="text-sm">Parent consent obtained{data.consent.parentConsentRequired ? ' (required for selected items)' : ''}</span>
                  </label>
                  <textarea placeholder="Consent notes / implications acknowledged..." className="w-full border rounded-md p-2 mt-2" value={data.consent.consentNotes} onChange={(e) => setData({ ...data, consent: { ...data.consent, consentNotes: e.target.value } })} />
                  {data.consent.parentConsentObtained && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <input type="text" value={data.consent.parentConsentName || ''} onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentName: e.target.value } })} className="w-full border rounded-md px-2 h-10" placeholder="Parent/Guardian name" />
                      </div>
                      <div>
                        <input type="date" value={data.consent.parentConsentDate || ''} onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentDate: e.target.value } })} className="w-full border rounded-md px-2 h-10" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="w-2/3">
            {hasAssessmentLimited && (
              <div className="mb-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-amber-800 rounded">
                Some selected classroom accommodations may not be allowable on statewide/district assessments. Parent consent is required for those classroom-only accommodations and must be obtained and recorded here before saving.
              </div>
            )}

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={data.consent.parentConsentObtained} onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentObtained: e.target.checked } })} />
              <span className="text-sm">Parent consent obtained{data.consent.parentConsentRequired ? ' (required for selected items)' : ''}</span>
            </label>
            <textarea placeholder="Consent notes / implications acknowledged..." className="w-full border rounded-md p-2 mt-2" value={data.consent.consentNotes} onChange={(e) => setData({ ...data, consent: { ...data.consent, consentNotes: e.target.value } })} />

            {data.consent.parentConsentObtained && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Parent/Guardian name</label>
                  <input
                    type="text"
                    value={data.consent.parentConsentName || ''}
                    onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentName: e.target.value } })}
                    className="w-full border rounded-md px-2 h-10"
                    placeholder="Typed parent/guardian name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Consent date</label>
                  <input
                    type="date"
                    value={data.consent.parentConsentDate || ''}
                    onChange={(e) => setData({ ...data, consent: { ...data.consent, parentConsentDate: e.target.value } })}
                    className="w-full border rounded-md px-2 h-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500">Actions</div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
              <button onClick={() => {
                const html = generatePrintableHTML(data);
                const w = window.open('', '_blank', 'noopener,noreferrer');
                if (w) {
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => w.print(), 300);
                }
              }} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Print Consent Summary</button>
              <button
                onClick={() => {
                  if (hasAssessmentLimited && !data.consent.parentConsentObtained) {
                    alert('Parent consent is required for selected classroom-only accommodations. Please obtain consent before saving.');
                    return;
                  }
                  if (data.consent.parentConsentObtained) {
                    if (!data.consent.parentConsentName || !data.consent.parentConsentDate) {
                      alert('Please provide parent/guardian name and consent date before saving.');
                      return;
                    }
                  }
                  if (inline && onApply) {
                    onApply(data);
                  } else {
                    if (onSave) onSave(data);
                  }
                  if (!inline && onClose) onClose();
                }}
                className={`px-4 py-2 ${hasAssessmentLimited && !data.consent.parentConsentObtained ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'} rounded-md`}>
                {inline ? 'Apply Accommodations' : 'Save Accommodations'}
              </button>
            </div>
          </div>
        </div>

      </div>
    );

    if (inline) return Content;

    return (
      <Modal title="Student Accommodations" onClose={onClose} size="lg">
        {Content}
      </Modal>
    );

  }

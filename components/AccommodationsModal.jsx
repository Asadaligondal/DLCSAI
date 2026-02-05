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
  const [toast, setToast] = useState({ show: false, msg: '' });
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
      // show subtle toast when adding
      if (idx === -1) {
        const total = totalSelectedCount({ ...data, [scope]: scopeObj });
        setToast({ show: true, msg: `Added to Selected (${total})` });
        setTimeout(() => setToast({ show: false, msg: '' }), 1800);
      }
    };

    const removeSelected = (scopeKey, catKey, itemId) => {
      const scopeObj = { ...data[scopeKey] };
      const arr = [...(scopeObj[catKey] || [])];
      const idx = arr.findIndex(a => a.id === itemId);
      if (idx !== -1) arr.splice(idx, 1);
      scopeObj[catKey] = arr;
      setData(prev => ({ ...prev, [scopeKey]: scopeObj }));
    };

    const totalSelectedCount = (d) => {
      const target = d || data;
      const c1 = Object.values(target.classroom || {}).flat().length;
      const c2 = Object.values(target.assessment || {}).flat().length;
      return c1 + c2;
    };

    // highlight matched text in labels when searching
    const highlightLabel = (label) => {
      if (!query) return label;
      const q = query.trim().toLowerCase();
      if (!q) return label;
      const lower = label.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx === -1) return label;
      const before = label.slice(0, idx);
      const match = label.slice(idx, idx + q.length);
      const after = label.slice(idx + q.length);
      return (<span>{before}<mark className="bg-yellow-200 rounded">{match}</mark>{after}</span>);
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

    const overallVisible = useMemo(() => {
      return categories.reduce((acc, c) => {
        const items = filteredItems(c.items || []);
        const visible = items.filter(item => {
          if (selectedOnly && !((data.classroom?.[c.key === 'assistive' ? 'assistive_technology_device' : c.key] || []).some(i=>i.id===item.id) || (data.assessment?.[c.key === 'assistive' ? 'assistive_technology_device' : c.key] || []).some(i=>i.id===item.id))) return false;
          if (filterHasSubOptions && (!item.subOptions || item.subOptions.length === 0)) return false;
          if (filterNeedsConsent && !((item.tags || []).includes('requires_consent') || (item.tags || []).includes('assessment_limited'))) return false;
          return true;
        });
        return acc + visible.length;
      }, 0);
    }, [categories, query, selectedOnly, filterHasSubOptions, filterNeedsConsent, data]);

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
              {overallVisible === 0 ? (
                <div key="empty-all" className="p-6 border border-gray-100 rounded-md bg-white text-center">
                  <div className="text-lg font-semibold">No accommodations found</div>
                  <div className="mt-2 text-sm text-gray-500">Try a different keyword or clear filters.</div>
                  <div className="mt-4">
                    <button onClick={() => { setQuery(''); setFilterHasSubOptions(false); setFilterNeedsConsent(false); setSelectedOnly(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Clear search</button>
                  </div>
                </div>
              ) : (
                categories.map(({ key, label, items }) => (
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
                          <div key={item.id} className="flex flex-col border-b border-gray-200 pb-2">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleItem(key, item)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(key, item); } }}
                              className="flex items-center gap-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                            >
                              <input onClick={(e) => e.stopPropagation()} type="checkbox" checked={isSelected(key, item.id)} onChange={() => toggleItem(key, item)} />
                              <span className="text-sm">{highlightLabel(item.label)}</span>
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
                            </div>

                            {(item.note || item.helper || item.extras) && (
                              <div className="ml-8 mt-1 text-xs text-gray-500">
                                {item.helper || item.note || (item.extras ? 'Includes additional options — expand to view details.' : '')}
                              </div>
                            )}

                            <div style={{ overflow: 'hidden', transition: 'max-height 180ms ease, opacity 180ms ease', maxHeight: isSelected(key, item.id) ? '400px' : '0px', opacity: isSelected(key, item.id) ? 1 : 0 }} className="pl-8 mt-2">
                              {item.subOptions && item.subOptions.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded border border-gray-100">
                                  {item.subOptions.map(so => (
                                    <label key={so.id} className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                                      <input onClick={(e) => e.stopPropagation()} type="checkbox" onChange={() => toggleSubOption(key, item.id, so.id)} checked={(data[scope][key] || []).find(it => it.id === item.id)?.subOptions.includes(so.id) || false} />
                                      <span>{so.label}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {item.other && (
                                <div className="mt-2">
                                  <input onClick={(e) => e.stopPropagation()} placeholder="Specify other" className="w-full border rounded-md px-3 h-10" value={(data[scope][key] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(key, item.id, e.target.value)} />
                                </div>
                              )}

                              {item.textarea && (
                                <textarea onClick={(e) => e.stopPropagation()} placeholder="Details..." className="w-full border rounded-md p-2" value={(data[scope][key] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(key, item.id, e.target.value)} />
                              )}

                            </div>
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
              ))
              )}
            </div>
        ) : (
          // Inline two-column layout with proper scroll containment
          <div className="flex flex-col md:flex-row gap-4 w-full min-w-0" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
            {/* Left nav - sticky and always visible (no independent scroll) */}
            <div className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r border-gray-200 pr-4">
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

            {/* Right panel - flex column with scrolling list only */}
            <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden border border-gray-200 rounded-md">
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
                  <button onClick={() => setSelectedOnly(!selectedOnly)} className={`text-sm px-3 py-1 rounded-full ${selectedOnly ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Review selected</button>
                  <button onClick={() => setFilterHasSubOptions(!filterHasSubOptions)} className={`text-sm px-3 py-1 rounded-full ${filterHasSubOptions ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Has sub-options</button>
                  <button onClick={() => setFilterNeedsConsent(!filterNeedsConsent)} className={`text-sm px-3 py-1 rounded-full ${filterNeedsConsent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Needs consent</button>
                </div>
                {(query || filterHasSubOptions || filterNeedsConsent) && (
                  <div className="mt-2">
                    <button onClick={() => { setQuery(''); setFilterHasSubOptions(false); setFilterNeedsConsent(false); setSelectedOnly(false); }} className="text-sm text-blue-600 underline">Clear all filters</button>
                  </div>
                )}
              </div>

              {/* Inline toast hint */}
              {toast.show && (
                <div className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded inline-block">{toast.msg}</div>
              )}

              {/* Selected Summary (non-scrolling) - above the scrollable list */}
              <div className="flex-shrink-0 mt-3">
                <div>
                  <div className="border rounded-md bg-white shadow-sm p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Selected ({totalSelectedCount()})</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedCollapsed(!selectedCollapsed)} className="text-sm px-2 py-1 bg-gray-100 rounded">{selectedCollapsed ? 'Expand' : 'Collapse'}</button>
                      </div>
                    </div>

                    {!selectedCollapsed && (
                      <div className="mt-2 space-y-2">
                        {['presentation','response','scheduling','setting','assistive_technology_device'].map(cat => {
                          const label = categories.find(c => c.key === (cat === 'assistive_technology_device' ? 'assistive' : cat))?.label || cat;
                          const items = (data.classroom?.[cat] || []).concat(data.assessment?.[cat] || []);
                          if (!items || items.length === 0) return null;
                          return (
                            <div key={cat}>
                              <div className="text-xs font-medium text-gray-600">{label} ({items.length})</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {items.map(it => (
                                  <div key={it.id} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm">
                                    <span className="max-w-[160px] truncate pr-2">{it.label}{it.subOptions && it.subOptions.length ? ` (${it.subOptions.length} options)` : ''}</span>
                                    <button onClick={() => removeSelected((data.classroom?.[cat] || []).find(i => i.id === it.id) ? 'classroom' : 'assessment', cat, it.id)} className="ml-1 text-xs text-gray-600 px-1">×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable accommodations list - only this section scrolls */}
              <div className="flex-1 overflow-y-auto mt-3 pb-24" style={{ minWidth: 0 }}>
                <div className="space-y-3">
                  {selectedOnly ? (
                    // Review selected: show selected items grouped by category for current scope
                    totalSelectedCount() === 0 ? (
                      <div className="p-6 border border-gray-100 rounded-md bg-white text-center">
                        <div className="text-lg font-semibold">No selections yet</div>
                        <div className="mt-2 text-sm text-gray-500">Start selecting accommodations</div>
                      </div>
                    ) : (
                      ['presentation','response','scheduling','setting','assistive_technology_device'].map(cat => {
                        const sel = data[scope]?.[cat] || [];
                        if (!sel || sel.length === 0) return null;
                        const label = categories.find(c => c.key === (cat === 'assistive_technology_device' ? 'assistive' : cat))?.label || cat;
                        return (
                          <div key={cat} className="space-y-2">
                            <div className="text-sm font-medium">{label} ({sel.length})</div>
                            {sel.map(item => (
                              <div key={item.id} className="border rounded-md p-3 bg-white">
                                <div className="flex items-start gap-3">
                                  <div className="pt-1">
                                    <input type="checkbox" checked={true} onChange={() => removeSelected(scope, cat, item.id)} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold">{item.label}</div>
                                    <div className="mt-2 text-sm text-gray-600">{item.notes || ''}</div>
                                    <div className="mt-3 bg-gray-50 p-3 rounded border">
                                      {item.subOptions && item.subOptions.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                          {item.subOptions.map(soId => (
                                            <div key={soId} className="text-sm flex items-center gap-2">
                                              <input type="checkbox" checked={(item.subOptions || []).includes(soId)} readOnly />
                                              <span>{soId}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )
                  ) : (
                    (() => {
                      const items = filteredItems((ACCOMMODATIONS_MASTER[selectedCategory] || []));
                      const visible = items.filter(item => {
                        if (selectedOnly && !isSelected(selectedCategory, item.id)) return false;
                        if (filterHasSubOptions && (!item.subOptions || item.subOptions.length === 0)) return false;
                        if (filterNeedsConsent && !((item.tags || []).includes('requires_consent') || (item.tags || []).includes('assessment_limited'))) return false;
                        return true;
                      });

                      if (visible.length === 0) {
                        // Empty state for inline search/filters
                        return (
                          <div className="p-6 border border-gray-100 rounded-md bg-white text-center">
                            <div className="text-lg font-semibold">No accommodations found</div>
                            <div className="mt-2 text-sm text-gray-500">Try a different keyword or clear filters.</div>
                            <div className="mt-4">
                              <button onClick={() => { setQuery(''); setFilterHasSubOptions(false); setFilterNeedsConsent(false); setSelectedOnly(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Clear search</button>
                            </div>
                          </div>
                        );
                      }

                      return visible.map(item => (
                        <div key={item.id} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(selectedCategory, item); } }} onClick={() => toggleItem(selectedCategory, item)} className="border rounded-md p-3 hover:bg-gray-50 hover:shadow-sm min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300">
                          <div className="flex items-start gap-3">
                            <div className="pt-1 flex-shrink-0">
                              <input onClick={(e) => e.stopPropagation()} type="checkbox" checked={isSelected(selectedCategory, item.id)} onChange={() => toggleItem(selectedCategory, item)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-sm font-semibold word-break break-words leading-snug">{highlightLabel(item.label)}</div>
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex-shrink-0 flex gap-1 flex-wrap justify-end">
                                    {item.tags.map(t => (
                                      TAG_BADGE_LABELS[t] ? (
                                        <span key={t} className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-800 whitespace-nowrap">{TAG_BADGE_LABELS[t]}</span>
                                      ) : (
                                        <span key={t} className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-700 whitespace-nowrap">{t}</span>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 text-sm text-gray-600">{item.helper || item.note}</div>

                              <div style={{ overflow: 'hidden', transition: 'max-height 200ms ease, opacity 200ms ease', maxHeight: isSelected(selectedCategory, item.id) ? '400px' : '0px', opacity: isSelected(selectedCategory, item.id) ? 1 : 0 }} className="mt-3 bg-gray-50 p-3 rounded border">
                                {item.subOptions && item.subOptions.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-0 rounded">
                                    {item.subOptions.map(so => (
                                      <label key={so.id} className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                                        <input onClick={(e) => e.stopPropagation()} type="checkbox" onChange={() => toggleSubOption(selectedCategory, item.id, so.id)} checked={(data[scope][selectedCategory] || []).find(it => it.id === item.id)?.subOptions.includes(so.id) || false} />
                                        <span>{so.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {item.other && (
                                  <div className="mt-2">
                                    <label className="text-xs text-gray-600">Specify</label>
                                    <input onClick={(e) => e.stopPropagation()} placeholder="Specify" className="w-full border rounded-md px-3 h-9 mt-1" value={(data[scope][selectedCategory] || []).find(it => it.id === item.id)?.otherText || ''} onChange={(e) => updateOtherText(selectedCategory, item.id, e.target.value)} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    })()
                  )}
                </div>

                {/* Consent card moved to footer for better layout */}
              </div>
            </div>
          </div>
        )}

        {/* Footer - sticky at bottom with minimal action buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 z-20 w-full" style={{ overflowX: 'hidden' }}>
          <div className="px-4 py-3 flex items-center justify-between gap-4 min-w-0">
            <div className="text-xs text-gray-600 flex-shrink-0">{totalSelectedCount()} accommodations selected</div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onClose} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap">Cancel</button>
              <button onClick={() => {
                const html = generatePrintableHTML(data);
                const w = window.open('', '_blank', 'noopener,noreferrer');
                if (w) {
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => w.print(), 300);
                }
              }} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap">Print</button>
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
                className={`px-4 py-1.5 text-sm rounded-md font-medium whitespace-nowrap ${hasAssessmentLimited && !data.consent.parentConsentObtained ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {inline ? 'Apply' : 'Save'}
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

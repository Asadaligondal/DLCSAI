export function defaultAccommodations() {
  return {
    consent: {
      parentConsentObtained: false,
      consentNotes: ''
    },
    classroom: {
      presentation: [],
      response: [],
      scheduling: [],
      setting: [],
      assistive_technology_device: []
    },
    assessment: {
      presentation: [],
      response: [],
      scheduling: [],
      setting: [],
      assistive_technology_device: []
    }
  };
}

function ensureItemShape(item) {
  return {
    id: item && item.id ? String(item.id) : '',
    label: item && item.label ? String(item.label) : '',
    subOptions: Array.isArray(item && item.subOptions) ? item.subOptions : [],
    otherText: item && item.otherText ? String(item.otherText) : '',
    notes: item && item.notes ? String(item.notes) : ''
  };
}

export function normalizeAccommodations(payload) {
  const def = defaultAccommodations();
  if (!payload || typeof payload !== 'object') return def;

  const out = { ...def };

  // Consent
  out.consent.parentConsentObtained = Boolean(payload.consent && payload.consent.parentConsentObtained);
  out.consent.consentNotes = payload.consent && payload.consent.consentNotes ? String(payload.consent.consentNotes) : '';

  // Helper to copy arrays and normalize items
  const copyArr = (src) => {
    if (!Array.isArray(src)) return [];
    return src.map(i => ensureItemShape(i));
  };

  const catKeys = ['presentation','response','scheduling','setting','assistive_technology_device'];
  ['classroom','assessment'].forEach(scope => {
    if (!payload[scope] || typeof payload[scope] !== 'object') {
      out[scope] = { presentation: [], response: [], scheduling: [], setting: [], assistive_technology_device: [] };
      return;
    }
    out[scope] = {};
    catKeys.forEach(k => {
      out[scope][k] = copyArr(payload[scope][k]);
    });
  });

  return out;
}

export function accommodationsCount(accom) {
  if (!accom || typeof accom !== 'object') return 0;
  const scopes = ['classroom','assessment'];
  let count = 0;
  scopes.forEach(s => {
    if (accom[s] && typeof accom[s] === 'object') {
      Object.keys(accom[s]).forEach(k => {
        const arr = accom[s][k];
        if (Array.isArray(arr)) count += arr.length;
      });
    }
  });
  return count;
}

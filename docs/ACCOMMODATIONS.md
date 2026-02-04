# Accommodations: Implementation Notes

This document summarizes the current implementation of the Accommodations feature, the data model, API routes, client behaviour (modal), consent flow, and extension notes for developers.

## High-level
- Classroom and Assessment accommodations are supported via a single `student_accommodations` structured object on the `Student` model.
- UI: `components/AccommodationsModal.jsx` provides a modal with two scopes (Classroom / State/Districtwide Assessment), category accordions (Presentation, Response, Scheduling, Setting, Assistive), search, sub-option checkboxes, "Other" textareas, notes, and Save/Print actions.

## Data model
The saved shape is stored on the `Student` document at `student_accommodations` and follows this structure:

{
  consent: {
    parentConsentRequired: boolean,
    parentConsentObtained: boolean,
    consentNotes: string,
    parentConsentName: string,
    parentConsentDate: string (YYYY-MM-DD)
  },
  classroom: {
    presentation: [ { id, label, subOptions: [], otherText, notes, tags } ],
    response: [ ... ],
    scheduling: [ ... ],
    setting: [ ... ],
    assistive_technology_device: [ ... ]
  },
  assessment: { /* same shape as classroom */ }
}

Item objects store `id`, `label`, optional `subOptions` (array of strings), `otherText`, `notes`, and `tags` (used to mark special limitations).

## API endpoints
- `GET /api/students/[id]/accommodations` — returns `{ success: true, accommodations: <object> }` if student exists and caller is authorized.
- `POST /api/students/[id]/accommodations` — accepts the accommodations payload. The server sanitizes values and enforces constraints (e.g., if `parentConsentObtained` is true, `parentConsentName` and `parentConsentDate` are required). The route uses `protectRoute` for auth and verifies the student belongs to the user.

Server-side validation is implemented in `app/api/students/[id]/accommodations/route.js` (sanitizes strings, booleans, arrays, and item shapes).

## Client behaviour (modal)
- The modal loads initial data when passed via `initial` prop or when editing an existing student.
- Selecting classroom items tagged as assessment-limited (see `lib/accommodationsList.js` tags) automatically marks `parentConsentRequired` and shows a warning.
- If assessment-limited items are selected, the modal requires the parent consent checkbox to be checked and the parent name + date to be entered before Save is allowed.
- A `Print Consent Summary` button opens a print-friendly page listing selected items and consent details.

## Master list and tags
- Canonical items and sub-options are defined in `lib/accommodationsList.js` under categories `presentation`, `response`, `scheduling`, `setting`, and `assistive`.
- Some items include `tags` such as `allowable_for_alternate_only`, `vi_dsi_only`, and `valid_thru_dec_2022`. The UI shows badges for these tags and they are used to mark items that may be assessment-limited.

## Integration points
- Add Student: `app/dashboard/page.js` includes an `Add Accommodations` button in the Add Student modal. The `student_accommodations` payload is included in the initial create POST when present.
- Student detail: `app/students/[id]/components/StudentInfoHeader.jsx` shows counts and exposes an Edit button that fetches and opens the modal for editing existing accommodations. After Save the student data is refreshed.

## Print / Consent
- Print summary is generated client-side via `components/AccommodationsModal.jsx` (function `generatePrintableHTML`) and opened in a new tab/window for printing.

## Extension notes / Next steps
- Test-specific allowable matrix: the feature currently flags obvious assessment-limited items using tags, but it does not implement a per-test part allowance matrix (those rules are maintained in assessment administration manuals). To implement per-test allowances you will need a rules resource and mapping.
- Admin approval flow: to require administrative review for certain accommodations, add an `approval` sub-object to `student_accommodations` and an API to list/persist approval decisions.
- Export/Import: consider adding JSON export/import for IEP systems or a printable consent PDF with school header and signature block.

## Files of interest
- `lib/accommodationsList.js` — master items, tags, subOptions
- `components/AccommodationsModal.jsx` — UI, print summary, consent capture
- `app/api/students/[id]/accommodations/route.js` — GET/POST handlers and validation
- `models/Student.js` — student schema with `student_accommodations`
- `app/dashboard/page.js` — Add Student modal integration
- `app/students/[id]/components/StudentInfoHeader.jsx` — student header edit integration

If you'd like, I can:
- add a printable PDF generator for the consent form,
- add an admin approval workflow,
- or map items to detailed per-test allowances (requires rules source).


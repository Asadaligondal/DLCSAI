Accommodations persistence API
=============================

Overview
--------
Student records now persist accommodations under the `student_accommodations` field on the `Student` model.

Canonical shape (always present)
--------------------------------
```json
{
  "consent": {
    "parentConsentObtained": false,
    "consentNotes": ""
  },
  "classroom": {
    "presentation": [],
    "response": [],
    "scheduling": [],
    "setting": [],
    "assistive_technology_device": []
  },
  "assessment": {
    "presentation": [],
    "response": [],
    "scheduling": [],
    "setting": [],
    "assistive_technology_device": []
  }
}
```

Each item in arrays is normalized to this shape:
```json
{
  "id": "stable_slug",
  "label": "Full label",
  "subOptions": [],
  "otherText": "",
  "notes": ""
}
```

Endpoints changed
-----------------
- `GET /api/students` — returns list of students. Each student object now includes `accommodations_count` (number) and `has_accommodations` (boolean). Full `student_accommodations` still present in the `student` objects returned, but summary fields are provided for performance.
- `POST /api/students` — `student_accommodations` may be provided in request body. It is validated/normalized before storing.
- `GET /api/students/:id` — returns a single student; `student.student_accommodations` is normalized (canonical shape) and `accommodations_count` is included.
- `PUT /api/students/:id` — accepts `student_accommodations` to replace/update accommodations. Payload is normalized before save.

Validation & normalization
--------------------------
- Any missing keys in the accommodations payload are auto-filled with defaults.
- If payload is null/undefined, the default canonical shape is stored.
- Each array item is coerced to the item shape above; missing fields are set to safe defaults.

Migration
---------
Run the migration to normalize existing students:

```bash
node scripts/migrate_add_student_accommodations.js
```

Testing manual verification
---------------------------
1. Create student with accommodations (POST /api/students payload includes `student_accommodations`).
2. GET the created student: `GET /api/students/:id` — verify `student_accommodations` matches canonical shape and `accommodations_count` is correct.
3. GET students list: `GET /api/students` — verify `accommodations_count` and `has_accommodations` keys.

#!/usr/bin/env node
// Migration: Ensure all students have `student_accommodations` field with canonical shape
import connectDB from '../lib/mongodb';
import Student from '../models/Student';
import { normalizeAccommodations } from '../lib/accommodations';

async function run() {
  await connectDB();
  const students = await Student.find({});
  console.log('Found', students.length, 'students');
  let updated = 0;
  for (const s of students) {
    const before = !!s.student_accommodations;
    const normalized = normalizeAccommodations(s.student_accommodations);
    s.student_accommodations = normalized;
    await s.save();
    if (!before) updated++;
  }
  console.log('Migration complete. Updated', updated, 'students.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

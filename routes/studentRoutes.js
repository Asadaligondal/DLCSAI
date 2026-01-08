const express = require('express');
const router = express.Router();
const { addStudent, getStudents, updateStudent } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/students - Add a new student (protected route)
router.post('/', protect, addStudent);

// GET /api/students - Get all students created by logged-in user (protected route)
router.get('/', protect, getStudents);

// PUT /api/students/:id - Update a student (protected route)
router.put('/:id', protect, updateStudent);

module.exports = router;

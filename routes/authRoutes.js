const express = require('express');
const router = express.Router();
const { register, login, getProfessors, deleteProfessor } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/professors - Get all professors (Admin only)
router.get('/professors', protect, admin, getProfessors);

// DELETE /api/auth/professors/:id - Delete a professor (Admin only)
router.delete('/professors/:id', protect, admin, deleteProfessor);

module.exports = router;

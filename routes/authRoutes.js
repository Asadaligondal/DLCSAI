const express = require('express');
const router = express.Router();
const { register, login, getAllProfessors } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

router.get('/professors', getAllProfessors);

module.exports = router;

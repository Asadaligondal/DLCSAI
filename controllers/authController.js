const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plainPassword: password, // Store plain text password for admin view
      role: role || 'professor',
      schoolId
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        plainPassword: password
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// Get all professors (Admin only)
exports.getProfessors = async (req, res) => {
  try {
    // Find all users with role 'professor'
    const professors = await User.find({ role: 'professor' })
      .select('name email plainPassword')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: professors.length,
      professors
    });
  } catch (error) {
    console.error('Get Professors Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching professors',
      error: error.message
    });
  }
};

// Delete a professor (Admin only)
exports.deleteProfessor = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Attempting to delete professor with ID:', id);

    // Find and delete the professor
    const professor = await User.findOneAndDelete({ _id: id, role: 'professor' });

    if (!professor) {
      console.log('Professor not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Professor not found'
      });
    }

    console.log('Professor deleted successfully:', professor.email);
    res.status(200).json({
      success: true,
      message: 'Professor deleted successfully'
    });
  } catch (error) {
    console.error('Delete Professor Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting professor',
      error: error.message
    });
  }
};

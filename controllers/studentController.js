const Student = require('../models/Student');

// Add a new student
exports.addStudent = async (req, res) => {
  try {
    const { name, studentId, gradeLevel, age, disabilities, strengths, weaknesses } = req.body;

    // Validate required fields
    if (!name || !studentId || !gradeLevel || !age) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, studentId, gradeLevel, and age'
      });
    }

    // Check if student with this ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this ID already exists'
      });
    }

    // Create new student
    const student = await Student.create({
      name,
      studentId,
      gradeLevel,
      age,
      disabilities: disabilities || [],
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student
    });
  } catch (error) {
    console.error('Add Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding student',
      error: error.message
    });
  }
};

// Get all students created by the logged-in user
exports.getStudents = async (req, res) => {
  try {
    // Find all students created by this user
    const students = await Student.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students',
      error: error.message
    });
  }
};

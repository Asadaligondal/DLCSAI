const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@school.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await User.create({
      name: 'Master Admin',
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin Created:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

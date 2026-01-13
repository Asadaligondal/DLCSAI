const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

// MongoDB Connection
// Note: We define this outside the listen block so it runs on Vercel too
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch((error) => {
    console.error('MongoDB Connection Error:', error);
  });

// Server Configuration
const PORT = process.env.PORT || 5000;

// --- CHANGES START HERE ---

// Only run app.listen() if we are NOT in production (i.e., local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
  });
}

// Export the app so Vercel can run it as a serverless function
module.exports = app;
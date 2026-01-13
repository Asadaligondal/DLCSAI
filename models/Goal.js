import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Goal description is required']
  },
  category: {
    type: String,
    enum: ['academic', 'behavioral', 'social', 'physical', 'communication', 'other'],
    default: 'academic'
  },
  targetDisabilities: {
    type: [String],
    default: [],
    description: 'List of disabilities this goal is designed for'
  },
  targetWeaknesses: {
    type: [String],
    default: [],
    description: 'List of weaknesses this goal addresses'
  },
  requiredStrengths: {
    type: [String],
    default: [],
    description: 'List of strengths needed to achieve this goal'
  },
  gradeLevel: {
    type: String,
    required: false,
    description: 'Recommended grade level (e.g., "K-2", "3-5", "6-8", "9-12")'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
GoalSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

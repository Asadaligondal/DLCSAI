import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  gradeLevel: {
    type: String,
    required: [true, 'Grade level is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age must be a positive number']
  },
  disabilities: {
    type: [String],
    default: []
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  state: {
    type: String,
    default: 'Florida'
  },
  instructionalSetting: {
    type: String,
    default: ''
  },
  performanceQuantitative: {
    type: String,
    default: ''
  },
  performanceNarrative: {
    type: String,
    default: ''
  },
  areaOfNeed: {
    type: String,
    default: ''
  },
  iep_plan_data: {
    original_ai_draft: {
      plaafp_narrative: String,
      annual_goals: [String],
      short_term_objectives: [String],
      intervention_recommendations: String
    },
    user_edited_version: {
      plaafp_narrative: String,
      annual_goals: [String],
      short_term_objectives: [String],
      intervention_recommendations: String
    },
    is_reviewed: {
      type: Boolean,
      default: false
    },
    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  assignedGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);

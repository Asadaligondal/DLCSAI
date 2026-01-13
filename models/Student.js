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
  iepPlan: {
    ai_generated_draft: {
      plaafp_narrative: String,
      annual_goals: [String],
      short_term_objectives: [String],
      intervention_recommendations: String,
      generated_at: {
        type: Date,
        default: Date.now
      }
    },
    final_approved_content: {
      plaafp_narrative: String,
      annual_goals: [String],
      short_term_objectives: [String],
      intervention_recommendations: String,
      approved_at: Date,
      approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
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

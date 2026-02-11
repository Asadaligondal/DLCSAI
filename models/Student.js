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
  studentNotes: {
    type: String,
    default: ''
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
  student_accommodations: {
    consent: {
      parentConsentRequired: { type: Boolean, default: false },
      parentConsentObtained: { type: Boolean, default: false },
      consentNotes: { type: String, default: '' }
    },
    classroom: {
      presentation: { type: [Object], default: [] },
      response: { type: [Object], default: [] },
      scheduling: { type: [Object], default: [] },
      setting: { type: [Object], default: [] },
      assistive_technology_device: { type: [Object], default: [] }
    },
    assessment: {
      presentation: { type: [Object], default: [] },
      response: { type: [Object], default: [] },
      scheduling: { type: [Object], default: [] },
      setting: { type: [Object], default: [] },
      assistive_technology_device: { type: [Object], default: [] }
    }
  },
  iep_plan_data: {
    original_ai_draft: {
      plaafp_narrative: String,
      annual_goals: [String],
      // Grouped goals by exceptionality (added to persist AI-generated grouping)
      annualGoalsByExceptionality: [
        {
          exceptionality: String,
          goals: [
            {
              referenceId: String,
              goal: String
            }
          ]
        }
      ],
      short_term_objectives: [String],
      // Grouped short-term objectives by exceptionality
      shortTermObjectivesByExceptionality: [
        {
          exceptionality: String,
          objectives: [
            {
              referenceId: String,
              objective: String,
              alignedAnnualGoalReferenceId: String
            }
          ]
        }
      ],
      intervention_recommendations: String
    },
    user_edited_version: {
      plaafp_narrative: String,
      annual_goals: [String],
      annualGoalsByExceptionality: [
        {
          exceptionality: String,
          goals: [
            {
              referenceId: String,
              goal: String
            }
          ]
        }
      ],
      short_term_objectives: [String],
      shortTermObjectivesByExceptionality: [
        {
          exceptionality: String,
          objectives: [
            {
              referenceId: String,
              objective: String,
              alignedAnnualGoalReferenceId: String
            }
          ]
        }
      ],
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
  annualGoals: {
    type: String,
    default: ''
  },
  servicesRecommendations: {
    type: String,
    default: ''
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

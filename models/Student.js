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
  dateOfBirth: {
    type: Date,
    default: null
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
  schoolName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  parentGuardian1: {
    type: String,
    default: ''
  },
  parentGuardian2: {
    type: String,
    default: ''
  },
  caseManager: {
    type: String,
    default: ''
  },
  primaryExceptionality: {
    type: String,
    default: ''
  },
  relatedServicesTherapy: {
    type: String,
    default: ''
  },
  otherExceptionalities: {
    type: String,
    default: ''
  },
  originalMeetingPlanDate: {
    type: Date,
    default: null
  },
  initiationDate: {
    type: Date,
    default: null
  },
  durationDate: {
    type: Date,
    default: null
  },
  reviewDueDate: {
    type: Date,
    default: null
  },
  reevaluationDueDate: {
    type: Date,
    default: null
  },
  amendmentDate: {
    type: Date,
    default: null
  },
  previouslyAmended: {
    type: String,
    default: ''
  },
  meetingPurpose: {
    type: String,
    default: ''
  },
  meetingPurposeTags: {
    type: [String],
    default: []
  },
  meetingPurposeOther: {
    type: String,
    default: ''
  },
  /** Optional assessment notes (any subject/format) — used only for PLAAFP + academic performance generation */
  assessmentContext: {
    type: String,
    default: ''
  },
  /** Last IEP generation / meeting type (e.g. Annual review) — set from regenerate modal (M5) */
  generationType: {
    type: String,
    default: ''
  },
  domainsTransitionAreas: {
    type: String,
    default: ''
  },
  associatedPlans: {
    type: String,
    default: ''
  },
  /** Florida IEP domain areas (multi-select; subset of DOMAIN_AREA_OPTIONS) */
  domainAreas: {
    type: [String],
    default: []
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
      annual_goals: [mongoose.Schema.Types.Mixed],
      annualGoalsByExceptionality: [
        {
          exceptionality: String,
          goals: [{ referenceId: String, goal: String }]
        }
      ],
      short_term_objectives: [mongoose.Schema.Types.Mixed],
      shortTermObjectivesByExceptionality: [
        {
          exceptionality: String,
          objectives: [{ referenceId: String, objective: String, alignedAnnualGoalReferenceId: String }]
        }
      ],
      intervention_recommendations: String,
      recommendedAccommodations: [String],
      academicPerformanceAchievement: String,
      custom_goals: [{ title: String, recommendation: String, retrieved_objectives: [String] }]
    },
    user_edited_version: {
      plaafp_narrative: String,
      annual_goals: [mongoose.Schema.Types.Mixed],
      annualGoalsByExceptionality: [
        {
          exceptionality: String,
          goals: [{ referenceId: String, goal: String }]
        }
      ],
      short_term_objectives: [mongoose.Schema.Types.Mixed],
      shortTermObjectivesByExceptionality: [
        {
          exceptionality: String,
          objectives: [{ referenceId: String, objective: String, alignedAnnualGoalReferenceId: String }]
        }
      ],
      intervention_recommendations: String,
      recommendedAccommodations: [String],
      academicPerformanceAchievement: String,
      custom_goals: [{ title: String, recommendation: String, retrieved_objectives: [String] }]
    },
    is_reviewed: { type: Boolean, default: false },
    last_updated: { type: Date, default: Date.now },
    rag_context: String
  },
  annualGoals: {
    type: String,
    default: ''
  },
  servicesRecommendations: {
    type: String,
    default: ''
  },
  iep_version_history: {
    type: [{
      version: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
      source: { type: String, default: 'save' },
      label: { type: String, default: '' },
      snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
      meta: {
        is_reviewed: { type: Boolean, default: false },
        last_updated: { type: Date }
      }
    }],
    default: []
  },
  assignedGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    default: null,
    index: true
  },
  /**
   * Team collaboration (notes-only surface). Primary case manager is always createdBy — not duplicated here.
   * Collaborators are professor users invited by primary or admin; they do not get full student APIs by default.
   */
  collaborators: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        roleKey: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  collaborationNotes: {
    type: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        roleKey: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  /** Admin-only moves; case managers may read for audit. Capped in application code. */
  rosterAssignmentHistory: {
    type: [
      {
        at: { type: Date, default: Date.now },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fromCaseManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        toCaseManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fromClassroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
        toClassroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
      },
    ],
    default: [],
  },
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

// Avoid a stale compiled model (Next.js HMR / schema edits) stripping fields not in the cached schema.
if (mongoose.models.Student) {
  delete mongoose.models.Student;
}
export default mongoose.model('Student', StudentSchema);

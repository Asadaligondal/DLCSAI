import mongoose from 'mongoose';

/**
 * Classroom grouping for students under a service provider (professor).
 * Admin-managed: each classroom belongs to exactly one provider.
 */
const ClassroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
    },
    gradeLevel: {
      type: String,
      default: '',
      trim: true,
    },
    schoolName: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true }
);

ClassroomSchema.index({ providerId: 1, createdAt: -1 });

if (mongoose.models.Classroom) {
  delete mongoose.models.Classroom;
}
export default mongoose.model('Classroom', ClassroomSchema);

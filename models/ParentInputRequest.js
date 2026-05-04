import mongoose from 'mongoose';

const ParentInputRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'submitted'],
    default: 'pending',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  strengths: { type: String, default: '' },
  successesYear: { type: String, default: '' },
  concerns: { type: String, default: '' },
  additional: { type: String, default: '' },
  parentSignerName: { type: String, default: '' },
  parentFormDate: { type: String, default: '' },
  submittedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.ParentInputRequest) {
  delete mongoose.models.ParentInputRequest;
}
export default mongoose.model('ParentInputRequest', ParentInputRequestSchema);

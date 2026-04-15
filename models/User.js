import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  plainPassword: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'professor'],
    default: 'professor'
  },
  schoolId: {
    type: String,
    required: false
  },
  profilePicture: {
    type: String,
    required: false,
    default: null
  },
  floridaIepLogo: {
    type: String,
    required: false,
    default: null
  },
  passwordResetToken: {
    type: String,
    select: false,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    select: false,
    default: null
  },
  /** false = professor must verify a real inbox (set when admin creates account) */
  emailVerified: {
    type: Boolean,
    default: true
  },
  pendingEmail: {
    type: String,
    select: false,
    default: null
  },
  emailVerificationToken: {
    type: String,
    select: false,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

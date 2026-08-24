import mongoose from 'mongoose';

const attemptHistorySchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0 },
  claimedLevel: { type: String, default: 'Intermediate' },
  testScore: { type: Number, required: true },
  practicalScore: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  verifiedConfidence: { type: Number, required: true },
  verifiedLevel: { type: String, default: 'Intermediate' },
  status: {
    type: String,
    enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_MORE_EVIDENCE', 'UNVERIFIED'],
    default: 'UNVERIFIED'
  }
}, { _id: false });

const skillVerificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  skillName: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  claimedLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  verifiedLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Unverified'],
    default: 'Unverified'
  },
  testScore: { type: Number, default: 0 }, // 0 to 100
  practicalScore: { type: Number, default: 0 }, // 0 to 100
  consistencyScore: { type: Number, default: 0 }, // 0 to 100
  verifiedConfidence: { type: Number, default: 0 }, // 0 to 100
  status: {
    type: String,
    enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_MORE_EVIDENCE', 'UNVERIFIED'],
    default: 'UNVERIFIED'
  },
  strongAreas: [{ type: String }],
  improvements: [{ type: String }],
  projectEvidence: [{
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String },
    tasksCompleted: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: Date.now }
  }],
  attemptsCount: { type: Number, default: 0 },
  history: [attemptHistorySchema],
  lastAttemptAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

skillVerificationSchema.index({ user: 1, skillName: 1 }, { unique: true });

export default mongoose.model('SkillVerification', skillVerificationSchema);

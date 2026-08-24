import mongoose from 'mongoose';

const userFeedbackSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  technicalSkills: { type: Number, required: true, min: 1, max: 5 },
  communication: { type: Number, required: true, min: 1, max: 5 },
  reliability: { type: Number, required: true, min: 1, max: 5 },
  contribution: { type: Number, required: true, min: 1, max: 5 },
  wouldWorkAgain: { type: Boolean, default: true },
  writtenFeedback: { type: String, trim: true, maxlength: 1000, default: '' },
  createdAt: { type: Date, default: Date.now }
});

userFeedbackSchema.index({ author: 1, recipient: 1, project: 1 }, { unique: true });

export default mongoose.model('UserFeedback', userFeedbackSchema);

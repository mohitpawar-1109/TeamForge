import mongoose from 'mongoose';

const projectFeedbackSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  technicalQuality: { type: Number, required: true, min: 1, max: 5 },
  communication: { type: Number, required: true, min: 1, max: 5 },
  reliability: { type: Number, required: true, min: 1, max: 5 },
  contribution: { type: Number, required: true, min: 1, max: 5 },
  documentation: { type: Number, required: true, min: 1, max: 5 },
  problemSolving: { type: Number, required: true, min: 1, max: 5 },
  writtenFeedback: { type: String, trim: true, maxlength: 1000, default: '' },
  createdAt: { type: Date, default: Date.now }
});

projectFeedbackSchema.index({ author: 1, project: 1 }, { unique: true });

export default mongoose.model('ProjectFeedback', projectFeedbackSchema);

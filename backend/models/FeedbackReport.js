import mongoose from 'mongoose';

const feedbackReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true
  },
  reason: {
    type: String,
    enum: [
      'Spam',
      'Harassment',
      'Fake feedback',
      'Offensive content',
      'Irrelevant',
      'Other'
    ],
    required: true
  },
  details: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Dismissed'],
    default: 'Pending'
  }
}, { timestamps: true });

feedbackReportSchema.index({ reporter: 1, feedback: 1 }, { unique: true });
feedbackReportSchema.index({ status: 1 });

export default mongoose.model('FeedbackReport', feedbackReportSchema);

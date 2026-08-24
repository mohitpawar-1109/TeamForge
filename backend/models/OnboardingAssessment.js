import mongoose from 'mongoose';

const questionItemSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  skill: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'code_output', 'debugging', 'practical_coding', 'scenario_architecture'],
    default: 'multiple_choice'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  question: { type: String, required: true },
  codeSnippet: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index 0..3 (Stored securely on backend)
  concept: { type: String, default: 'General' },
  points: { type: Number, default: 10 }
}, { _id: false });

const onboardingAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skills: [{
    name: { type: String, required: true },
    claimedLevel: { type: String, default: 'Intermediate' }
  }],
  questions: [questionItemSchema],
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  },
  results: {
    overallScore: { type: Number, default: 0 },
    verifiedConfidence: { type: Number, default: 0 },
    skillResults: [{
      skill: { type: String },
      claimedLevel: { type: String },
      verifiedLevel: { type: String },
      score: { type: Number },
      status: { type: String },
      strongAreas: [{ type: String }],
      improvements: [{ type: String }]
    }]
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto expires after 24 hours
});

export default mongoose.model('OnboardingAssessment', onboardingAssessmentSchema);

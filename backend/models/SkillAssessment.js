import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'code_output', 'debugging', 'practical_coding', 'scenario_architecture'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true
  },
  question: { type: String, required: true },
  codeSnippet: { type: String, default: '' },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true }, // Zero-indexed
  explanation: { type: String, default: '' },
  category: { type: String, default: 'General' },
  points: { type: Number, default: 10 }
}, { _id: false });

const skillAssessmentSchema = new mongoose.Schema({
  skillName: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true },
  category: { type: String, default: 'General' },
  description: { type: String, default: '' },
  questions: [questionSchema],
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SkillAssessment', skillAssessmentSchema);

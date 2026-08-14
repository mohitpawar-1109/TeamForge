import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'Contributor' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, default: 'AI / Machine Learning' },
  difficulty: { type: String, enum: ['Beginner', 'Medium', 'Advanced', 'Hard'], default: 'Medium' },
  duration: { type: String, default: '4-6 Weeks' },
  teamSize: { type: Number, default: 4 },
  requiredSkills: [{ type: String }],
  suggestedRoles: [{ type: String }],
  availabilityNeeded: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  aiAnalysis: {
    analyzed: { type: Boolean, default: false },
    difficulty: { type: String, default: 'Medium' },
    recommendedTeamSize: { type: Number, default: 4 },
    requiredSkills: [{ type: String }],
    suggestedRoles: [{ type: String }],
    potentialChallenges: [{ type: String }],
    skillImportance: { type: Map, of: String, default: {} }
  },
  status: { type: String, enum: ['Recruiting', 'In Progress', 'Completed', 'Paused'], default: 'Recruiting' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);

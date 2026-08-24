import mongoose from 'mongoose';

const sanitizeMapKey = (key) => String(key).replace(/\./g, '․').replace(/^\$/, '＄');
const restoreMapKey = (key) => String(key).replace(/\u2024/g, '.').replace(/^＄/, '$');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'Contributor' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  analyzed: { type: Boolean, default: false },
  difficulty: { type: String, default: 'Medium' },
  recommendedTeamSize: { type: Number, default: 4 },
  requiredSkills: [{ type: String }],
  suggestedRoles: [{ type: String }],
  potentialChallenges: [{ type: String }],
  skillImportance: {
    type: Map,
    of: String,
    default: () => new Map()
  }
}, { _id: false });

const formatSkillImportanceOutput = (ret) => {
  if (ret && ret.aiAnalysis && ret.aiAnalysis.skillImportance) {
    const raw = ret.aiAnalysis.skillImportance;
    const restored = {};
    if (raw instanceof Map) {
      for (const [k, v] of raw.entries()) {
        restored[restoreMapKey(k)] = v;
      }
    } else if (typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        restored[restoreMapKey(k)] = v;
      }
    }
    ret.aiAnalysis.skillImportance = restored;
  }
  return ret;
};

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
  aiAnalysis: aiAnalysisSchema,
  status: { type: String, enum: ['Recruiting', 'In Progress', 'Completed', 'Paused'], default: 'Recruiting' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  projectReputationScore: { type: Number, default: 0, min: 0, max: 100 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  feedbackCount: { type: Number, default: 0 },
  verifiedFeedbackCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    flattenMaps: true,
    transform: (doc, ret) => formatSkillImportanceOutput(ret)
  },
  toObject: {
    flattenMaps: true,
    transform: (doc, ret) => formatSkillImportanceOutput(ret)
  }
});

export default mongoose.model('Project', projectSchema);

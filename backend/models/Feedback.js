import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    enum: ["user", "project"],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  categories: {
    // For user feedback
    communication: { type: Number, min: 1, max: 5 },
    technicalSkill: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    
    // For project feedback
    projectQuality: { type: Number, min: 1, max: 5 },
    teamCollaboration: { type: Number, min: 1, max: 5 },
    execution: { type: Number, min: 1, max: 5 }
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Prevent duplicate reviews:
// For user reviews: 1 reviewer per reviewee per project
feedbackSchema.index(
  { reviewer: 1, reviewee: 1, project: 1, type: 1 }, 
  { unique: true, partialFilterExpression: { type: 'user', deletedAt: null } }
);

// For project reviews: 1 reviewer per project
feedbackSchema.index(
  { reviewer: 1, project: 1, type: 1 }, 
  { unique: true, partialFilterExpression: { type: 'project', deletedAt: null } }
);

feedbackSchema.index({ createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);

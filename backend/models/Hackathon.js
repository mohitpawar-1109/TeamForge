import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  tagline: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  bannerImage: {
    type: String,
    default: ''
  },
  organizer: {
    name: { type: String, default: 'Global Hackathon League' },
    logo: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  mode: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid'],
    default: 'Online',
    index: true
  },
  location: {
    type: String,
    default: 'Virtual / Online'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels',
    index: true
  },
  teamSize: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 4 }
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  themes: [{
    type: String,
    trim: true
  }],
  prizePool: {
    type: String,
    default: '$10,000'
  },
  prizes: [{
    title: String,
    amount: String,
    description: String
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true,
    index: true
  },
  timeline: [{
    stage: String,
    date: Date,
    description: String
  }],
  websiteUrl: {
    type: String,
    default: ''
  },
  rules: [{
    type: String
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  interestedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  source: {
    type: String,
    default: 'teamforge-curated'
  },
  externalId: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

hackathonSchema.index({ title: 'text', description: 'text', requiredSkills: 'text', themes: 'text' });

export default mongoose.model('Hackathon', hackathonSchema);

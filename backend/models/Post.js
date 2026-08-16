import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'TEXT',
      'PROJECT',
      'HACKATHON',
      'QUESTION',
      'ACHIEVEMENT',
      'LOOKING_FOR_TEAMMATES'
    ],
    default: 'TEXT'
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    default: ''
  },
  projectLink: {
    type: String,
    default: '',
    trim: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  // Team Building Fields (for LOOKING_FOR_TEAMMATES)
  title: {
    type: String,
    trim: true,
    default: ''
  },
  requiredRoles: [{
    type: String,
    trim: true
  }],
  requiredSkills: [{
    type: String,
    trim: true
  }],
  teamSize: {
    type: Number,
    default: 4,
    min: 2,
    max: 20
  },
  currentMembers: {
    type: Number,
    default: 1,
    min: 1
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for fast chronological feed query
postSchema.index({ createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ tags: 1 });

export default mongoose.model('Post', postSchema);

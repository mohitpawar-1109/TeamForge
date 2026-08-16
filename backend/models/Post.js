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
  }
}, {
  timestamps: true
});

// Index for fast chronological feed query
postSchema.index({ createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ tags: 1 });

export default mongoose.model('Post', postSchema);

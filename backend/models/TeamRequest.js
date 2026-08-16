import mongoose from 'mongoose';

const teamRequestSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester reference is required']
  },
  postAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author reference is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

teamRequestSchema.index({ post: 1, requester: 1 });
teamRequestSchema.index({ postAuthor: 1, status: 1 });
teamRequestSchema.index({ requester: 1, status: 1 });

export default mongoose.model('TeamRequest', teamRequestSchema);

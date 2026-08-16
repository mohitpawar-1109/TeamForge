import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author reference is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  }
}, {
  timestamps: true
});

commentSchema.index({ post: 1, createdAt: 1 });

export default mongoose.model('Comment', commentSchema);

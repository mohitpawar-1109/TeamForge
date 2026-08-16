import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Alias for backward compatibility with earlier codebase references
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'LIKE',
      'COMMENT',
      'TEAM_REQUEST',
      'TEAM_REQUEST_ACCEPTED',
      'TEAM_REQUEST_REJECTED',
      'MATCH_FOUND',
      'invite',
      'team_join',
      'task',
      'match',
      'general'
    ],
    default: 'general'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedTeamRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamRequest'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-validate middleware to synchronize recipient and user fields before validation
notificationSchema.pre('validate', function (next) {
  if (this.recipient && !this.user) {
    this.user = this.recipient;
  } else if (this.user && !this.recipient) {
    this.recipient = this.user;
  }
  next();
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

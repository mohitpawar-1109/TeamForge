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
      'team_invite',
      'group_invite',
      'group_member_joined',
      'new_message',
      'post_like',
      'post_comment',
      'project_invite',
      'task_assigned',
      'task_completed',
      'team_update',
      'ai_recommendation',
      'hackathon_deadline',
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
  link: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
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

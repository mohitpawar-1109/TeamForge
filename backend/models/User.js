import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
  category: { type: String, default: 'General' },
  verified: { type: Boolean, default: false },
  endorsements: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { 
    type: String, 
    required: function() { return this.authProvider === 'local'; } 
  },
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  googleId: { type: String, sparse: true, index: true },
  headline: { type: String, default: 'Student Developer' },
  college: { type: String, default: 'Institute of Technology' },
  course: { type: String, default: 'Computer Science & Engineering' },
  year: { type: String, default: '3rd Year' },
  location: { type: String, default: 'Campus, Tech Hub' },
  bio: { type: String, default: 'Passionate student eager to build impactful collaborative projects.' },
  avatar: { type: String, default: '' },
  skills: [skillSchema],
  interests: [{ type: String }],
  availability: [{ type: String }],
  weeklyHours: { type: Number, default: 15 },
  experienceLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Experienced', 'Veteran'], default: 'Intermediate' },
  pastProjectsCount: { type: Number, default: 0 },
  teamsJoinedCount: { type: Number, default: 0 },
  contributionsCount: { type: Number, default: 0 },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);


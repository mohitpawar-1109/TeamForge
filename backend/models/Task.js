import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['TODO', 'IN PROGRESS', 'DONE'], default: 'TODO' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', taskSchema);

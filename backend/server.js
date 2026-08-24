import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { initSocket } from './socket/socket.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import matchRoutes from './routes/match.routes.js';
import aiRoutes from './routes/ai.routes.js';
import inviteRoutes from './routes/invite.routes.js';
import taskRoutes from './routes/task.routes.js';
import notifRoutes from './routes/notif.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import teamRequestRoutes from './routes/teamRequest.routes.js';
import messageRoutes from './routes/message.routes.js';
import groupRoutes from './routes/group.routes.js';
import hackathonRoutes from './routes/hackathon.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import rankingRoutes from './routes/ranking.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
initSocket(server);

// Database Connection
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for hackathon demo convenience
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Version header for deployment verification
app.use((req, res, next) => {
  res.setHeader('X-TeamForge-Backend-Version', 'media-upload-v2');
  next();
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'TeamForge API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', matchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invitations', inviteRoutes);
app.use('/api', taskRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/team-requests', teamRequestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api', verificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/rankings', rankingRoutes);

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 TeamForge API & Real-time Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export const authenticateSocket = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }

    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET || 'teamforge_super_secret_jwt_key_2026_hackathon_demo';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach authenticated user to socket instance
    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (error) {
    return next(new Error(`Authentication error: ${error.message || 'Token verification failed'}`));
  }
};

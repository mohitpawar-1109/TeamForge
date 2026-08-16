import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamforge';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    if (uri !== 'mongodb://127.0.0.1:27017/teamforge') {
      console.log('[MongoDB] Retrying connection with local MongoDB fallback...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/teamforge');
        console.log(`[MongoDB] Connected to local fallback: ${localConn.connection.host}/${localConn.connection.name}`);
        return true;
      } catch (localErr) {
        console.error(`[MongoDB Fallback Error] ${localErr.message}`);
      }
    }
    return false;
  }
};

import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamforge';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connection successful. Active Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    if (uri !== 'mongodb://127.0.0.1:27017/teamforge') {
      console.log('[MongoDB] Retrying connection with local MongoDB fallback...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/teamforge');
        console.log(`[MongoDB] Fallback connection successful. Active Database: ${localConn.connection.name}`);
        return true;
      } catch (localErr) {
        console.error(`[MongoDB Fallback Error] ${localErr.message}`);
      }
    }
    return false;
  }
};

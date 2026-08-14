import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamforge');
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    console.log('[MongoDB] Running with database connection fallback mode.');
    return false;
  }
};

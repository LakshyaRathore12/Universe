import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universe_events';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  if (isConnected) {
    return true;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000, // Quick timeout if MongoDB is not running locally
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn('[MongoDB] MongoDB server not reachable at MONGODB_URI, operating with high-speed in-memory database store.');
    return false;
  }
};

export const getDBStatus = () => ({
  isConnected,
  uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
});

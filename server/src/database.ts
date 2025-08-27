import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/affiliate';

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "princetongreen-affiliate",
    });
    console.log('✅ MongoDB connected to', process.env.MONGODB_DB_NAME || "princetongreen-affiliate");
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

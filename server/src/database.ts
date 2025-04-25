import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/affiliate';

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);  // No need for `useNewUrlParser` and `useUnifiedTopology` anymore
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1); // Exit with failure
  }
}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // This will load the environment variables from .env files


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/affiliate';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions);  // 👈 necessary to prevent TS warning

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('🧘 Connected to MongoDB');
});

export default db;

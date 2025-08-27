import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/affiliate';

mongoose.connect(MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME || "princetongreen-affiliate",
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('🧘 Connected to MongoDB:', process.env.MONGODB_DB_NAME || "princetongreen-affiliate");
});

export default db;

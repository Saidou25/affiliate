import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

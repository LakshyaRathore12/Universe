import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'club_organizer' | 'admin';
  clubId?: string;
  clubName?: string;
  studentId?: string;
  department?: string;
  year?: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { 
      type: String, 
      enum: ['student', 'club_organizer', 'admin'], 
      default: 'student', 
      required: true 
    },
    clubId: { type: String, default: null },
    clubName: { type: String, default: null },
    studentId: { type: String, default: null },
    department: { type: String, default: null },
    year: { type: String, default: null },
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> = 
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

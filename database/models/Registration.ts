import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegistration extends Document {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId?: string;
  department?: string;
  ticketCode: string;
  qrCodeUrl?: string;
  registeredAt: Date;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  checkedInAt?: Date;
  attendanceVerifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema: Schema<IRegistration> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    studentId: { type: String },
    department: { type: String },
    ticketCode: { type: String, required: true, unique: true, index: true },
    qrCodeUrl: { type: String },
    registeredAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    checkedInAt: { type: Date },
    attendanceVerifiedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate registrations
RegistrationSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });

export const RegistrationModel: Model<IRegistration> = 
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClub extends Document {
  id: string;
  name: string;
  category: 'Technical' | 'Cultural' | 'Academic' | 'Literary' | 'Sports' | 'Social';
  description: string;
  leadName: string;
  leadEmail: string;
  facultyAdvisor: string;
  logo: string;
  bannerImage: string;
  memberCount: number;
  eventsHosted: number;
  foundedYear: number;
  isVerified: boolean;
  website?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema: Schema<IClub> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Academic', 'Literary', 'Sports', 'Social'],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    leadName: { type: String, required: true },
    leadEmail: { type: String, required: true, lowercase: true, trim: true },
    facultyAdvisor: { type: String, required: true },
    logo: { type: String, required: true },
    bannerImage: { type: String, required: true },
    memberCount: { type: Number, default: 0 },
    eventsHosted: { type: Number, default: 0 },
    foundedYear: { type: Number, default: () => new Date().getFullYear() },
    isVerified: { type: Boolean, default: true },
    website: { type: String },
    socialLinks: {
      instagram: { type: String },
      linkedin: { type: String },
      github: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const ClubModel: Model<IClub> = 
  mongoose.models.Club || mongoose.model<IClub>('Club', ClubSchema);

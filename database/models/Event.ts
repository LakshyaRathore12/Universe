import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession {
  time: string;
  topic: string;
  speaker?: string;
  room?: string;
}

export interface ISpeaker {
  name: string;
  role: string;
  organization?: string;
  avatar?: string;
  bio?: string;
}

export interface IEvent extends Document {
  id: string;
  title: string;
  category: 'Workshop' | 'Seminar' | 'Hackathon' | 'Guest Lecture' | 'Cultural' | 'Tech Talk';
  clubId: string;
  clubName: string;
  description: string;
  detailedAgenda: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  venueCapacity: number;
  capacity: number;
  registeredCount: number;
  tags: string[];
  speakers: ISpeaker[];
  sessions: ISession[];
  prerequisites?: string[];
  isCertificateProvided: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  cancellationReason?: string;
  rescheduleNotice?: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const SpeakerSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    organization: { type: String },
    avatar: { type: String },
    bio: { type: String },
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    time: { type: String, required: true },
    topic: { type: String, required: true },
    speaker: { type: String },
    room: { type: String },
  },
  { _id: false }
);

const EventSchema: Schema<IEvent> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Workshop', 'Seminar', 'Hackathon', 'Guest Lecture', 'Cultural', 'Tech Talk'],
      required: true,
      index: true,
    },
    clubId: { type: String, required: true, index: true },
    clubName: { type: String, required: true },
    description: { type: String, required: true },
    detailedAgenda: { type: String, required: true },
    coverImage: { type: String, required: true },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true },
    venueCapacity: { type: Number, required: true },
    capacity: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    speakers: [SpeakerSchema],
    sessions: [SessionSchema],
    prerequisites: [{ type: String }],
    isCertificateProvided: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    cancellationReason: { type: String },
    rescheduleNotice: { type: String },
    contactEmail: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const EventModel: Model<IEvent> = 
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

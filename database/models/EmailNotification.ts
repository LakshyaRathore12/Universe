import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailNotification extends Document {
  id: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  plainText: string;
  htmlContent: string;
  type: 'registration_confirmation' | 'schedule_change' | 'organizer_announcement' | 'cancellation' | 'reminder';
  eventId?: string;
  eventTitle?: string;
  ticketCode?: string;
  sentAt: Date;
  read: boolean;
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const EmailNotificationSchema: Schema<IEmailNotification> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipientEmail: { type: String, required: true, lowercase: true, index: true },
    recipientName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    subject: { type: String, required: true },
    plainText: { type: String, required: true },
    htmlContent: { type: String, required: true },
    type: {
      type: String,
      enum: ['registration_confirmation', 'schedule_change', 'organizer_announcement', 'cancellation', 'reminder'],
      required: true,
      index: true,
    },
    eventId: { type: String, index: true },
    eventTitle: { type: String },
    ticketCode: { type: String },
    sentAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    deliveryStatus: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed'],
      default: 'delivered',
    },
  },
  {
    timestamps: true,
  }
);

export const EmailNotificationModel: Model<IEmailNotification> = 
  mongoose.models.EmailNotification || mongoose.model<IEmailNotification>('EmailNotification', EmailNotificationSchema);

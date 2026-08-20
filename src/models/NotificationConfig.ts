import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationConfig extends Document {
  shopId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  whatsappNumber: string;
  reportTime: string; // Format "HH:MM" e.g., "18:30"
  enabled: boolean;
  lastSentDate?: string; // Format "YYYY-MM-DD"
  createdAt: Date;
  updatedAt: Date;
}

const notificationConfigSchema = new Schema<INotificationConfig>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    whatsappNumber: { type: String, required: true, trim: true },
    reportTime: { type: String, required: true, trim: true }, // "HH:MM"
    enabled: { type: Boolean, default: false },
    lastSentDate: { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique constraint per shop and user configuration
notificationConfigSchema.index({ shopId: 1, userId: 1 }, { unique: true });

export const NotificationConfig = mongoose.model<INotificationConfig>(
  'NotificationConfig',
  notificationConfigSchema
);

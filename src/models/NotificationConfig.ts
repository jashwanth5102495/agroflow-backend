import mongoose, { Document, Schema } from 'mongoose';

export type NotificationChannel = 'WHATSAPP' | 'TELEGRAM' | 'BOTH';

export interface INotificationConfig extends Document {
  shopId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  telegramChatId?: string;
  whatsappPhoneNumber?: string;
  reportTime: string; // Format "HH:MM" e.g., "20:00"
  shift1Time: string; // Format "HH:MM" e.g., "23:30"
  shift2Time: string; // Format "HH:MM" e.g., "10:00"
  enabled: boolean;
  lastSentDate?: string; // Format "YYYY-MM-DD"
  lastShift1SentDate?: string;
  lastShift2SentDate?: string;
  whatsappConnectedNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationConfigSchema = new Schema<INotificationConfig>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'TELEGRAM', 'BOTH'],
      default: 'WHATSAPP',
    },
    telegramChatId: { type: String, trim: true, default: '' },
    whatsappPhoneNumber: { type: String, trim: true, default: '' },
    reportTime: { type: String, trim: true, default: '20:00' }, // "HH:MM"
    shift1Time: { type: String, trim: true, default: '23:30' }, // "HH:MM"
    shift2Time: { type: String, trim: true, default: '10:00' }, // "HH:MM"
    enabled: { type: Boolean, default: false },
    lastSentDate: { type: String, trim: true },
    lastShift1SentDate: { type: String, trim: true },
    lastShift2SentDate: { type: String, trim: true },
    whatsappConnectedNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique constraint per shop and user configuration
notificationConfigSchema.index({ shopId: 1, userId: 1 }, { unique: true });

export const NotificationConfig = mongoose.model<INotificationConfig>(
  'NotificationConfig',
  notificationConfigSchema
);

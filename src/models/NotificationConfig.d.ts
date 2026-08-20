import mongoose, { Document } from 'mongoose';
export interface INotificationConfig extends Document {
    shopId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    whatsappNumber: string;
    reportTime: string;
    enabled: boolean;
    lastSentDate?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const NotificationConfig: mongoose.Model<INotificationConfig, {}, {}, {}, Document<unknown, {}, INotificationConfig, {}, mongoose.DefaultSchemaOptions> & INotificationConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INotificationConfig>;
//# sourceMappingURL=NotificationConfig.d.ts.map
import mongoose, { Document } from 'mongoose';
import { PaymentMethod } from './Sale';
export interface IPayment extends Document {
    shopId: mongoose.Types.ObjectId;
    referenceId?: mongoose.Types.ObjectId;
    referenceType: 'SALE' | 'PURCHASE' | 'CREDIT_SETTLEMENT';
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, Document<unknown, {}, IPayment, {}, mongoose.DefaultSchemaOptions> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayment>;
//# sourceMappingURL=Payment.d.ts.map
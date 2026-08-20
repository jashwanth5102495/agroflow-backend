import mongoose, { Document, Schema } from 'mongoose';
import { PaymentMethod } from './Sale';

export interface IPayment extends Document {
  shopId: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId; // E.g., Sale ID, Purchase ID, Credit ID
  referenceType: 'SALE' | 'PURCHASE' | 'CREDIT_SETTLEMENT';
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceType: {
      type: String,
      enum: ['SALE', 'PURCHASE', 'CREDIT_SETTLEMENT'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IDataRequest extends Document {
  shopId: mongoose.Types.ObjectId;
  requestDate: Date;
  month: string;
  year: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED';
  amount: number;
  paymentTransactionId?: string;
}

const DataRequestSchema: Schema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    requestDate: { type: Date, default: Date.now },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'FULFILLED'],
      default: 'PENDING_PAYMENT',
    },
    amount: { type: Number, default: 50 },
    paymentTransactionId: { type: String },
  },
  { timestamps: true }
);

export const DataRequest = mongoose.model<IDataRequest>('DataRequest', DataRequestSchema);

import mongoose, { Document, Schema } from 'mongoose';

export enum CreditTransactionType {
  CREDIT_ADDED = 'CREDIT_ADDED', // From a Sale
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface ICreditTransaction extends Document {
  shopId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  referenceId?: mongoose.Types.ObjectId; // e.g. Sale ID or Payment ID
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    type: { type: String, enum: Object.values(CreditTransactionType), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

creditTransactionSchema.index({ shopId: 1, farmerId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', creditTransactionSchema);

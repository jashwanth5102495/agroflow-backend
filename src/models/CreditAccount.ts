import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditAccount extends Document {
  shopId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  balance: number; // Positive means farmer owes the shop
  lastUpdatedAt: Date;
}

const creditAccountSchema = new Schema<ICreditAccount>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

creditAccountSchema.index({ shopId: 1, farmerId: 1 }, { unique: true });

export const CreditAccount = mongoose.model<ICreditAccount>('CreditAccount', creditAccountSchema);

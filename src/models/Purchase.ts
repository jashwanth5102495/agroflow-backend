import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  shopId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  purchaseDate: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  amountPaid: number;
  amountDue: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    invoiceNumber: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'UNPAID' },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.index({ shopId: 1, invoiceNumber: 1 });
purchaseSchema.index({ shopId: 1, supplierId: 1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);

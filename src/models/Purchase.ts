import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  shopId: mongoose.Types.ObjectId;
  companyName: string;
  supplierId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  purchaseDate: Date;
  subtotal: number;
  discount: number;
  gstRate?: number;
  tax: number; // GST Amount
  total: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: false },
    invoiceNumber: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 }, // GST amount
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'PAID' },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.index({ shopId: 1, invoiceNumber: 1 });
purchaseSchema.index({ shopId: 1, companyName: 1 });
purchaseSchema.index({ shopId: 1, purchaseDate: -1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);

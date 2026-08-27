import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT',
  PARTIAL = 'PARTIAL'
}

export interface ISale extends Document {
  shopId: mongoose.Types.ObjectId;
  farmerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: PaymentMethod;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: false, index: true },
    customerName: { type: String, required: false },
    customerPhone: { type: String, required: false },
    invoiceNumber: { type: String, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    amountDue: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

saleSchema.index({ shopId: 1, invoiceNumber: 1 });
saleSchema.index({ shopId: 1, createdAt: -1 });

export const Sale = mongoose.model<ISale>('Sale', saleSchema);

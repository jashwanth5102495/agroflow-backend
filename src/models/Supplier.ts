import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supplierSchema.index({ shopId: 1, phone: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);

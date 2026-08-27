import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  brand?: string;
  category: string;
  sku?: string;
  description?: string;
  unit: string; // e.g., 'kg', 'ltr', 'bag'
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    description: { type: String, trim: true },
    unit: { type: String, required: true, trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    maximumStock: { type: Number, min: 0 },
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
productSchema.index({ shopId: 1, sku: 1 });
productSchema.index({ shopId: 1, name: 1 });
productSchema.index({ shopId: 1, category: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);

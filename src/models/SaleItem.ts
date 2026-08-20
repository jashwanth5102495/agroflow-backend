import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem extends Document {
  saleId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  }
);

export const SaleItem = mongoose.model<ISaleItem>('SaleItem', saleItemSchema);

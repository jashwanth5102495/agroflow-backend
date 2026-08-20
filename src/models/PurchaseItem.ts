import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseItem extends Document {
  purchaseId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  purchasePrice: number;
  subtotal: number;
}

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  }
);

export const PurchaseItem = mongoose.model<IPurchaseItem>('PurchaseItem', purchaseItemSchema);

import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  CORRECTION = 'CORRECTION',
}

export interface IInventoryTransaction extends Document {
  shopId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: TransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string; // e.g. 'PURCHASE', 'SALE'
  referenceId?: mongoose.Types.ObjectId;
  reason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    quantity: { type: Number, required: true }, // positive or negative
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    reason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryTransactionSchema.index({ shopId: 1, productId: 1, createdAt: -1 });

export const InventoryTransaction = mongoose.model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema);

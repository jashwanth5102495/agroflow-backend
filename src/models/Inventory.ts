import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  shopId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  lastUpdated: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A shop can only have one inventory record per product
inventorySchema.index({ shopId: 1, productId: 1 }, { unique: true });

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

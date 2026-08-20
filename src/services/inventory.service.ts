import mongoose from 'mongoose';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';

export const getInventoryService = async (shopId: string, skip: number, limit: number) => {
  const [inventory, total] = await Promise.all([
    Inventory.find({ shopId }).populate('productId', 'name sku category').skip(skip).limit(limit),
    Inventory.countDocuments({ shopId }),
  ]);
  return { inventory, total };
};

export const adjustInventoryService = async (
  shopId: string, 
  productId: string, 
  quantityChange: number, 
  type: TransactionType,
  userId: string,
  referenceId?: mongoose.Types.ObjectId,
  referenceType?: string,
  reason?: string,
  session?: mongoose.mongo.ClientSession
) => {
  // Find or create inventory record
  let inventory = await Inventory.findOne({ shopId, productId }).session(session || null);
  
  const previousQuantity = inventory ? inventory.quantity : 0;
  const newQuantity = previousQuantity + quantityChange;

  if (newQuantity < 0) {
    throw { message: 'Insufficient inventory', statusCode: 400 };
  }

  if (!inventory) {
    inventory = new Inventory({ shopId, productId, quantity: newQuantity });
  } else {
    inventory.quantity = newQuantity;
    inventory.lastUpdated = new Date();
  }

  await inventory.save({ session });

  // Create transaction log
  const transaction = new InventoryTransaction({
    shopId,
    productId,
    type,
    quantity: quantityChange,
    previousQuantity,
    newQuantity,
    referenceType,
    referenceId,
    reason,
    createdBy: userId,
  });

  await transaction.save({ session });

  return inventory;
};

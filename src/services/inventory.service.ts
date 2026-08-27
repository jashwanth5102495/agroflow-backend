import mongoose from 'mongoose';
import { Inventory } from '../models/Inventory';
import { Product } from '../models/Product';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';

export const getInventoryService = async (shopId: string, skip: number, limit: number) => {
  const [products, total] = await Promise.all([
    Product.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'productId',
          as: 'inventoryData'
        }
      },
      {
        $project: {
          productId: {
            _id: '$_id',
            name: '$name',
            sku: '$sku',
            category: '$category',
            sellingPrice: '$sellingPrice',
            minimumStock: '$minimumStock',
            status: '$status',
            description: '$description'
          },
          quantity: { 
            $cond: { 
              if: { $gt: [{ $size: '$inventoryData' }, 0] }, 
              then: { $arrayElemAt: ['$inventoryData.quantity', 0] }, 
              else: 0 
            } 
          },
          _id: '$_id' // using productId as _id for the inventory list item
        }
      }
    ]),
    Product.countDocuments({ shopId }),
  ]);
  return { inventory: products, total };
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

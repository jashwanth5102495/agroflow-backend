import mongoose from 'mongoose';
import { Purchase } from '../models/Purchase';
import { PurchaseItem } from '../models/PurchaseItem';
import { adjustInventoryService } from './inventory.service';
import { TransactionType } from '../models/InventoryTransaction';
import { Product } from '../models/Product';

export const createPurchaseService = async (shopId: string, userId: string, data: any) => {
  let subtotal = 0;
  
  // Validate products and calculate true subtotal securely
  for (const item of data.items) {
    const product = await Product.findOne({ _id: item.productId, shopId });
    if (!product) throw { message: `Product ${item.productId} not found`, statusCode: 404 };
    subtotal += item.quantity * item.purchasePrice;
  }

  const total = subtotal - (data.discount || 0) + (data.tax || 0);
  const amountDue = total - (data.amountPaid || 0);
  const paymentStatus = amountDue <= 0 ? 'PAID' : (data.amountPaid > 0 ? 'PARTIAL' : 'UNPAID');

  // Create Purchase Record
  const purchase = new Purchase({
    shopId,
    supplierId: data.supplierId,
    invoiceNumber: data.invoiceNumber,
    purchaseDate: new Date(data.purchaseDate),
    subtotal,
    discount: data.discount || 0,
    tax: data.tax || 0,
    total,
    paymentStatus,
    amountPaid: data.amountPaid || 0,
    amountDue,
    createdBy: userId,
  });
  
  await purchase.save();

  // Process Items and Inventory
  for (const item of data.items) {
    const itemSubtotal = item.quantity * item.purchasePrice;
    
    const purchaseItem = new PurchaseItem({
      purchaseId: purchase._id,
      productId: item.productId,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      subtotal: itemSubtotal,
    });
    await purchaseItem.save();

    // Increase Inventory
    await adjustInventoryService(
      shopId,
      item.productId,
      item.quantity,
      TransactionType.PURCHASE,
      userId,
      purchase._id as mongoose.Types.ObjectId,
      'PURCHASE',
      'Stock inward from purchase'
    );
    
    // Update Product purchase price if needed
    await Product.findByIdAndUpdate(item.productId, { purchasePrice: item.purchasePrice });
  }

  return purchase;
};

export const getPurchasesService = async (shopId: string, skip: number, limit: number) => {
  const [purchases, total] = await Promise.all([
    Purchase.find({ shopId }).populate('supplierId', 'name companyName').skip(skip).limit(limit).sort({ purchaseDate: -1 }),
    Purchase.countDocuments({ shopId }),
  ]);

  return { purchases, total };
};

export const getPurchaseByIdService = async (shopId: string, purchaseId: string) => {
  const purchase = await Purchase.findOne({ _id: purchaseId, shopId }).populate('supplierId', 'name companyName email phone');
  if (!purchase) throw { message: 'Purchase not found', statusCode: 404 };

  const items = await PurchaseItem.find({ purchaseId: purchase._id }).populate('productId', 'name sku unit');
  
  return { purchase, items };
};

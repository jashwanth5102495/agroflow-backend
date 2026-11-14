import mongoose from 'mongoose';
import { Purchase } from '../models/Purchase';
import { PurchaseItem } from '../models/PurchaseItem';
import { adjustInventoryService } from './inventory.service';
import { TransactionType } from '../models/InventoryTransaction';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';

export const createPurchaseService = async (shopId: string, userId: string, data: any) => {
  let subtotal = 0;
  const processedItems: any[] = [];

  // 1. Validate products and calculate true subtotal securely
  for (const item of data.items) {
    const product = await Product.findOne({ _id: item.productId, shopId });
    if (!product) throw { message: `Product ${item.productId} not found`, statusCode: 404 };

    const itemSubtotal = Number(item.quantity) * Number(item.purchasePrice);
    subtotal += itemSubtotal;

    processedItems.push({
      productId: product._id,
      productName: item.productName || product.name,
      unit: item.unit || product.unit,
      packSize: item.packSize || '',
      quantity: Number(item.quantity),
      purchasePrice: Number(item.purchasePrice),
      subtotal: itemSubtotal,
    });
  }

  const discount = Number(data.discount) || 0;
  const gstRate = Number(data.gstRate) || 0;
  let tax = Number(data.tax) || 0;

  // Auto-calculate GST tax if gstRate is provided and tax is 0
  if (gstRate > 0 && tax === 0) {
    const taxableAmount = Math.max(0, subtotal - discount);
    tax = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  }

  const total = data.total ? Number(data.total) : subtotal - discount + tax;
  const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : total;
  const amountDue = Math.max(0, total - amountPaid);
  const paymentStatus = amountDue <= 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'UNPAID');

  // Auto-generate invoice number if not provided
  const invoiceNumber = data.invoiceNumber?.trim() || `INC-${Date.now().toString().slice(-6)}`;
  const companyName = data.companyName?.trim() || 'General Supplier';

  // Find or create Supplier record to maintain supplier relation if desired
  let supplierId = data.supplierId;
  if (!supplierId && companyName) {
    let supplier = await Supplier.findOne({ shopId, name: companyName });
    if (!supplier) {
      supplier = new Supplier({
        shopId,
        name: companyName,
        companyName,
        phone: 'N/A',
        status: 'ACTIVE',
      });
      await supplier.save();
    }
    supplierId = supplier._id;
  }

  // 2. Create Purchase Record
  const purchase = new Purchase({
    shopId,
    companyName,
    supplierId,
    invoiceNumber,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    subtotal,
    discount,
    gstRate,
    tax,
    total,
    paymentStatus,
    amountPaid,
    amountDue,
    notes: data.notes?.trim() || '',
    createdBy: userId,
  });

  await purchase.save();

  // 3. Process Items and Increase Inventory
  const savedItems = [];
  for (const item of processedItems) {
    const purchaseItem = new PurchaseItem({
      purchaseId: purchase._id,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      packSize: item.packSize,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      subtotal: item.subtotal,
    });
    await purchaseItem.save();
    savedItems.push(purchaseItem);

    // Increase Inventory for received stock
    await adjustInventoryService(
      shopId,
      item.productId.toString(),
      item.quantity,
      TransactionType.PURCHASE,
      userId,
      purchase._id as mongoose.Types.ObjectId,
      'PURCHASE',
      `Incoming material inward from ${companyName} (Invoice: ${invoiceNumber})`
    );

    // Update Product purchase price if greater than 0
    if (item.purchasePrice > 0) {
      await Product.findByIdAndUpdate(item.productId, { purchasePrice: item.purchasePrice });
    }
  }

  return {
    ...purchase.toObject(),
    items: savedItems,
  };
};

export const getPurchasesService = async (shopId: string, skip: number, limit: number, search?: string) => {
  const query: any = { shopId };

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { companyName: { $regex: term, $options: 'i' } },
      { invoiceNumber: { $regex: term, $options: 'i' } },
      { notes: { $regex: term, $options: 'i' } },
    ];
  }

  const [purchases, total] = await Promise.all([
    Purchase.find(query)
      .populate('supplierId', 'name companyName phone')
      .skip(skip)
      .limit(limit)
      .sort({ purchaseDate: -1, createdAt: -1 })
      .lean(),
    Purchase.countDocuments(query),
  ]);

  // Enrich purchases with their items count & preview
  const purchaseIds = purchases.map((p: any) => p._id);
  const items = await PurchaseItem.find({ purchaseId: { $in: purchaseIds } }).lean();

  const itemsMap = new Map();
  items.forEach((item: any) => {
    const pid = item.purchaseId.toString();
    if (!itemsMap.has(pid)) itemsMap.set(pid, []);
    itemsMap.get(pid).push(item);
  });

  const enriched = purchases.map((p: any) => ({
    ...p,
    items: itemsMap.get(p._id.toString()) || [],
  }));

  return { purchases: enriched, total };
};

export const getPurchaseByIdService = async (shopId: string, purchaseId: string) => {
  const purchase = await Purchase.findOne({ _id: purchaseId, shopId })
    .populate('supplierId', 'name companyName email phone')
    .lean();
  if (!purchase) throw { message: 'Purchase not found', statusCode: 404 };

  const items = await PurchaseItem.find({ purchaseId: purchase._id })
    .populate('productId', 'name sku unit category')
    .lean();

  return { purchase, items };
};

export const deletePurchaseService = async (shopId: string, purchaseId: string, userId: string) => {
  const purchase = await Purchase.findOne({ _id: purchaseId, shopId });
  if (!purchase) throw { message: 'Purchase not found', statusCode: 404 };

  // Find items and revert inventory
  const items = await PurchaseItem.find({ purchaseId: purchase._id });
  for (const item of items) {
    try {
      await adjustInventoryService(
        shopId,
        item.productId.toString(),
        -item.quantity, // reduce inventory
        TransactionType.CORRECTION,
        userId,
        purchase._id as mongoose.Types.ObjectId,
        'PURCHASE_CANCEL',
        `Reversal of deleted incoming purchase (Inv: ${purchase.invoiceNumber})`
      );
    } catch (e) {
      console.warn(`Could not reverse inventory for product ${item.productId}:`, e);
    }
  }

  await PurchaseItem.deleteMany({ purchaseId: purchase._id });
  await Purchase.findByIdAndDelete(purchase._id);

  return { message: 'Purchase deleted and inventory adjusted successfully' };
};

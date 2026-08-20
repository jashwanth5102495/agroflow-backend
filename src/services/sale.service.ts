import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Product } from '../models/Product';
import { Farmer } from '../models/Farmer';
import { PaymentMethod } from '../models/Sale';
import { adjustInventoryService } from './inventory.service';
import { TransactionType } from '../models/InventoryTransaction';
import { adjustCreditService } from './credit.service';
import { CreditTransactionType } from '../models/CreditTransaction';
import { createPaymentService } from './payment.service';

export const createSaleService = async (shopId: string, userId: string, data: any) => {
  const farmer = await Farmer.findOne({ _id: data.farmerId, shopId });
  if (!farmer) throw { message: 'Farmer not found', statusCode: 404 };

  let subtotal = 0;
  const processedItems = [];

  for (const item of data.items) {
    const product = await Product.findOne({ _id: item.productId, shopId });
    if (!product) throw { message: `Product ${item.productId} not found`, statusCode: 404 };
    if (product.status !== 'ACTIVE') throw { message: `Product ${product.name} is not active`, statusCode: 400 };

    const itemDiscount = item.discount || 0;
    const itemSubtotal = (product.sellingPrice * item.quantity) - itemDiscount;
    subtotal += itemSubtotal;

    processedItems.push({
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      discount: itemDiscount,
      total: itemSubtotal,
    });
  }

  const total = subtotal - (data.discount || 0) + (data.tax || 0);
  let amountPaid = data.amountPaid || 0;
  
  if (data.paymentMethod === PaymentMethod.CREDIT) {
    amountPaid = 0;
  }

  const amountDue = total - amountPaid;
  let paymentStatus = 'UNPAID';
  if (amountDue <= 0) paymentStatus = 'PAID';
  else if (amountPaid > 0) paymentStatus = 'PARTIAL';

  const sale = new Sale({
    shopId,
    farmerId: data.farmerId,
    invoiceNumber: data.invoiceNumber,
    subtotal,
    discount: data.discount || 0,
    tax: data.tax || 0,
    total,
    amountPaid,
    amountDue,
    paymentStatus,
    paymentMethod: data.paymentMethod,
    createdBy: userId,
  });
  
  await sale.save();

  for (const pItem of processedItems) {
    const saleItem = new SaleItem({
      saleId: sale._id,
      ...pItem,
    });
    await saleItem.save();

    await adjustInventoryService(
      shopId,
      pItem.productId.toString(),
      -pItem.quantity,
      TransactionType.SALE,
      userId,
      sale._id as mongoose.Types.ObjectId,
      'SALE',
      `Sold in Invoice ${data.invoiceNumber}`
    );
  }

  // Handle Payment / Credit logic
  if (amountPaid > 0) {
    await createPaymentService(shopId, userId, {
      referenceId: sale._id,
      referenceType: 'SALE',
      amount: amountPaid,
      paymentMethod: data.paymentMethod === PaymentMethod.PARTIAL ? PaymentMethod.CASH : data.paymentMethod,
      notes: `Payment for Invoice ${data.invoiceNumber}`,
    });
  }

  if (amountDue > 0) {
    await adjustCreditService(
      shopId,
      data.farmerId,
      amountDue,
      CreditTransactionType.CREDIT_ADDED,
      userId,
      sale._id as mongoose.Types.ObjectId,
      `Credit for Invoice ${data.invoiceNumber}`
    );
  }

  return sale;
};

export const getSalesService = async (shopId: string, skip: number, limit: number) => {
  const [sales, total] = await Promise.all([
    Sale.find({ shopId }).populate('farmerId', 'name phone').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Sale.countDocuments({ shopId }),
  ]);

  return { sales, total };
};

export const getSaleByIdService = async (shopId: string, saleId: string) => {
  const sale = await Sale.findOne({ _id: saleId, shopId }).populate('farmerId', 'name phone village address');
  if (!sale) throw { message: 'Sale not found', statusCode: 404 };

  const items = await SaleItem.find({ saleId: sale._id });
  return { sale, items };
};

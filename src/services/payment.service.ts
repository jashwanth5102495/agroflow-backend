import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Sale } from '../models/Sale';
import { adjustCreditService } from './credit.service';
import { CreditTransactionType } from '../models/CreditTransaction';
import { PaymentMethod } from '../models/Sale';

export const createPaymentService = async (shopId: string, userId: string, data: any) => {
  try {
    const payment = new Payment({
      shopId,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      createdBy: userId,
    });
    await payment.save();

    if (data.referenceType === 'SALE' && data.referenceId && data.updateSaleBalance) {
      // Only update sale balance when explicitly told to (e.g. credit settlement reducing outstanding)
      const sale = await Sale.findOne({ _id: data.referenceId, shopId });
      if (sale) {
        sale.amountPaid += data.amount;
        sale.amountDue = Math.max(0, sale.total - sale.amountPaid);
        sale.paymentStatus = sale.amountDue <= 0 ? 'PAID' : 'PARTIAL';
        await sale.save();
      }
    }

    if (data.referenceType === 'CREDIT_SETTLEMENT' && data.farmerId) {
      await adjustCreditService(
        shopId,
        data.farmerId,
        -data.amount, // Reduce the credit balance
        CreditTransactionType.PAYMENT_RECEIVED,
        userId,
        payment._id as mongoose.Types.ObjectId,
        data.notes
      );
    }

    return payment;
  } catch (error) {
    throw error;
  }
};

export const getPaymentsService = async (shopId: string, skip: number, limit: number) => {
  const [payments, total] = await Promise.all([
    Payment.find({ shopId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Payment.countDocuments({ shopId }),
  ]);
  
  return { payments, total };
};

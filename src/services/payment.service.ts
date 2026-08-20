import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Sale } from '../models/Sale';
import { adjustCreditService } from './credit.service';
import { CreditTransactionType } from '../models/CreditTransaction';
import { PaymentMethod } from '../models/Sale';

export const createPaymentService = async (shopId: string, userId: string, data: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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
    await payment.save({ session });

    if (data.referenceType === 'SALE' && data.referenceId) {
      const sale = await Sale.findOne({ _id: data.referenceId, shopId }).session(session);
      if (sale) {
        sale.amountPaid += data.amount;
        sale.amountDue = sale.total - sale.amountPaid;
        sale.paymentStatus = sale.amountDue <= 0 ? 'PAID' : 'PARTIAL';
        await sale.save({ session });
        
        // If payment method is not credit, and there was credit, we decrease credit?
        // Usually, a direct payment towards a sale doesn't touch the global credit ledger unless it was an explicit credit settlement.
        // We will assume 'CREDIT_SETTLEMENT' handles global account, and 'SALE' handles specific bill.
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
        data.notes,
        session
      );
    }

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getPaymentsService = async (shopId: string, skip: number, limit: number) => {
  const [payments, total] = await Promise.all([
    Payment.find({ shopId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Payment.countDocuments({ shopId }),
  ]);
  
  return { payments, total };
};

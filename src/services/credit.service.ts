import mongoose from 'mongoose';
import { CreditAccount } from '../models/CreditAccount';
import { CreditTransaction, CreditTransactionType } from '../models/CreditTransaction';
import { Farmer } from '../models/Farmer';

export const adjustCreditService = async (
  shopId: string,
  farmerId: string,
  amountChange: number,
  type: CreditTransactionType,
  userId: string,
  referenceId?: mongoose.Types.ObjectId,
  notes?: string,
  session?: mongoose.mongo.ClientSession
) => {
  // Find or create credit account
  let account = await CreditAccount.findOne({ shopId, farmerId }).session(session || null);
  
  if (!account) {
    account = new CreditAccount({ shopId, farmerId, balance: 0 });
  }

  const newBalance = account.balance + amountChange;
  
  // Update farmer's credit account
  account.balance = newBalance;
  account.lastUpdatedAt = new Date();
  await account.save({ session });

  // Create credit transaction record
  const transaction = new CreditTransaction({
    shopId,
    farmerId,
    type,
    amount: amountChange,
    balanceAfter: newBalance,
    referenceId,
    notes,
    createdBy: userId,
  });
  await transaction.save({ session });

  return { account, transaction };
};

export const getFarmerCreditService = async (shopId: string, farmerId: string) => {
  const account = await CreditAccount.findOne({ shopId, farmerId });
  const transactions = await CreditTransaction.find({ shopId, farmerId })
    .sort({ createdAt: -1 })
    .limit(50);
  
  return { account, transactions };
};

export const getOutstandingCreditsService = async (shopId: string, skip: number, limit: number) => {
  const [accounts, total] = await Promise.all([
    CreditAccount.find({ shopId, balance: { $gt: 0 } })
      .populate('farmerId', 'name phone village')
      .skip(skip)
      .limit(limit)
      .sort({ balance: -1 }),
    CreditAccount.countDocuments({ shopId, balance: { $gt: 0 } })
  ]);
  
  return { accounts, total };
};

export const getCreditLedgerService = async (shopId: string) => {
  // Get all credit accounts (including zero-balance for history)
  const accounts = await CreditAccount.find({ shopId })
    .populate('farmerId', 'name phone village')
    .sort({ balance: -1 });

  // For each account, get the credit transactions with sale details
  const { Sale } = await import('../models/Sale');
  
  const enrichedAccounts = await Promise.all(
    accounts.map(async (account) => {
      const transactions = await CreditTransaction.find({
        shopId,
        farmerId: account.farmerId,
      })
        .sort({ createdAt: -1 })
        .limit(20);

      // Fetch sale details for each transaction
      const txWithSaleDetails = await Promise.all(
        transactions.map(async (tx) => {
          let saleDetails = null;
          if (tx.referenceId) {
            const sale = await Sale.findById(tx.referenceId).select('invoiceNumber total amountPaid amountDue paymentMethod createdAt');
            if (sale) {
              saleDetails = {
                invoiceNumber: sale.invoiceNumber,
                totalAmount: sale.total,
                downPayment: sale.amountPaid,
                outstanding: sale.amountDue,
                paymentMethod: sale.paymentMethod,
                date: sale.createdAt,
              };
            }
          }
          return { ...tx.toObject(), saleDetails };
        })
      );

      return {
        ...account.toObject(),
        transactions: txWithSaleDetails,
      };
    })
  );

  const totalOutstanding = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  return { accounts: enrichedAccounts, totalOutstanding };
};

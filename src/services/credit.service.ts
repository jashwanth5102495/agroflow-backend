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

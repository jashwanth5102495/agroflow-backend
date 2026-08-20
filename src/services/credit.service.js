"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutstandingCreditsService = exports.getFarmerCreditService = exports.adjustCreditService = void 0;
const CreditAccount_1 = require("../models/CreditAccount");
const CreditTransaction_1 = require("../models/CreditTransaction");
const adjustCreditService = async (shopId, farmerId, amountChange, type, userId, referenceId, notes, session) => {
    // Find or create credit account
    let account = await CreditAccount_1.CreditAccount.findOne({ shopId, farmerId }).session(session || null);
    if (!account) {
        account = new CreditAccount_1.CreditAccount({ shopId, farmerId, balance: 0 });
    }
    const newBalance = account.balance + amountChange;
    // Update farmer's credit account
    account.balance = newBalance;
    account.lastUpdatedAt = new Date();
    await account.save({ session });
    // Create credit transaction record
    const transaction = new CreditTransaction_1.CreditTransaction({
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
exports.adjustCreditService = adjustCreditService;
const getFarmerCreditService = async (shopId, farmerId) => {
    const account = await CreditAccount_1.CreditAccount.findOne({ shopId, farmerId });
    const transactions = await CreditTransaction_1.CreditTransaction.find({ shopId, farmerId })
        .sort({ createdAt: -1 })
        .limit(50);
    return { account, transactions };
};
exports.getFarmerCreditService = getFarmerCreditService;
const getOutstandingCreditsService = async (shopId, skip, limit) => {
    const [accounts, total] = await Promise.all([
        CreditAccount_1.CreditAccount.find({ shopId, balance: { $gt: 0 } })
            .populate('farmerId', 'name phone village')
            .skip(skip)
            .limit(limit)
            .sort({ balance: -1 }),
        CreditAccount_1.CreditAccount.countDocuments({ shopId, balance: { $gt: 0 } })
    ]);
    return { accounts, total };
};
exports.getOutstandingCreditsService = getOutstandingCreditsService;
//# sourceMappingURL=credit.service.js.map
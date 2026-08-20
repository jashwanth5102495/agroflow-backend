"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentsService = exports.createPaymentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Payment_1 = require("../models/Payment");
const Sale_1 = require("../models/Sale");
const credit_service_1 = require("./credit.service");
const CreditTransaction_1 = require("../models/CreditTransaction");
const createPaymentService = async (shopId, userId, data) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const payment = new Payment_1.Payment({
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
            const sale = await Sale_1.Sale.findOne({ _id: data.referenceId, shopId }).session(session);
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
            await (0, credit_service_1.adjustCreditService)(shopId, data.farmerId, -data.amount, // Reduce the credit balance
            CreditTransaction_1.CreditTransactionType.PAYMENT_RECEIVED, userId, payment._id, data.notes, session);
        }
        await session.commitTransaction();
        return payment;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.createPaymentService = createPaymentService;
const getPaymentsService = async (shopId, skip, limit) => {
    const [payments, total] = await Promise.all([
        Payment_1.Payment.find({ shopId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Payment_1.Payment.countDocuments({ shopId }),
    ]);
    return { payments, total };
};
exports.getPaymentsService = getPaymentsService;
//# sourceMappingURL=payment.service.js.map
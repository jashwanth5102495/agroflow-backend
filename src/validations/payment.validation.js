"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
const Sale_1 = require("../models/Sale");
exports.createPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        referenceId: zod_1.z.string().optional(),
        referenceType: zod_1.z.enum(['SALE', 'PURCHASE', 'CREDIT_SETTLEMENT']),
        amount: zod_1.z.number().min(0.01, 'Amount must be greater than 0'),
        paymentMethod: zod_1.z.enum([
            Sale_1.PaymentMethod.CASH,
            Sale_1.PaymentMethod.UPI,
            Sale_1.PaymentMethod.CARD,
            Sale_1.PaymentMethod.BANK_TRANSFER,
        ]),
        notes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=payment.validation.js.map
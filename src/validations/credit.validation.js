"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCreditPaymentSchema = void 0;
const zod_1 = require("zod");
exports.addCreditPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number().min(0.01, 'Amount must be greater than 0'),
        paymentMethod: zod_1.z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
        notes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=credit.validation.js.map
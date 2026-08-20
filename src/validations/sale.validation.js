"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
const zod_1 = require("zod");
const Sale_1 = require("../models/Sale");
exports.createSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        farmerId: zod_1.z.string().min(1, 'Farmer is required'),
        invoiceNumber: zod_1.z.string().min(1, 'Invoice number is required'),
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().min(1, 'Product is required'),
            quantity: zod_1.z.number().min(0.01, 'Quantity must be greater than 0'),
            discount: zod_1.z.number().min(0).optional().default(0),
        })).min(1, 'At least one item is required'),
        discount: zod_1.z.number().min(0).optional().default(0),
        tax: zod_1.z.number().min(0).optional().default(0),
        amountPaid: zod_1.z.number().min(0).optional().default(0),
        paymentMethod: zod_1.z.enum([
            Sale_1.PaymentMethod.CASH,
            Sale_1.PaymentMethod.UPI,
            Sale_1.PaymentMethod.CARD,
            Sale_1.PaymentMethod.BANK_TRANSFER,
            Sale_1.PaymentMethod.CREDIT,
            Sale_1.PaymentMethod.PARTIAL
        ]),
    }),
});
//# sourceMappingURL=sale.validation.js.map
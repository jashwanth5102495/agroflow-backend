"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
exports.createPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        supplierId: zod_1.z.string().min(1, 'Supplier is required'),
        invoiceNumber: zod_1.z.string().min(1, 'Invoice number is required'),
        purchaseDate: zod_1.z.string().datetime().or(zod_1.z.date()),
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().min(1, 'Product is required'),
            quantity: zod_1.z.number().min(0.01, 'Quantity must be greater than 0'),
            purchasePrice: zod_1.z.number().min(0, 'Purchase price cannot be negative'),
        })).min(1, 'At least one item is required'),
        discount: zod_1.z.number().min(0).optional().default(0),
        tax: zod_1.z.number().min(0).optional().default(0),
        amountPaid: zod_1.z.number().min(0).optional().default(0),
    }),
});
//# sourceMappingURL=purchase.validation.js.map
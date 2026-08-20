"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Product name is required'),
        brand: zod_1.z.string().optional(),
        category: zod_1.z.string().min(2, 'Category is required'),
        sku: zod_1.z.string().optional(),
        unit: zod_1.z.string().min(1, 'Unit is required'),
        purchasePrice: zod_1.z.number().min(0),
        sellingPrice: zod_1.z.number().min(0),
        minimumStock: zod_1.z.number().min(0).optional(),
        maximumStock: zod_1.z.number().min(0).optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        brand: zod_1.z.string().optional(),
        category: zod_1.z.string().min(2).optional(),
        sku: zod_1.z.string().optional(),
        unit: zod_1.z.string().min(1).optional(),
        purchasePrice: zod_1.z.number().min(0).optional(),
        sellingPrice: zod_1.z.number().min(0).optional(),
        minimumStock: zod_1.z.number().min(0).optional(),
        maximumStock: zod_1.z.number().min(0).optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});
//# sourceMappingURL=product.validation.js.map
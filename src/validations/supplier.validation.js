"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is required'),
        companyName: zod_1.z.string().optional(),
        phone: zod_1.z.string().min(10, 'Invalid phone number'),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        address: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.updateSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        companyName: zod_1.z.string().optional(),
        phone: zod_1.z.string().min(10).optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        address: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});
//# sourceMappingURL=supplier.validation.js.map
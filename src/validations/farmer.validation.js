"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarmerSchema = exports.createFarmerSchema = void 0;
const zod_1 = require("zod");
exports.createFarmerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        phone: zod_1.z.string().min(10, 'Invalid phone number'),
        alternatePhone: zod_1.z.string().optional(),
        village: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        farmerCode: zod_1.z.string().optional(),
        creditLimit: zod_1.z.number().min(0).optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.updateFarmerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().min(10).optional(),
        alternatePhone: zod_1.z.string().optional(),
        village: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        farmerCode: zod_1.z.string().optional(),
        creditLimit: zod_1.z.number().min(0).optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});
//# sourceMappingURL=farmer.validation.js.map
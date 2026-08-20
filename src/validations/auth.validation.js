"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerShopSchema = void 0;
const zod_1 = require("zod");
exports.registerShopSchema = zod_1.z.object({
    body: zod_1.z.object({
        shopName: zod_1.z.string().min(2, 'Shop name is too short'),
        ownerName: zod_1.z.string().min(2, 'Owner name is too short'),
        phone: zod_1.z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
        email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        address: zod_1.z.string().min(5, 'Address is required'),
        village: zod_1.z.string().optional(),
        district: zod_1.z.string().min(2, 'District is required'),
        state: zod_1.z.string().min(2, 'State is required'),
        pincode: zod_1.z.string().min(6, 'Pincode must be 6 digits'),
        gstNumber: zod_1.z.string().optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().min(10, 'Invalid phone number'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
//# sourceMappingURL=auth.validation.js.map
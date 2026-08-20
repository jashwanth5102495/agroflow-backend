import { z } from 'zod';
export declare const registerShopSchema: z.ZodObject<{
    body: z.ZodObject<{
        shopName: z.ZodString;
        ownerName: z.ZodString;
        phone: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        password: z.ZodString;
        address: z.ZodString;
        village: z.ZodOptional<z.ZodString>;
        district: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        gstNumber: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        phone: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=auth.validation.d.ts.map
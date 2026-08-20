import { z } from 'zod';

export const registerShopSchema = z.object({
  body: z.object({
    shopName: z.string().min(2, 'Shop name is too short'),
    ownerName: z.string().min(2, 'Owner name is too short'),
    phone: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    address: z.string().min(5, 'Address is required'),
    village: z.string().optional(),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits'),
    gstNumber: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Invalid phone number'),
    password: z.string().min(1, 'Password is required'),
  }),
});

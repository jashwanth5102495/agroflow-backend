import mongoose, { Document } from 'mongoose';
export interface IPurchase extends Document {
    shopId: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    purchaseDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
    amountPaid: number;
    amountDue: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Purchase: mongoose.Model<IPurchase, {}, {}, {}, Document<unknown, {}, IPurchase, {}, mongoose.DefaultSchemaOptions> & IPurchase & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPurchase>;
//# sourceMappingURL=Purchase.d.ts.map
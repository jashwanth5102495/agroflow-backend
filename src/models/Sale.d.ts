import mongoose, { Document } from 'mongoose';
export declare enum PaymentMethod {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    CREDIT = "CREDIT",
    PARTIAL = "PARTIAL"
}
export interface ISale extends Document {
    shopId: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
    paymentMethod: PaymentMethod;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Sale: mongoose.Model<ISale, {}, {}, {}, Document<unknown, {}, ISale, {}, mongoose.DefaultSchemaOptions> & ISale & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISale>;
//# sourceMappingURL=Sale.d.ts.map
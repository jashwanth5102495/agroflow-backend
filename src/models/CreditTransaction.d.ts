import mongoose, { Document } from 'mongoose';
export declare enum CreditTransactionType {
    CREDIT_ADDED = "CREDIT_ADDED",// From a Sale
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    ADJUSTMENT = "ADJUSTMENT"
}
export interface ICreditTransaction extends Document {
    shopId: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    type: CreditTransactionType;
    amount: number;
    balanceAfter: number;
    referenceId?: mongoose.Types.ObjectId;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}
export declare const CreditTransaction: mongoose.Model<ICreditTransaction, {}, {}, {}, Document<unknown, {}, ICreditTransaction, {}, mongoose.DefaultSchemaOptions> & ICreditTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICreditTransaction>;
//# sourceMappingURL=CreditTransaction.d.ts.map
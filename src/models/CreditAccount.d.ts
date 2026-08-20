import mongoose, { Document } from 'mongoose';
export interface ICreditAccount extends Document {
    shopId: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    balance: number;
    lastUpdatedAt: Date;
}
export declare const CreditAccount: mongoose.Model<ICreditAccount, {}, {}, {}, Document<unknown, {}, ICreditAccount, {}, mongoose.DefaultSchemaOptions> & ICreditAccount & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICreditAccount>;
//# sourceMappingURL=CreditAccount.d.ts.map
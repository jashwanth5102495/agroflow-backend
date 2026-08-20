import mongoose, { Document } from 'mongoose';
export interface IBillingRecord {
    date: Date;
    amount: number;
    plan: string;
    cycle: 'MONTHLY' | 'ANNUAL';
    status: 'PAID' | 'FAILED' | 'PENDING';
    paymentMethod: string;
    transactionId: string;
}
export interface IShop extends Document {
    name: string;
    ownerName: string;
    phone: string;
    email?: string;
    address: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
    gstNumber?: string;
    agentCode?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    subscriptionPrice: number;
    subscriptionStatus: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'ANNUAL';
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    autoPay: boolean;
    billingHistory: IBillingRecord[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Shop: mongoose.Model<IShop, {}, {}, {}, Document<unknown, {}, IShop, {}, mongoose.DefaultSchemaOptions> & IShop & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IShop>;
//# sourceMappingURL=Shop.d.ts.map
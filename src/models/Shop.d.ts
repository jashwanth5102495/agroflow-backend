import mongoose, { Document } from 'mongoose';
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
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
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
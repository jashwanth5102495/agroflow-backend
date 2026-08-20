import mongoose, { Document } from 'mongoose';
export interface IFarmer extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    alternatePhone?: string;
    village?: string;
    address?: string;
    farmerCode?: string;
    creditLimit: number;
    notes?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}
export declare const Farmer: mongoose.Model<IFarmer, {}, {}, {}, Document<unknown, {}, IFarmer, {}, mongoose.DefaultSchemaOptions> & IFarmer & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFarmer>;
//# sourceMappingURL=Farmer.d.ts.map
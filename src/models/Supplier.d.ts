import mongoose, { Document } from 'mongoose';
export interface ISupplier extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    companyName?: string;
    phone: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    notes?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}
export declare const Supplier: mongoose.Model<ISupplier, {}, {}, {}, Document<unknown, {}, ISupplier, {}, mongoose.DefaultSchemaOptions> & ISupplier & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISupplier>;
//# sourceMappingURL=Supplier.d.ts.map
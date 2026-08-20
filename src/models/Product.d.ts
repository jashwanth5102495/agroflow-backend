import mongoose, { Document } from 'mongoose';
export interface IProduct extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    brand?: string;
    category: string;
    sku?: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    minimumStock: number;
    maximumStock?: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, Document<unknown, {}, IProduct, {}, mongoose.DefaultSchemaOptions> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProduct>;
//# sourceMappingURL=Product.d.ts.map
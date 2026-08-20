import mongoose, { Document } from 'mongoose';
export interface ISaleItem extends Document {
    saleId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}
export declare const SaleItem: mongoose.Model<ISaleItem, {}, {}, {}, Document<unknown, {}, ISaleItem, {}, mongoose.DefaultSchemaOptions> & ISaleItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISaleItem>;
//# sourceMappingURL=SaleItem.d.ts.map
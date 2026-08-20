import mongoose, { Document } from 'mongoose';
export interface IPurchaseItem extends Document {
    purchaseId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    purchasePrice: number;
    subtotal: number;
}
export declare const PurchaseItem: mongoose.Model<IPurchaseItem, {}, {}, {}, Document<unknown, {}, IPurchaseItem, {}, mongoose.DefaultSchemaOptions> & IPurchaseItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPurchaseItem>;
//# sourceMappingURL=PurchaseItem.d.ts.map
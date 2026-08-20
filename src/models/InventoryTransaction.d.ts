import mongoose, { Document } from 'mongoose';
export declare enum TransactionType {
    PURCHASE = "PURCHASE",
    SALE = "SALE",
    RETURN = "RETURN",
    ADJUSTMENT = "ADJUSTMENT",
    DAMAGE = "DAMAGE",
    CORRECTION = "CORRECTION"
}
export interface IInventoryTransaction extends Document {
    shopId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    type: TransactionType;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    referenceType?: string;
    referenceId?: mongoose.Types.ObjectId;
    reason?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}
export declare const InventoryTransaction: mongoose.Model<IInventoryTransaction, {}, {}, {}, Document<unknown, {}, IInventoryTransaction, {}, mongoose.DefaultSchemaOptions> & IInventoryTransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInventoryTransaction>;
//# sourceMappingURL=InventoryTransaction.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IInventory extends Document {
    shopId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    lastUpdated: Date;
}
export declare const Inventory: mongoose.Model<IInventory, {}, {}, {}, Document<unknown, {}, IInventory, {}, mongoose.DefaultSchemaOptions> & IInventory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInventory>;
//# sourceMappingURL=Inventory.d.ts.map
import mongoose from 'mongoose';
import { TransactionType } from '../models/InventoryTransaction';
export declare const getInventoryService: (shopId: string, skip: number, limit: number) => Promise<{
    inventory: (mongoose.Document<unknown, {}, import("../models/Inventory").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Inventory").IInventory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
export declare const adjustInventoryService: (shopId: string, productId: string, quantityChange: number, type: TransactionType, userId: string, referenceId?: mongoose.Types.ObjectId, referenceType?: string, reason?: string, session?: mongoose.mongo.ClientSession) => Promise<mongoose.Document<unknown, {}, import("../models/Inventory").IInventory, {}, mongoose.DefaultSchemaOptions> & import("../models/Inventory").IInventory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=inventory.service.d.ts.map
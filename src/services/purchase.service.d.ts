import mongoose from 'mongoose';
export declare const createPurchaseService: (shopId: string, userId: string, data: any) => Promise<mongoose.Document<unknown, {}, import("../models/Purchase").IPurchase, {}, mongoose.DefaultSchemaOptions> & import("../models/Purchase").IPurchase & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getPurchasesService: (shopId: string, skip: number, limit: number) => Promise<{
    purchases: (mongoose.Document<unknown, {}, import("../models/Purchase").IPurchase, {}, mongoose.DefaultSchemaOptions> & import("../models/Purchase").IPurchase & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
export declare const getPurchaseByIdService: (shopId: string, purchaseId: string) => Promise<{
    purchase: mongoose.Document<unknown, {}, import("../models/Purchase").IPurchase, {}, mongoose.DefaultSchemaOptions> & import("../models/Purchase").IPurchase & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    items: (mongoose.Document<unknown, {}, import("../models/PurchaseItem").IPurchaseItem, {}, mongoose.DefaultSchemaOptions> & import("../models/PurchaseItem").IPurchaseItem & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
}>;
//# sourceMappingURL=purchase.service.d.ts.map
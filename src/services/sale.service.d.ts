import mongoose from 'mongoose';
export declare const createSaleService: (shopId: string, userId: string, data: any) => Promise<mongoose.Document<unknown, {}, import("../models/Sale").ISale, {}, mongoose.DefaultSchemaOptions> & import("../models/Sale").ISale & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getSalesService: (shopId: string, skip: number, limit: number) => Promise<{
    sales: (mongoose.Document<unknown, {}, import("../models/Sale").ISale, {}, mongoose.DefaultSchemaOptions> & import("../models/Sale").ISale & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
export declare const getSaleByIdService: (shopId: string, saleId: string) => Promise<{
    sale: mongoose.Document<unknown, {}, import("../models/Sale").ISale, {}, mongoose.DefaultSchemaOptions> & import("../models/Sale").ISale & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    items: (mongoose.Document<unknown, {}, import("../models/SaleItem").ISaleItem, {}, mongoose.DefaultSchemaOptions> & import("../models/SaleItem").ISaleItem & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
}>;
//# sourceMappingURL=sale.service.d.ts.map
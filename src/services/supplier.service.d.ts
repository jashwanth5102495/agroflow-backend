export declare const createSupplierService: (shopId: string, data: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/Supplier").ISupplier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Supplier").ISupplier & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getSuppliersService: (shopId: string, search: string, skip: number, limit: number) => Promise<{
    suppliers: (import("mongoose").Document<unknown, {}, import("../models/Supplier").ISupplier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Supplier").ISupplier & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
export declare const getSupplierByIdService: (shopId: string, supplierId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Supplier").ISupplier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Supplier").ISupplier & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const updateSupplierService: (shopId: string, supplierId: string, data: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/Supplier").ISupplier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Supplier").ISupplier & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteSupplierService: (shopId: string, supplierId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Supplier").ISupplier, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Supplier").ISupplier & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=supplier.service.d.ts.map
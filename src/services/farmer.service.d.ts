export declare const createFarmerService: (shopId: string, data: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/Farmer").IFarmer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Farmer").IFarmer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getFarmersService: (shopId: string, search: string, skip: number, limit: number) => Promise<{
    farmers: (import("mongoose").Document<unknown, {}, import("../models/Farmer").IFarmer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Farmer").IFarmer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
export declare const getFarmerByIdService: (shopId: string, farmerId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Farmer").IFarmer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Farmer").IFarmer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const updateFarmerService: (shopId: string, farmerId: string, data: any) => Promise<import("mongoose").Document<unknown, {}, import("../models/Farmer").IFarmer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Farmer").IFarmer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteFarmerService: (shopId: string, farmerId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Farmer").IFarmer, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Farmer").IFarmer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=farmer.service.d.ts.map
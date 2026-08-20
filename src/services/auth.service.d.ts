import { UserRole } from '../models/User';
export declare const registerShopService: (data: any) => Promise<{
    shop: import("mongoose").Document<unknown, {}, import("../models/Shop").IShop, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Shop").IShop & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    user: {
        _id: import("mongoose").Types.ObjectId;
        name: string;
        phone: string;
        role: UserRole;
    };
    token: string;
}>;
export declare const loginService: (data: any) => Promise<{
    user: {
        _id: import("mongoose").Types.ObjectId;
        name: string;
        phone: string;
        role: UserRole;
        shopId: import("mongoose").Types.ObjectId;
    };
    shop: import("mongoose").Document<unknown, {}, import("../models/Shop").IShop, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Shop").IShop & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    token: string;
}>;
export declare const getMeService: (userId: string) => Promise<{
    user: import("mongoose").Document<unknown, {}, import("../models/User").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../models/User").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    shop: import("mongoose").Document<unknown, {}, import("../models/Shop").IShop, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Shop").IShop & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map
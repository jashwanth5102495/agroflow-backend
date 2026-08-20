import mongoose, { Document } from 'mongoose';
export declare enum UserRole {
    ADMIN = "ADMIN",
    OWNER = "OWNER",
    MANAGER = "MANAGER",
    BILLING_STAFF = "BILLING_STAFF",
    INVENTORY_STAFF = "INVENTORY_STAFF",
    ACCOUNTANT = "ACCOUNTANT"
}
export interface IUser extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    status: 'ACTIVE' | 'INACTIVE';
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=User.d.ts.map
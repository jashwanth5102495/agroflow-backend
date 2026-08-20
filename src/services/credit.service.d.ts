import mongoose from 'mongoose';
import { CreditTransactionType } from '../models/CreditTransaction';
export declare const adjustCreditService: (shopId: string, farmerId: string, amountChange: number, type: CreditTransactionType, userId: string, referenceId?: mongoose.Types.ObjectId, notes?: string, session?: mongoose.mongo.ClientSession) => Promise<{
    account: mongoose.Document<unknown, {}, import("../models/CreditAccount").ICreditAccount, {}, mongoose.DefaultSchemaOptions> & import("../models/CreditAccount").ICreditAccount & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    transaction: mongoose.Document<unknown, {}, import("../models/CreditTransaction").ICreditTransaction, {}, mongoose.DefaultSchemaOptions> & import("../models/CreditTransaction").ICreditTransaction & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
}>;
export declare const getFarmerCreditService: (shopId: string, farmerId: string) => Promise<{
    account: mongoose.Document<unknown, {}, import("../models/CreditAccount").ICreditAccount, {}, mongoose.DefaultSchemaOptions> & import("../models/CreditAccount").ICreditAccount & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    };
    transactions: (mongoose.Document<unknown, {}, import("../models/CreditTransaction").ICreditTransaction, {}, mongoose.DefaultSchemaOptions> & import("../models/CreditTransaction").ICreditTransaction & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
}>;
export declare const getOutstandingCreditsService: (shopId: string, skip: number, limit: number) => Promise<{
    accounts: (mongoose.Document<unknown, {}, import("../models/CreditAccount").ICreditAccount, {}, mongoose.DefaultSchemaOptions> & import("../models/CreditAccount").ICreditAccount & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
//# sourceMappingURL=credit.service.d.ts.map
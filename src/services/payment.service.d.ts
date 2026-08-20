import mongoose from 'mongoose';
export declare const createPaymentService: (shopId: string, userId: string, data: any) => Promise<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, mongoose.DefaultSchemaOptions> & import("../models/Payment").IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getPaymentsService: (shopId: string, skip: number, limit: number) => Promise<{
    payments: (mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, mongoose.DefaultSchemaOptions> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    total: number;
}>;
//# sourceMappingURL=payment.service.d.ts.map
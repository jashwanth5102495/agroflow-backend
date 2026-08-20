export declare const getDashboardSummaryService: (shopId: string) => Promise<{
    todaySales: any;
    todaySalesCount: any;
    todayCollection: any;
    totalFarmers: number;
    totalProducts: number;
    outstandingCredit: any;
}>;
export declare const getRecentTransactionsService: (shopId: string) => Promise<{
    recentSales: (import("mongoose").Document<unknown, {}, import("../models/Sale").ISale, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Sale").ISale & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    recentPayments: (import("mongoose").Document<unknown, {}, import("../models/Payment").IPayment, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Payment").IPayment & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
}>;
export declare const getInventoryAlertsService: (shopId: string) => Promise<any[]>;
//# sourceMappingURL=dashboard.service.d.ts.map
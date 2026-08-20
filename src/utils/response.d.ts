import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, message?: string, errorCode?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendPaginatedSuccess: <T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map
import { Request, Response, NextFunction } from 'express';
/**
 * Get all registered shops with owner details for admin panel
 */
export declare const getAllShops: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Get platform-wide admin dashboard statistics
 */
export declare const getAdminDashboardStats: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=admin.controller.d.ts.map
import { Request, Response, NextFunction } from 'express';
/**
 * Get subscription details and plans for current logged-in shop
 */
export declare const getSubscriptionStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Activate subscription via AutoPay payment
 */
export declare const paySubscription: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Agent/Admin endpoint to configure a custom subscription price for a shop
 */
export declare const setShopSubscriptionPrice: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=subscription.controller.d.ts.map
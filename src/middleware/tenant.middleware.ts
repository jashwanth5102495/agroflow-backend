import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.shopId) {
    return sendError(res, 'Tenant context missing', 'FORBIDDEN', 403);
  }

  // Optional: We could also attach it explicitly to a specific `req.tenantId` 
  // but req.user.shopId is sufficient for tenant isolation.
  next();
};

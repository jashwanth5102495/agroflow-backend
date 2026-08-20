import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
export declare const requireRole: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=role.middleware.d.ts.map
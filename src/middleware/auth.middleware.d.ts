import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                shopId: string;
                role: UserRole;
            };
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.middleware.d.ts.map
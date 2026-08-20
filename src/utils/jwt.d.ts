import { UserRole } from '../models/User';
export interface JwtPayload {
    userId: string;
    shopId: string;
    role: UserRole;
}
export declare const generateToken: (payload: JwtPayload) => string;
export declare const verifyToken: (token: string) => JwtPayload;
//# sourceMappingURL=jwt.d.ts.map
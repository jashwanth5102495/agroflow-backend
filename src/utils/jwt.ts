import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export interface JwtPayload {
  userId: string;
  shopId: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload, expiresIn?: string): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (expiresIn || env.JWT_EXPIRES_IN || '90d') as any,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string, ignoreExpiration: boolean = false): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, { ignoreExpiration }) as JwtPayload;
};

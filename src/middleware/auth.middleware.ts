import { Request, Response, NextFunction } from 'express';
import { verifyToken, generateToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { UserRole } from '../models/User';

// Extend express Request to include user context
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

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token missing', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;

    // Sliding session: If token has less than 15 days remaining, issue a refreshed token in response header
    try {
      const exp = (decoded as any).exp;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (exp && (exp - nowInSeconds < 15 * 86400)) {
        const refreshed = generateToken({
          userId: decoded.userId,
          shopId: decoded.shopId,
          role: decoded.role,
        });
        res.setHeader('x-refreshed-token', refreshed);
      }
    } catch (refreshErr) {
      // Don't fail the request if background header generation fails
    }

    next();
  } catch (error) {
    next(error); // This will be caught by the global error handler as JsonWebTokenError or TokenExpiredError
  }
};

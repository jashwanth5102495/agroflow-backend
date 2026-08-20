import { Request, Response, NextFunction } from 'express';
import { registerShopService, loginService, getMeService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const registerShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerShopService(req.body);
    return sendSuccess(res, result, 'Shop registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginService(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT implementation, logout is usually handled client-side by deleting the token.
    // If blacklisting is needed, it would be implemented here.
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw { message: 'User context missing', statusCode: 401 };

    const result = await getMeService(userId);
    return sendSuccess(res, result, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

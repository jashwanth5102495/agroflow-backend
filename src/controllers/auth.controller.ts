import { Request, Response, NextFunction } from 'express';
import { registerShopService, loginService, adminLoginService, getMeService } from '../services/auth.service';
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

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminLoginService(req.body);
    return sendSuccess(res, result, 'Admin authenticated successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

export const toggleCashierMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) throw { message: 'Shop context missing', statusCode: 401 };

    const { isEnabled } = req.body;
    const { toggleCashierModeService } = await import('../services/auth.service');
    const result = await toggleCashierModeService(shopId, isEnabled);
    return sendSuccess(res, result, `Cashier mode ${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    next(error);
  }
};

export const cashierLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, cashierToken } = req.body;
    const { cashierLoginService } = await import('../services/auth.service');
    const result = await cashierLoginService(shopId, cashierToken);
    return sendSuccess(res, result, 'Cashier logged in successfully');
  } catch (error) {
    next(error);
  }
};

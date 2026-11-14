import { Request, Response, NextFunction } from 'express';
import * as purchaseService from '../services/purchase.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await purchaseService.createPurchaseService(req.user!.shopId, req.user!.userId, req.body);
    return sendSuccess(res, purchase, 'Incoming material recorded and stock updated successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const search = req.query.search ? String(req.query.search) : undefined;
    const { purchases, total } = await purchaseService.getPurchasesService(req.user!.shopId, skip, limit, search);
    return sendPaginatedSuccess(res, purchases, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchaseData = await purchaseService.getPurchaseByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, purchaseData, 'Incoming record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const deletePurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await purchaseService.deletePurchaseService(req.user!.shopId, req.params.id as string, req.user!.userId);
    return sendSuccess(res, result, 'Incoming record deleted successfully');
  } catch (error) {
    next(error);
  }
};

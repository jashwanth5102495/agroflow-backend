import { Request, Response, NextFunction } from 'express';
import * as saleService from '../services/sale.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.createSaleService(req.user!.shopId, req.user!.userId, req.body);
    return sendSuccess(res, sale, 'Sale created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { sales, total } = await saleService.getSalesService(req.user!.shopId, skip, limit);
    return sendPaginatedSuccess(res, sales, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saleData = await saleService.getSaleByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, saleData, 'Sale retrieved successfully');
  } catch (error) {
    next(error);
  }
};

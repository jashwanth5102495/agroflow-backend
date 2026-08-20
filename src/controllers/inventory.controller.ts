import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventory.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';
import { TransactionType } from '../models/InventoryTransaction';

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const { inventory, total } = await inventoryService.getInventoryService(req.user!.shopId, skip, limit);
    return sendPaginatedSuccess(res, inventory, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const adjustInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantityChange, type, reason } = req.body;
    const inventory = await inventoryService.adjustInventoryService(
      req.user!.shopId,
      productId,
      quantityChange,
      type || TransactionType.ADJUSTMENT,
      req.user!.userId,
      undefined,
      undefined,
      reason
    );
    return sendSuccess(res, inventory, 'Inventory adjusted successfully');
  } catch (error) {
    next(error);
  }
};

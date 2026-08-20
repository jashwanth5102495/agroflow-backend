import { Request, Response, NextFunction } from 'express';
import * as supplierService from '../services/supplier.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.createSupplierService(req.user!.shopId, req.body);
    return sendSuccess(res, supplier, 'Supplier created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const search = (req.query.search as string) || '';

    const { suppliers, total } = await supplierService.getSuppliersService(req.user!.shopId, search, skip, limit);
    return sendPaginatedSuccess(res, suppliers, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.getSupplierByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, supplier, 'Supplier retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await supplierService.updateSupplierService(req.user!.shopId, req.params.id as string, req.body);
    return sendSuccess(res, supplier, 'Supplier updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await supplierService.deleteSupplierService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, null, 'Supplier deleted successfully');
  } catch (error) {
    next(error);
  }
};

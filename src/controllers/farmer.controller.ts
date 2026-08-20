import { Request, Response, NextFunction } from 'express';
import * as farmerService from '../services/farmer.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.createFarmerService(req.user!.shopId, req.body);
    return sendSuccess(res, farmer, 'Farmer created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getFarmers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const search = (req.query.search as string) || '';

    const { farmers, total } = await farmerService.getFarmersService(req.user!.shopId, search, skip, limit);
    return sendPaginatedSuccess(res, farmers, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getFarmerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.getFarmerByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, farmer, 'Farmer retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmer = await farmerService.updateFarmerService(req.user!.shopId, req.params.id as string, req.body);
    return sendSuccess(res, farmer, 'Farmer updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await farmerService.deleteFarmerService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, null, 'Farmer deleted successfully');
  } catch (error) {
    next(error);
  }
};

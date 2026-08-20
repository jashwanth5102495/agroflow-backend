import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationOptions, formatPagination } from '../utils/pagination';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.createProductService(req.user!.shopId, req.body);
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req.query);
    const search = (req.query.search as string) || '';

    const { products, total } = await productService.getProductsService(req.user!.shopId, search, skip, limit);
    return sendPaginatedSuccess(res, products, formatPagination(page, limit, total));
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductByIdService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.updateProductService(req.user!.shopId, req.params.id as string, req.body);
    return sendSuccess(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.deleteProductService(req.user!.shopId, req.params.id as string);
    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

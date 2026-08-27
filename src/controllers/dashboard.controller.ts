import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await dashboardService.getDashboardSummaryService(req.user!.shopId);
    return sendSuccess(res, summary, 'Dashboard summary retrieved');
  } catch (error) {
    next(error);
  }
};

export const getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await dashboardService.getRecentTransactionsService(req.user!.shopId);
    return sendSuccess(res, transactions, 'Recent transactions retrieved');
  } catch (error) {
    next(error);
  }
};

export const getInventoryAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await dashboardService.getInventoryAlertsService(req.user!.shopId);
    return sendSuccess(res, alerts, 'Inventory alerts retrieved');
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardService.getAnalyticsService(req.user!.shopId);
    return sendSuccess(res, analytics, 'Analytics retrieved');
  } catch (error) {
    next(error);
  }
};

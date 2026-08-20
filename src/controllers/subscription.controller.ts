import { Request, Response, NextFunction } from 'express';
import { Shop } from '../models/Shop';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Get subscription details and plans for current logged-in shop
 */
export const getSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return sendError(res, 'Shop authentication required', 'UNAUTHORIZED', 401);
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return sendError(res, 'Shop not found', 'NOT_FOUND', 404);
    }

    const monthlyBasePrice = shop.subscriptionPrice || 1500;
    const annualDiscountedPrice = Math.round((monthlyBasePrice * 12) * 0.85); // 15% off

    // Calculate days remaining
    let daysRemaining = 0;
    if (shop.subscriptionEndDate && shop.subscriptionStatus === 'ACTIVE') {
      const diffMs = new Date(shop.subscriptionEndDate).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return sendSuccess(res, {
      subscriptionStatus: shop.subscriptionStatus,
      billingCycle: shop.billingCycle,
      subscriptionStartDate: shop.subscriptionStartDate,
      subscriptionEndDate: shop.subscriptionEndDate,
      daysRemaining,
      autoPay: shop.autoPay,
      monthlyBasePrice,
      annualDiscountedPrice,
      annualSavings: (monthlyBasePrice * 12) - annualDiscountedPrice,
      plans: [
        {
          id: 'MONTHLY',
          name: 'Monthly Plan',
          price: monthlyBasePrice,
          period: 'month',
          billingText: `₹${monthlyBasePrice.toLocaleString('en-IN')}/month with Recurring AutoPay`,
          discount: 'Standard Rate',
          isPopular: false,
        },
        {
          id: 'ANNUAL',
          name: 'Annual Plan (15% OFF)',
          price: annualDiscountedPrice,
          originalPrice: monthlyBasePrice * 12,
          period: 'year',
          billingText: `₹${annualDiscountedPrice.toLocaleString('en-IN')}/year (Save ₹${((monthlyBasePrice * 12) - annualDiscountedPrice).toLocaleString('en-IN')})`,
          discount: '15% DISCOUNT APPLIED',
          isPopular: true,
        },
      ],
      billingHistory: shop.billingHistory || [],
    }, 'Subscription status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Activate subscription via AutoPay payment
 */
export const paySubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return sendError(res, 'Shop authentication required', 'UNAUTHORIZED', 401);
    }

    const { cycle = 'MONTHLY', paymentMethod = 'UPI AutoPay', autoPay = true } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return sendError(res, 'Shop not found', 'NOT_FOUND', 404);
    }

    const monthlyBasePrice = shop.subscriptionPrice || 1500;
    const finalAmount = cycle === 'ANNUAL'
      ? Math.round((monthlyBasePrice * 12) * 0.85)
      : monthlyBasePrice;

    const now = new Date();
    const expiry = new Date();
    if (cycle === 'ANNUAL') {
      expiry.setDate(expiry.getDate() + 365);
    } else {
      expiry.setDate(expiry.getDate() + 30);
    }

    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const billingRecord = {
      date: now,
      amount: finalAmount,
      plan: cycle === 'ANNUAL' ? 'Annual Plan (15% OFF)' : 'Monthly Plan',
      cycle: cycle as 'MONTHLY' | 'ANNUAL',
      status: 'PAID' as const,
      paymentMethod,
      transactionId,
    };

    shop.subscriptionStatus = 'ACTIVE';
    shop.billingCycle = cycle as 'MONTHLY' | 'ANNUAL';
    shop.subscriptionStartDate = now;
    shop.subscriptionEndDate = expiry;
    shop.autoPay = !!autoPay;
    shop.billingHistory.unshift(billingRecord as any);

    await shop.save();

    return sendSuccess(res, {
      subscriptionStatus: shop.subscriptionStatus,
      billingCycle: shop.billingCycle,
      subscriptionStartDate: shop.subscriptionStartDate,
      subscriptionEndDate: shop.subscriptionEndDate,
      autoPay: shop.autoPay,
      latestTransaction: billingRecord,
    }, 'Subscription payment successful and AutoPay activated');
  } catch (error) {
    next(error);
  }
};

/**
 * Agent/Admin endpoint to configure a custom subscription price for a shop
 */
export const setShopSubscriptionPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, subscriptionPrice } = req.body;
    if (!shopId || !subscriptionPrice) {
      return sendError(res, 'shopId and subscriptionPrice are required', 'VALIDATION_ERROR', 400);
    }

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { subscriptionPrice: Number(subscriptionPrice) },
      { new: true }
    );

    if (!shop) {
      return sendError(res, 'Shop not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, shop, 'Shop subscription price updated successfully');
  } catch (error) {
    next(error);
  }
};

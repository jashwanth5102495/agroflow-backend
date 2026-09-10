import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Shop } from '../models/Shop';
import { User, UserRole } from '../models/User';
import { Sale } from '../models/Sale';
import { sendSuccess } from '../utils/response';
import { createSubscriptionPlan, createSubscription } from '../services/cashfree.service';

/**
 * Get all registered shops with owner details for admin panel
 */
export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 }).lean();
    
    // Enrich each shop with owner info optimally (avoiding N+1 queries)
    const shopIds = shops.map((shop: any) => shop._id);
    const owners = await User.find({ shopId: { $in: shopIds }, role: UserRole.OWNER })
      .select('shopId name phone email lastLoginAt')
      .lean();

    const ownerMap = new Map();
    owners.forEach((owner: any) => {
      ownerMap.set(owner.shopId.toString(), owner);
    });

    const shopsWithOwners = shops.map((shop: any) => ({
      ...shop,
      owner: ownerMap.get(shop._id.toString()) || null,
    }));

    return sendSuccess(res, shopsWithOwners, 'All shops retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get platform-wide admin dashboard statistics
 */
export const getAdminDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalShops, totalUsers, activeShops] = await Promise.all([
      Shop.countDocuments(),
      User.countDocuments(),
      Shop.countDocuments({ status: 'ACTIVE' }),
    ]);

    // Get this month's revenue across all shops
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueResult = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);

    const monthlyRevenue = revenueResult[0]?.totalRevenue || 0;

    // Shops registered this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const newShopsThisWeek = await Shop.countDocuments({ createdAt: { $gte: startOfWeek } });

    return sendSuccess(res, {
      totalShops,
      totalUsers,
      activeShops,
      monthlyRevenue,
      newShopsThisWeek,
    }, 'Admin dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a shop and its associated users (Super Admin only)
 */
export const deleteShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw { message: 'Invalid shop ID', statusCode: 400 };
    }

    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) {
      throw { message: 'Shop not found', statusCode: 404 };
    }

    // Delete associated users
    await User.deleteMany({ shopId: id });

    return sendSuccess(res, null, 'Shop deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateShopSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { subscriptionPrice, isSubscriptionEnforced } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw { message: 'Invalid shop ID', statusCode: 400 };
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      throw { message: 'Shop not found', statusCode: 404 };
    }

    let cashfreeSubscriptionId = shop.cashfreeSubscriptionId;

    if (isSubscriptionEnforced) {
      const price = subscriptionPrice || shop.subscriptionPrice || 1500;
      const planId = `plan_${price}_monthly`;
      
      // Create or get plan
      await createSubscriptionPlan(planId, price, `AgroFlow Monthly (Rs.${price})`);

      if (!cashfreeSubscriptionId) {
        // Generate a new subscription ID
        cashfreeSubscriptionId = `sub_${shop._id}_${Date.now()}`;
        await createSubscription(
          cashfreeSubscriptionId, 
          planId, 
          shop.email || '', 
          shop.phone || '', 
          shop.ownerName || ''
        );
      }
    }

    shop.subscriptionPrice = subscriptionPrice;
    shop.isSubscriptionEnforced = isSubscriptionEnforced;
    shop.cashfreeSubscriptionId = cashfreeSubscriptionId;
    if (isSubscriptionEnforced && shop.subscriptionStatus !== 'ACTIVE') {
      shop.subscriptionStatus = 'PENDING_PAYMENT';
    }

    await shop.save();

    return sendSuccess(res, shop, 'Shop subscription updated successfully');
  } catch (error) {
    next(error);
  }
};


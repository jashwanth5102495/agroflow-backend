import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Shop } from '../models/Shop';
import { User, UserRole } from '../models/User';
import { Sale } from '../models/Sale';
import { sendSuccess } from '../utils/response';

/**
 * Get all registered shops with owner details for admin panel
 */
export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 }).lean();
    
    // Enrich each shop with owner info
    const shopsWithOwners = await Promise.all(
      shops.map(async (shop: any) => {
        const owner = await User.findOne({ shopId: shop._id, role: UserRole.OWNER })
          .select('name phone email lastLoginAt')
          .lean();
        return { ...shop, owner: owner || null };
      })
    );

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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
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


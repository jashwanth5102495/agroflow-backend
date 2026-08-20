"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardStats = exports.getAllShops = void 0;
const Shop_1 = require("../models/Shop");
const User_1 = require("../models/User");
const Sale_1 = require("../models/Sale");
const response_1 = require("../utils/response");
/**
 * Get all registered shops with owner details for admin panel
 */
const getAllShops = async (req, res, next) => {
    try {
        const shops = await Shop_1.Shop.find().sort({ createdAt: -1 }).lean();
        // Enrich each shop with owner info
        const shopsWithOwners = await Promise.all(shops.map(async (shop) => {
            const owner = await User_1.User.findOne({ shopId: shop._id, role: User_1.UserRole.OWNER })
                .select('name phone email lastLoginAt')
                .lean();
            return { ...shop, owner: owner || null };
        }));
        return (0, response_1.sendSuccess)(res, shopsWithOwners, 'All shops retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getAllShops = getAllShops;
/**
 * Get platform-wide admin dashboard statistics
 */
const getAdminDashboardStats = async (req, res, next) => {
    try {
        const [totalShops, totalUsers, activeShops] = await Promise.all([
            Shop_1.Shop.countDocuments(),
            User_1.User.countDocuments(),
            Shop_1.Shop.countDocuments({ status: 'ACTIVE' }),
        ]);
        // Get this month's revenue across all shops
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const revenueResult = await Sale_1.Sale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
        ]);
        const monthlyRevenue = revenueResult[0]?.totalRevenue || 0;
        // Shops registered this week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const newShopsThisWeek = await Shop_1.Shop.countDocuments({ createdAt: { $gte: startOfWeek } });
        return (0, response_1.sendSuccess)(res, {
            totalShops,
            totalUsers,
            activeShops,
            monthlyRevenue,
            newShopsThisWeek,
        }, 'Admin dashboard stats retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminDashboardStats = getAdminDashboardStats;
//# sourceMappingURL=admin.controller.js.map
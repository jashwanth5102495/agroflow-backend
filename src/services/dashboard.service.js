"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryAlertsService = exports.getRecentTransactionsService = exports.getDashboardSummaryService = void 0;
const Sale_1 = require("../models/Sale");
const Payment_1 = require("../models/Payment");
const CreditAccount_1 = require("../models/CreditAccount");
const Farmer_1 = require("../models/Farmer");
const Product_1 = require("../models/Product");
const Inventory_1 = require("../models/Inventory");
const getDashboardSummaryService = async (shopId) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [todaySales, todayCollections, totalFarmers, totalProducts, outstandingCreditResult] = await Promise.all([
        // Today's Sales
        Sale_1.Sale.aggregate([
            { $match: { shopId, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, totalSalesAmount: { $sum: '$total' }, count: { $sum: 1 } } }
        ]),
        // Today's Collection
        Payment_1.Payment.aggregate([
            { $match: { shopId, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
        ]),
        // Total Farmers
        Farmer_1.Farmer.countDocuments({ shopId, status: 'ACTIVE' }),
        // Total Products
        Product_1.Product.countDocuments({ shopId, status: 'ACTIVE' }),
        // Outstanding Credit
        CreditAccount_1.CreditAccount.aggregate([
            { $match: { shopId, balance: { $gt: 0 } } },
            { $group: { _id: null, totalOutstanding: { $sum: '$balance' } } }
        ])
    ]);
    return {
        todaySales: todaySales[0]?.totalSalesAmount || 0,
        todaySalesCount: todaySales[0]?.count || 0,
        todayCollection: todayCollections[0]?.totalCollected || 0,
        totalFarmers,
        totalProducts,
        outstandingCredit: outstandingCreditResult[0]?.totalOutstanding || 0,
    };
};
exports.getDashboardSummaryService = getDashboardSummaryService;
const getRecentTransactionsService = async (shopId) => {
    const [recentSales, recentPayments] = await Promise.all([
        Sale_1.Sale.find({ shopId }).populate('farmerId', 'name').sort({ createdAt: -1 }).limit(5),
        Payment_1.Payment.find({ shopId }).sort({ createdAt: -1 }).limit(5)
    ]);
    return { recentSales, recentPayments };
};
exports.getRecentTransactionsService = getRecentTransactionsService;
const getInventoryAlertsService = async (shopId) => {
    // Products where current inventory is <= minimumStock
    const lowStockProducts = await Inventory_1.Inventory.aggregate([
        { $match: { shopId } },
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $match: {
                $expr: { $lte: ['$quantity', '$product.minimumStock'] }
            }
        },
        { $limit: 20 },
        {
            $project: {
                _id: 1,
                quantity: 1,
                productName: '$product.name',
                minimumStock: '$product.minimumStock',
                sku: '$product.sku'
            }
        }
    ]);
    return lowStockProducts;
};
exports.getInventoryAlertsService = getInventoryAlertsService;
//# sourceMappingURL=dashboard.service.js.map
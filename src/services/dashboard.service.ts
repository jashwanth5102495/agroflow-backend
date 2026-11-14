import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Purchase } from '../models/Purchase';
import { Payment } from '../models/Payment';
import { CreditAccount } from '../models/CreditAccount';
import { Farmer } from '../models/Farmer';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';

export const getDashboardSummaryService = async (shopId: string) => {
  const shopObjId = new mongoose.Types.ObjectId(shopId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todaySales,
    todayPurchases,
    todayCollections,
    totalFarmers,
    totalProducts,
    outstandingCreditResult,
    overallSalesResult,
    overallPurchasesResult,
  ] = await Promise.all([
    // Today's Sales
    Sale.aggregate([
      { $match: { shopId: shopObjId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalSalesAmount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),

    // Today's Incoming Purchases
    Purchase.aggregate([
      { $match: { shopId: shopObjId, purchaseDate: { $gte: startOfDay } } },
      { $group: { _id: null, totalPurchasesAmount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),

    // Today's Collection
    Payment.aggregate([
      { $match: { shopId: shopObjId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } },
    ]),

    // Total Farmers
    Farmer.countDocuments({ shopId: shopObjId, status: 'ACTIVE' }),

    // Total Products
    Product.countDocuments({ shopId: shopObjId, status: 'ACTIVE' }),

    // Outstanding Credit
    CreditAccount.aggregate([
      { $match: { shopId: shopObjId, balance: { $gt: 0 } } },
      { $group: { _id: null, totalOutstanding: { $sum: '$balance' } } },
    ]),

    // Overall Sales
    Sale.aggregate([
      { $match: { shopId: shopObjId } },
      { $group: { _id: null, totalSalesAmount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),

    // Overall Incoming Purchases
    Purchase.aggregate([
      { $match: { shopId: shopObjId } },
      { $group: { _id: null, totalPurchasesAmount: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    todaySales: todaySales[0]?.totalSalesAmount || 0,
    todaySalesCount: todaySales[0]?.count || 0,
    todayPurchases: todayPurchases[0]?.totalPurchasesAmount || 0,
    todayPurchasesCount: todayPurchases[0]?.count || 0,
    todayCollection: todayCollections[0]?.totalCollected || 0,
    totalFarmers,
    totalProducts,
    outstandingCredit: outstandingCreditResult[0]?.totalOutstanding || 0,
    overallSales: overallSalesResult[0]?.totalSalesAmount || 0,
    overallPurchases: overallPurchasesResult[0]?.totalPurchasesAmount || 0,
  };
};

export const getRecentTransactionsService = async (shopId: string) => {
  const shopObjId = new mongoose.Types.ObjectId(shopId);

  const [recentSales, recentPurchases, recentPayments] = await Promise.all([
    Sale.find({ shopId: shopObjId })
      .populate('farmerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Purchase.find({ shopId: shopObjId })
      .sort({ purchaseDate: -1, createdAt: -1 })
      .limit(5)
      .lean(),
    Payment.find({ shopId: shopObjId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return { recentSales, recentPurchases, recentPayments };
};

export const getInventoryAlertsService = async (shopId: string) => {
  const shopObjId = new mongoose.Types.ObjectId(shopId);

  // Products where current inventory is <= minimumStock
  const lowStockProducts = await Inventory.aggregate([
    { $match: { shopId: shopObjId } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $match: {
        $expr: { $lte: ['$quantity', '$product.minimumStock'] },
      },
    },
    { $limit: 20 },
    {
      $project: {
        _id: 1,
        quantity: 1,
        productName: '$product.name',
        minimumStock: '$product.minimumStock',
        sku: '$product.sku',
      },
    },
  ]);

  return lowStockProducts;
};

export const getAnalyticsService = async (shopId: string) => {
  const shopObjId = new mongoose.Types.ObjectId(shopId);

  // 1. Sales by Category
  const salesByCategory = await SaleItem.aggregate([
    {
      $lookup: {
        from: 'sales',
        localField: 'saleId',
        foreignField: '_id',
        as: 'sale',
      },
    },
    { $unwind: '$sale' },
    { $match: { 'sale.shopId': shopObjId } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        totalSales: { $sum: '$total' },
      },
    },
    { $project: { name: { $ifNull: ['$_id', 'Uncategorized'] }, value: '$totalSales', _id: 0 } },
    { $sort: { value: -1 } },
  ]);

  // If no sales yet, provide real Category Breakdown of the Shop's Inventory Products!
  let categoryBreakdown = salesByCategory;
  let categoryType = 'SALES';

  if (!salesByCategory || salesByCategory.length === 0) {
    const inventoryCategories = await Product.aggregate([
      { $match: { shopId: shopObjId, status: 'ACTIVE' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $project: { name: { $ifNull: ['$_id', 'General Agrochemicals'] }, value: '$count', _id: 0 } },
      { $sort: { value: -1 } },
    ]);
    categoryBreakdown = inventoryCategories;
    categoryType = 'INVENTORY_CATALOG';
  }

  // 2. Real Last 6 Calendar Months Window for Sales, Incoming Material, and Credit
  const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const past6Months: { month: number; year: number; name: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    past6Months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      name: monthsNames[d.getMonth()],
    });
  }

  const sixMonthsAgo = new Date(past6Months[0].year, past6Months[0].month - 1, 1);

  // Aggregate Sales & Credit by Month
  const salesByMonth = await Sale.aggregate([
    { $match: { shopId: shopObjId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
        sales: { $sum: '$total' },
        credit: { $sum: '$amountDue' },
      },
    },
  ]);

  // Aggregate Incoming Purchases by Month
  const purchasesByMonth = await Purchase.aggregate([
    { $match: { shopId: shopObjId, purchaseDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $month: '$purchaseDate' },
          year: { $year: '$purchaseDate' },
        },
        incoming: { $sum: '$total' },
      },
    },
  ]);

  const salesMap = new Map();
  salesByMonth.forEach((item: any) => {
    salesMap.set(`${item._id.year}-${item._id.month}`, item);
  });

  const purchasesMap = new Map();
  purchasesByMonth.forEach((item: any) => {
    purchasesMap.set(`${item._id.year}-${item._id.month}`, item);
  });

  // Construct complete real 6 months array
  const salesVsCredit = past6Months.map((m) => {
    const key = `${m.year}-${m.month}`;
    const s = salesMap.get(key);
    const p = purchasesMap.get(key);
    return {
      name: m.name,
      sales: s ? s.sales : 0,
      credit: s ? s.credit : 0,
      incoming: p ? p.incoming : 0,
    };
  });

  return {
    salesByCategory: categoryBreakdown,
    categoryType,
    salesVsCredit,
  };
};

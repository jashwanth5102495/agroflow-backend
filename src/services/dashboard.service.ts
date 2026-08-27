import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Payment } from '../models/Payment';
import { CreditAccount } from '../models/CreditAccount';
import { Farmer } from '../models/Farmer';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';

export const getDashboardSummaryService = async (shopId: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todaySales,
    todayCollections,
    totalFarmers,
    totalProducts,
    outstandingCreditResult
  ] = await Promise.all([
    // Today's Sales
    Sale.aggregate([
      { $match: { shopId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalSalesAmount: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    
    // Today's Collection
    Payment.aggregate([
      { $match: { shopId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]),
    
    // Total Farmers
    Farmer.countDocuments({ shopId, status: 'ACTIVE' }),
    
    // Total Products
    Product.countDocuments({ shopId, status: 'ACTIVE' }),

    // Outstanding Credit
    CreditAccount.aggregate([
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

export const getRecentTransactionsService = async (shopId: string) => {
  const [recentSales, recentPayments] = await Promise.all([
    Sale.find({ shopId }).populate('farmerId', 'name').sort({ createdAt: -1 }).limit(5),
    Payment.find({ shopId }).sort({ createdAt: -1 }).limit(5)
  ]);
  
  return { recentSales, recentPayments };
};

export const getInventoryAlertsService = async (shopId: string) => {
  // Products where current inventory is <= minimumStock
  const lowStockProducts = await Inventory.aggregate([
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

export const getAnalyticsService = async (shopId: string) => {
  const shopObjId = new mongoose.Types.ObjectId(shopId);

  // Sales by Category — join SaleItems → Products
  const salesByCategory = await SaleItem.aggregate([
    {
      $lookup: {
        from: 'sales',
        localField: 'saleId',
        foreignField: '_id',
        as: 'sale'
      }
    },
    { $unwind: '$sale' },
    { $match: { 'sale.shopId': shopObjId } },
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
      $group: {
        _id: '$product.category',
        totalSales: { $sum: '$total' }
      }
    },
    { $project: { name: { $ifNull: ['$_id', 'Uncategorized'] }, value: '$totalSales', _id: 0 } }
  ]);

  // Sales vs Credit (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const salesVsCredit = await Sale.aggregate([
    { $match: { shopId: shopObjId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        sales: { $sum: '$total' },
        credit: { $sum: '$amountDue' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        name: {
          $let: {
            vars: {
              monthsInString: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            in: { $arrayElemAt: ['$$monthsInString', '$_id.month'] }
          }
        },
        sales: 1,
        credit: 1
      }
    }
  ]);

  return { salesByCategory, salesVsCredit };
};

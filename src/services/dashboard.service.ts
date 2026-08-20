import { Sale } from '../models/Sale';
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

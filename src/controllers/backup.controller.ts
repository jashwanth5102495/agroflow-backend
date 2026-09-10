import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
const archiver = require('archiver');
import PDFDocument from 'pdfkit';
import multer from 'multer';

import { Shop } from '../models/Shop';
import { Sale } from '../models/Sale';
import { Purchase } from '../models/Purchase';
import { Farmer } from '../models/Farmer';
import { Inventory } from '../models/Inventory';
import { CreditAccount } from '../models/CreditAccount';
import { CreditTransaction } from '../models/CreditTransaction';
import { DataRequest } from '../models/DataRequest';
import { sendSuccess, sendError } from '../utils/response';

// Setup multer for memory storage
const storage = multer.memoryStorage();
export const uploadBackup = multer({ storage }).single('backupFile');

export const generateBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId as string;
    const { period, clearData } = req.query; // period=monthly|weekly, clearData=true|false

    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return sendError(res, 'Invalid shop ID', 'VALIDATION_ERROR', 400);
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return sendError(res, 'Shop not found', 'NOT_FOUND', 404);
    }

    // Determine date range (for simplicity, just back up everything or filter by period)
    // Actually, taking a full snapshot is safer, but user says "monthly backup and clear".
    let startDate = new Date(0);
    let endDate = new Date();
    
    if (period === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch data
    const sales = await Sale.find({ shopId, createdAt: { $gte: startDate, $lte: endDate } }).lean();
    const purchases = await Purchase.find({ shopId, createdAt: { $gte: startDate, $lte: endDate } }).lean();
    const farmers = await Farmer.find({ shopId }).lean();
    const inventory = await Inventory.find({ shopId }).lean();
    const creditAccounts = await CreditAccount.find({ shopId }).lean();
    const creditTransactions = await CreditTransaction.find({ shopId }).lean();

    const jsonData = JSON.stringify({
      shopId,
      period,
      timestamp: new Date().toISOString(),
      data: {
        sales,
        purchases,
        farmers,
        inventory,
        creditAccounts,
        creditTransactions
      }
    }, null, 2);

    // Initialize archiver
    res.attachment(`agroflow_backup_${shop.name}_${Date.now()}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } }) as any;

    archive.on('error', (err: any) => {
      throw err;
    });

    archive.pipe(res);

    // Add JSON to zip
    archive.append(jsonData, { name: 'database_dump.json' });

    // Generate PDF to zip
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      archive.append(pdfData, { name: 'sales_report.pdf' });

      // After appending PDF, finalize the archive
      await archive.finalize();

      // If clearData is true, delete the backed up sales/purchases
      if (clearData === 'true') {
        const saleIds = sales.map(s => s._id);
        const purchaseIds = purchases.map(p => p._id);
        await Sale.deleteMany({ _id: { $in: saleIds } });
        await Purchase.deleteMany({ _id: { $in: purchaseIds } });
      }
    });

    // Write PDF content
    doc.fontSize(20).text(`AgroFlow Backup Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Shop: ${shop.name}`);
    doc.text(`Period: ${period || 'All Time'}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();
    
    const totalSales = sales.reduce((acc, curr: any) => acc + (curr.total || 0), 0);
    const totalPurchases = purchases.reduce((acc, curr: any) => acc + (curr.total || 0), 0);
    
    doc.fontSize(16).text('Financial Overview', { underline: true });
    doc.fontSize(12).text(`Total Sales: Rs. ${totalSales.toLocaleString()}`);
    doc.text(`Total Purchases: Rs. ${totalPurchases.toLocaleString()}`);
    doc.text(`Total Orders: ${sales.length}`);
    
    doc.end();

  } catch (error) {
    next(error);
  }
};

export const restoreBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.params.shopId;
    if (!req.file) {
      return sendError(res, 'No backup file provided', 'VALIDATION_ERROR', 400);
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const backup = JSON.parse(fileContent);

    if (backup.shopId !== shopId) {
      return sendError(res, 'This backup belongs to a different shop', 'VALIDATION_ERROR', 400);
    }

    const { sales, purchases, farmers, inventory, creditAccounts, creditTransactions } = backup.data;

    // Helper to perform upsert (append without overriding)
    const appendData = async (Model: any, dataArray: any[]) => {
      if (!dataArray || dataArray.length === 0) return;
      const operations = dataArray.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $setOnInsert: item },
          upsert: true
        }
      }));
      await Model.bulkWrite(operations);
    };

    await appendData(Sale, sales);
    await appendData(Purchase, purchases);
    await appendData(Farmer, farmers);
    await appendData(Inventory, inventory);
    await appendData(CreditAccount, creditAccounts);
    await appendData(CreditTransaction, creditTransactions);

    // If there is an associated data request, mark it fulfilled
    if (req.body.requestId) {
      await DataRequest.findByIdAndUpdate(req.body.requestId, { status: 'FULFILLED' });
    }

    return sendSuccess(res, null, 'Data restored and appended successfully');
  } catch (error) {
    next(error);
  }
};

export const requestOldData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);

    const { month, year } = req.body;

    let request = await DataRequest.findOne({ shopId, month, year });
    if (!request) {
      request = new DataRequest({ shopId, month, year, status: 'PAID', amount: 50 }); // Simulate payment already done
      await request.save();
    } else {
      request.status = 'PAID';
      await request.save();
    }

    return sendSuccess(res, request, 'Data request payment successful, request sent to Admin');
  } catch (error) {
    next(error);
  }
};

export const getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await DataRequest.find({ status: 'PAID' }).populate('shopId', 'name phone').sort({ createdAt: -1 });
    return sendSuccess(res, requests, 'Pending requests fetched');
  } catch (error) {
    next(error);
  }
};

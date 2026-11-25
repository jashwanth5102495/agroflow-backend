import PDFDocument from 'pdfkit';
import { Sale } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Inventory } from '../models/Inventory';
import { CreditAccount } from '../models/CreditAccount';
import { Shop } from '../models/Shop';
import mongoose from 'mongoose';

export interface DailyReportData {
  shopName: string;
  ownerName: string;
  phone: string;
  district: string;
  state: string;
  dateStr: string;
  summary: {
    totalSales: number;
    totalCash: number;
    totalUpi: number;
    totalCard: number;
    totalCredit: number; // Credit given today
    totalCollected: number; // Cash + UPI + Card
    totalCogs: number; // Cost of Goods Sold
    totalProfit: number; // Gross Profit = totalSales - totalCogs
    profitMargin: number; // %
    totalCount: number; // Invoices count
    totalOutstandingCredit: number; // Total unpaid balance across all farmers
  };
  salesDetails: Array<{
    invoiceNumber: string;
    farmerName: string;
    farmerPhone: string;
    village: string;
    items: Array<{
      name: string;
      qty: number;
      unitPrice: number;
      purchasePrice: number;
      total: number;
      profit: number;
    }>;
    total: number;
    paid: number;
    due: number;
    profit: number;
    paymentMethod: string;
  }>;
  creditFarmers: Array<{
    farmerName: string;
    phone: string;
    village: string;
    balance: number;
  }>;
  lowStockItems: Array<{
    name: string;
    sku?: string;
    quantity: number;
    minimumStock: number;
    unit: string;
  }>;
  zeroStockItems: Array<{
    name: string;
    unit: string;
  }>;
  topSoldProducts: Array<{
    name: string;
    qty: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

/**
 * Fetch all report data for a specific shop and date with exact profit, sales, and credit tracking.
 */
export const fetchDailyReportData = async (shopId: string, dateStr: string): Promise<DailyReportData> => {
  const shop = await Shop.findById(shopId);
  const shopName = shop ? shop.name : 'AgroFlow Fertilizer & Agri Store';
  const ownerName = shop ? shop.ownerName : 'Store Owner';
  const phone = shop ? shop.phone : '';
  const district = shop ? shop.district : '';
  const state = shop ? shop.state : '';

  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  // 1. Fetch Sales for the day (checking both createdAt and custom saleDate)
  const sales = await Sale.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    $or: [
      { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      { saleDate: { $gte: startOfDay, $lte: endOfDay } },
    ],
  })
    .populate('farmerId', 'name phone village')
    .sort({ createdAt: -1 })
    .lean();

  let totalSales = 0;
  let totalCash = 0;
  let totalUpi = 0;
  let totalCard = 0;
  let totalCredit = 0;
  let totalCogs = 0;

  const productAggMap = new Map<string, { name: string; qty: number; revenue: number; cost: number; profit: number }>();

  const salesDetails = await Promise.all(
    sales.map(async (sale: any) => {
      const saleTotal = sale.total || 0;
      const amountPaid = sale.amountPaid || 0;
      const amountDue = sale.amountDue || 0;

      totalSales += saleTotal;
      totalCredit += amountDue;

      const method = sale.paymentMethod;
      if (method === 'UPI') {
        totalUpi += amountPaid;
      } else if (method === 'CARD' || method === 'BANK_TRANSFER') {
        totalCard += amountPaid;
      } else {
        totalCash += amountPaid;
      }

      // Populate product to get purchasePrice for exact profit calculation
      const items = await SaleItem.find({ saleId: sale._id })
        .populate('productId', 'name purchasePrice sellingPrice unit')
        .lean();

      let saleProfit = 0;
      const processedItems = items.map((i: any) => {
        const prod = i.productId as any;
        const purchasePrice = prod?.purchasePrice || 0;
        const unitPrice = i.unitPrice || prod?.sellingPrice || 0;
        const qty = i.quantity || 1;
        const itemTotal = i.total || (unitPrice * qty);
        const itemCost = purchasePrice * qty;
        const itemProfit = itemTotal - itemCost;

        totalCogs += itemCost;
        saleProfit += itemProfit;

        const prodName = i.productName || prod?.name || 'Product';
        if (!productAggMap.has(prodName)) {
          productAggMap.set(prodName, { name: prodName, qty: 0, revenue: 0, cost: 0, profit: 0 });
        }
        const pAgg = productAggMap.get(prodName)!;
        pAgg.qty += qty;
        pAgg.revenue += itemTotal;
        pAgg.cost += itemCost;
        pAgg.profit += itemProfit;

        return {
          name: prodName,
          qty,
          unitPrice,
          purchasePrice,
          total: itemTotal,
          profit: itemProfit,
        };
      });

      return {
        invoiceNumber: sale.invoiceNumber || 'INV-' + sale._id.toString().slice(-6),
        farmerName: sale.customerName || sale.farmerId?.name || 'Walk-in Customer (Grahakaru)',
        farmerPhone: sale.customerPhone || sale.farmerId?.phone || '-',
        village: sale.farmerId?.village || '-',
        items: processedItems,
        total: saleTotal,
        paid: amountPaid,
        due: amountDue,
        profit: saleProfit,
        paymentMethod: sale.paymentMethod || 'CASH',
      };
    })
  );

  const totalCollected = totalCash + totalUpi + totalCard;
  const totalProfit = totalSales - totalCogs;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const topSoldProducts = Array.from(productAggMap.values()).sort((a, b) => b.revenue - a.revenue);

  // 2. Fetch all credit accounts with outstanding balances
  const creditAccounts = await CreditAccount.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    balance: { $gt: 0 },
  })
    .populate('farmerId', 'name phone village')
    .sort({ balance: -1 })
    .lean();

  const totalOutstandingCredit = creditAccounts.reduce((sum, ca: any) => sum + (ca.balance || 0), 0);
  const creditFarmers = creditAccounts.slice(0, 25).map((ca: any) => ({
    farmerName: ca.farmerId?.name || 'Unknown Farmer',
    phone: ca.farmerId?.phone || '-',
    village: ca.farmerId?.village || '-',
    balance: ca.balance || 0,
  }));

  // 3. Fetch zero stock and low stock inventory
  const zeroStockItems = await Inventory.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId), quantity: { $lte: 0 } } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $limit: 10 },
    { $project: { _id: 0, name: '$p.name', unit: '$p.unit' } },
  ]);

  const lowStockItems = await Inventory.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId), quantity: { $gt: 0 } } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: { $expr: { $lte: ['$quantity', '$product.minimumStock'] } } },
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        name: '$product.name',
        sku: '$product.sku',
        quantity: '$quantity',
        minimumStock: '$product.minimumStock',
        unit: '$product.unit',
      },
    },
  ]);

  return {
    shopName,
    ownerName,
    phone,
    district,
    state,
    dateStr,
    summary: {
      totalSales,
      totalCash,
      totalUpi,
      totalCard,
      totalCredit,
      totalCollected,
      totalCogs,
      totalProfit,
      profitMargin,
      totalCount: sales.length,
      totalOutstandingCredit,
    },
    salesDetails,
    creditFarmers,
    lowStockItems,
    zeroStockItems,
    topSoldProducts,
  };
};

/**
 * Generate a PDF Buffer containing the complete bilingual daily sales, profit, and credit report.
 */
export const generateDailyReportPDF = async (reportData: DailyReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `AgroFlow Daily Report - ${reportData.shopName}`,
        Author: 'AgroFlow Agri-Management',
        Subject: 'Daily Sales, Profit & Credit Statement',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => reject(err));

    const primaryColor = '#1e3a8a';
    const secondaryColor = '#059669';
    const alertColor = '#dc2626';
    const darkColor = '#1f2937';
    const grayColor = '#4b5563';

    // Header Top Banner
    doc.rect(40, 40, 515, 60).fill('#f0fdf4');
    doc.fillColor(primaryColor).fontSize(17).font('Helvetica-Bold')
      .text(reportData.shopName.toUpperCase(), 50, 48);

    doc.fillColor(grayColor).fontSize(8.5).font('Helvetica')
      .text(`Prop: ${reportData.ownerName} | Mobile: ${reportData.phone} | ${reportData.district}, ${reportData.state}`, 50, 70);

    doc.fillColor(secondaryColor).fontSize(9.5).font('Helvetica-Bold')
      .text(`DATE: ${reportData.dateStr} | TIME: ${new Date().toLocaleTimeString('en-IN')}`, 50, 84);

    doc.moveDown(2);

    // Section 1: Document Title Bar
    let currentY = 112;
    doc.rect(40, currentY, 515, 22).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
      .text('DAILY BUSINESS, PROFIT & CREDIT STATEMENT (DAINANDINA VYAPARA, LABHA & SALA VARADI)', 48, currentY + 6);

    currentY += 28;

    // 4 Summary Metrics Cards (Sales, Collected, Gross Profit, Credit Given)
    const cardWidth = 122;
    const cardHeight = 48;

    // Card 1: Total Sales
    doc.rect(40, currentY, cardWidth, cardHeight).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica')
      .text('TOTAL SALES (OTTU MARATA)', 46, currentY + 5);
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalSales.toLocaleString('en-IN')}`, 46, currentY + 18);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text(`${reportData.summary.totalCount} Bills Generated`, 46, currentY + 34);

    // Card 2: Total Money Collected in Hand
    doc.rect(171, currentY, cardWidth, cardHeight).fillAndStroke('#ecfdf5', '#a7f3d0');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica')
      .text('COLLECTED (SVEEKARISIDDU)', 177, currentY + 5);
    doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalCollected.toLocaleString('en-IN')}`, 177, currentY + 18);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text(`Cash: Rs.${reportData.summary.totalCash} | Online: Rs.${reportData.summary.totalUpi + reportData.summary.totalCard}`, 177, currentY + 34);

    // Card 3: Total Gross Profit
    doc.rect(302, currentY, cardWidth, cardHeight).fillAndStroke('#f0fdf4', '#86efac');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica')
      .text('GROSS PROFIT (OTTU LABHA)', 308, currentY + 5);
    doc.fillColor('#15803d').fontSize(12).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalProfit.toLocaleString('en-IN')}`, 308, currentY + 18);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text(`${reportData.summary.profitMargin.toFixed(1)}% Profit Margin`, 308, currentY + 34);

    // Card 4: Credit Given Today
    doc.rect(433, currentY, 122, cardHeight).fillAndStroke('#fff7ed', '#fed7aa');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica')
      .text('CREDIT GIVEN (INDINA SALA)', 439, currentY + 5);
    doc.fillColor('#ea580c').fontSize(12).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalCredit.toLocaleString('en-IN')}`, 439, currentY + 18);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text(`Overall Dues: Rs.${reportData.summary.totalOutstandingCredit.toLocaleString('en-IN')}`, 439, currentY + 34);

    currentY += 56;

    // Section 1: Detailed Sales & Farmer Purchases Breakdown
    doc.rect(40, currentY, 515, 18).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
      .text('1. TODAY\'S FARMER SALES & PROFIT BREAKDOWN (RAITHARA KHAREEDI & LABHA VIVARA)', 46, currentY + 4);

    currentY += 22;

    // Table Header for Sales
    doc.rect(40, currentY, 515, 16).fill('#e2e8f0');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold');
    doc.text('Invoice', 45, currentY + 4);
    doc.text('Farmer (Raitha)', 110, currentY + 4);
    doc.text('Village', 195, currentY + 4);
    doc.text('Items Purchased', 260, currentY + 4);
    doc.text('Total', 390, currentY + 4, { width: 40, align: 'right' });
    doc.text('Paid', 435, currentY + 4, { width: 35, align: 'right' });
    doc.text('Credit', 475, currentY + 4, { width: 35, align: 'right' });
    doc.text('Profit', 515, currentY + 4, { width: 35, align: 'right' });

    currentY += 18;

    if (reportData.salesDetails.length === 0) {
      doc.rect(40, currentY, 515, 20).fill('#f8fafc');
      doc.fillColor(grayColor).fontSize(8).font('Helvetica')
        .text('No sales invoices were recorded for today. (Indina marata ivathilla).', 50, currentY + 6);
      currentY += 26;
    } else {
      reportData.salesDetails.forEach((sale, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 40;
        }

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515, 18).fill(bgColor);

        const itemsSummary = sale.items.map((i) => `${i.name} (${i.qty})`).join(', ') || '-';
        const truncatedItems = itemsSummary.length > 25 ? itemsSummary.slice(0, 23) + '..' : itemsSummary;

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica');
        doc.text(sale.invoiceNumber, 45, currentY + 4);
        doc.font('Helvetica-Bold').text(sale.farmerName, 110, currentY + 4);
        doc.font('Helvetica').text(sale.village, 195, currentY + 4);
        doc.text(truncatedItems, 260, currentY + 4);
        doc.font('Helvetica-Bold').text(`Rs.${sale.total}`, 385, currentY + 4, { width: 45, align: 'right' });
        doc.fillColor(secondaryColor).text(`Rs.${sale.paid}`, 430, currentY + 4, { width: 40, align: 'right' });
        doc.fillColor(sale.due > 0 ? alertColor : grayColor).text(`Rs.${sale.due}`, 470, currentY + 4, { width: 40, align: 'right' });
        doc.fillColor('#15803d').font('Helvetica-Bold').text(`+Rs.${sale.profit}`, 510, currentY + 4, { width: 40, align: 'right' });

        currentY += 18;
      });
      currentY += 8;
    }

    // Section 2: Product Sales & Profit Analysis
    if (reportData.topSoldProducts && reportData.topSoldProducts.length > 0) {
      if (currentY > 640) {
        doc.addPage();
        currentY = 40;
      }

      doc.rect(40, currentY, 515, 18).fill('#0f766e');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('2. PRODUCT-WISE SALES & PROFIT ANALYSIS (UTHAPANNAGALA LABHA VIVARA)', 46, currentY + 4);

      currentY += 22;

      doc.rect(40, currentY, 515, 16).fill('#ccfbf1');
      doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold');
      doc.text('Product Name', 45, currentY + 4);
      doc.text('Qty Sold', 230, currentY + 4);
      doc.text('Purchase Cost', 300, currentY + 4, { width: 70, align: 'right' });
      doc.text('Revenue', 390, currentY + 4, { width: 70, align: 'right' });
      doc.text('Net Profit', 475, currentY + 4, { width: 75, align: 'right' });

      currentY += 18;

      reportData.topSoldProducts.slice(0, 10).forEach((prod, pIdx) => {
        if (currentY > 720) {
          doc.addPage();
          currentY = 40;
        }

        const pBg = pIdx % 2 === 0 ? '#ffffff' : '#f0fdfa';
        doc.rect(40, currentY, 515, 16).fill(pBg);

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica');
        doc.text(prod.name, 45, currentY + 4);
        doc.font('Helvetica-Bold').text(`${prod.qty}`, 230, currentY + 4);
        doc.font('Helvetica').text(`Rs. ${prod.cost.toLocaleString('en-IN')}`, 300, currentY + 4, { width: 70, align: 'right' });
        doc.font('Helvetica').text(`Rs. ${prod.revenue.toLocaleString('en-IN')}`, 390, currentY + 4, { width: 70, align: 'right' });
        doc.fillColor('#0f766e').font('Helvetica-Bold').text(`+Rs. ${prod.profit.toLocaleString('en-IN')}`, 475, currentY + 4, { width: 75, align: 'right' });

        currentY += 16;
      });
      currentY += 8;
    }

    // Section 3: Outstanding Credit Ledger
    if (currentY > 640) {
      doc.addPage();
      currentY = 40;
    }

    doc.rect(40, currentY, 515, 18).fill('#7c2d12');
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
      .text(`3. FARMER CREDIT DUES & LEDGER (RAITHARA SALA BAKI) - TOTAL DUES: Rs. ${reportData.summary.totalOutstandingCredit.toLocaleString('en-IN')}`, 46, currentY + 4);

    currentY += 22;

    doc.rect(40, currentY, 515, 16).fill('#fed7aa');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold');
    doc.text('#', 45, currentY + 4);
    doc.text('Farmer Name (Raitha)', 70, currentY + 4);
    doc.text('Mobile Number', 230, currentY + 4);
    doc.text('Village (Grama)', 350, currentY + 4);
    doc.text('Total Outstanding Due', 440, currentY + 4, { width: 110, align: 'right' });

    currentY += 18;

    if (reportData.creditFarmers.length === 0) {
      doc.rect(40, currentY, 515, 20).fill('#f8fafc');
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold')
        .text('All farmer credit balances are cleared. No outstanding dues! (Yavude sala baki illa).', 50, currentY + 6);
      currentY += 26;
    } else {
      reportData.creditFarmers.forEach((cf, idx) => {
        if (currentY > 720) {
          doc.addPage();
          currentY = 40;
        }

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#fffbeb';
        doc.rect(40, currentY, 515, 16).fill(rowBg);

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica');
        doc.text(`${idx + 1}`, 45, currentY + 4);
        doc.font('Helvetica-Bold').text(cf.farmerName, 70, currentY + 4);
        doc.font('Helvetica').text(cf.phone, 230, currentY + 4);
        doc.text(cf.village, 350, currentY + 4);
        doc.fillColor(alertColor).font('Helvetica-Bold').text(`Rs. ${cf.balance.toLocaleString('en-IN')}`, 440, currentY + 4, { width: 110, align: 'right' });

        currentY += 16;
      });
      currentY += 8;
    }

    // Section 4: Inventory Low Stock Alerts
    if (currentY > 640) {
      doc.addPage();
      currentY = 40;
    }

    doc.rect(40, currentY, 515, 18).fill('#047857');
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
      .text('4. INVENTORY STOCK ALERTS (DASTHANU KADIME IRUVA VIVARA)', 46, currentY + 4);

    currentY += 22;

    doc.rect(40, currentY, 515, 16).fill('#e2e8f0');
    doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold');
    doc.text('Product Name (Uthpanna)', 45, currentY + 4);
    doc.text('SKU / Code', 260, currentY + 4);
    doc.text('Current Stock', 370, currentY + 4);
    doc.text('Minimum Limit', 460, currentY + 4, { width: 90, align: 'right' });

    currentY += 18;

    if (reportData.lowStockItems.length === 0 && (!reportData.zeroStockItems || reportData.zeroStockItems.length === 0)) {
      doc.rect(40, currentY, 515, 20).fill('#f0fdf4');
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold')
        .text('All products are above minimum stock limit. Healthy Inventory! (Ellavu sari ide).', 50, currentY + 6);
      currentY += 26;
    } else {
      reportData.lowStockItems.forEach((item, idx) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 40;
        }

        const itemBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515, 16).fill(itemBg);

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold');
        doc.text(item.name, 45, currentY + 4);
        doc.font('Helvetica').text(item.sku || '-', 260, currentY + 4);
        doc.fillColor(alertColor).font('Helvetica-Bold').text(`${item.quantity} ${item.unit}`, 370, currentY + 4);
        doc.fillColor(grayColor).font('Helvetica').text(`Min: ${item.minimumStock} ${item.unit}`, 460, currentY + 4, { width: 90, align: 'right' });

        currentY += 16;
      });
      currentY += 8;
    }

    // Footer
    const footerY = 780;
    doc.rect(40, footerY, 515, 20).fill('#f1f5f9');
    doc.fillColor(grayColor).fontSize(7.5).font('Helvetica')
      .text('AgroFlow Cloud Platform | Powered by BluNet IT Services | Automated Daily WhatsApp Broadcast', 50, footerY + 6, {
        align: 'center',
        width: 495,
      });

    doc.end();
  });
};

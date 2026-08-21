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
    totalCredit: number;
    totalCount: number;
  };
  salesDetails: Array<{
    invoiceNumber: string;
    farmerName: string;
    farmerPhone: string;
    village: string;
    items: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
    total: number;
    paid: number;
    due: number;
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
}

/**
 * Fetch all report data for a specific shop and date
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

  // 1. Fetch Sales for the day
  const sales = await Sale.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('farmerId', 'name phone village')
    .sort({ createdAt: -1 })
    .lean();

  let totalSales = 0;
  let totalCash = 0;
  let totalCredit = 0;

  const salesDetails = await Promise.all(
    sales.map(async (sale: any) => {
      totalSales += sale.total || 0;
      totalCash += sale.amountPaid || 0;
      totalCredit += sale.amountDue || 0;

      const items = await SaleItem.find({ saleId: sale._id }).lean();

      return {
        invoiceNumber: sale.invoiceNumber || 'INV-' + sale._id.toString().slice(-6),
        farmerName: sale.farmerId?.name || 'Walk-in Customer (Grahakaru)',
        farmerPhone: sale.farmerId?.phone || '-',
        village: sale.farmerId?.village || '-',
        items: items.map((i: any) => ({
          name: i.productName || 'Product',
          qty: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          total: i.total || 0
        })),
        total: sale.total || 0,
        paid: sale.amountPaid || 0,
        due: sale.amountDue || 0,
        paymentMethod: sale.paymentMethod || 'CASH'
      };
    })
  );

  // 2. Fetch all credit accounts with outstanding balances
  const creditAccounts = await CreditAccount.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    balance: { $gt: 0 }
  })
    .populate('farmerId', 'name phone village')
    .sort({ balance: -1 })
    .limit(20)
    .lean();

  const creditFarmers = creditAccounts.map((ca: any) => ({
    farmerName: ca.farmerId?.name || 'Unknown Farmer',
    phone: ca.farmerId?.phone || '-',
    village: ca.farmerId?.village || '-',
    balance: ca.balance || 0
  }));

  // 3. Fetch low stock inventory
  const lowStockItems = await Inventory.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
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
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        name: '$product.name',
        sku: '$product.sku',
        quantity: '$quantity',
        minimumStock: '$product.minimumStock',
        unit: '$product.unit'
      }
    }
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
      totalCredit,
      totalCount: sales.length
    },
    salesDetails,
    creditFarmers,
    lowStockItems
  };
};

/**
 * Generate a PDF Buffer containing the complete bilingual daily sales and credit report
 */
export const generateDailyReportPDF = async (reportData: DailyReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `AgroFlow Daily Report - ${reportData.shopName}`,
        Author: 'AgroFlow Agri-Management',
        Subject: 'Daily Sales & Credit Statement'
      }
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
    doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold')
      .text(reportData.shopName.toUpperCase(), 50, 48);

    doc.fillColor(grayColor).fontSize(9).font('Helvetica')
      .text(`Prop: ${reportData.ownerName} | Mobile: ${reportData.phone} | ${reportData.district}, ${reportData.state}`, 50, 72);

    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold')
      .text(`DATE: ${reportData.dateStr} | GENERATED: ${new Date().toLocaleTimeString('en-IN')}`, 50, 86);

    doc.moveDown(2);

    // Section 1: Bilingual Document Title
    let currentY = 115;
    doc.rect(40, currentY, 515, 24).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text('DAILY BUSINESS & CREDIT SUMMARY (DAINANDINA VYAPARA & SALA VARADI)', 50, currentY + 6);

    currentY += 32;

    // 4 Summary Metrics Cards
    const cardWidth = 120;
    const cardHeight = 50;

    // Card 1: Total Sales
    doc.rect(40, currentY, cardWidth, cardHeight).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica')
      .text('TOTAL SALES (OTTU MARATA)', 46, currentY + 6);
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalSales.toLocaleString('en-IN')}`, 46, currentY + 22);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text(`${reportData.summary.totalCount} Bills Generated`, 46, currentY + 38);

    // Card 2: Cash Collected
    doc.rect(170, currentY, cardWidth, cardHeight).fillAndStroke('#ecfdf5', '#a7f3d0');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica')
      .text('CASH SALES (NAGADU)', 176, currentY + 6);
    doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalCash.toLocaleString('en-IN')}`, 176, currentY + 22);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text('Amount Received', 176, currentY + 38);

    // Card 3: Today's Credit Given
    doc.rect(300, currentY, cardWidth, cardHeight).fillAndStroke('#fff7ed', '#fed7aa');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica')
      .text('CREDIT GIVEN (SALA)', 306, currentY + 6);
    doc.fillColor('#ea580c').fontSize(13).font('Helvetica-Bold')
      .text(`Rs. ${reportData.summary.totalCredit.toLocaleString('en-IN')}`, 306, currentY + 22);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text('Balance Added Today', 306, currentY + 38);

    // Card 4: Overdue Farmers Count
    doc.rect(430, currentY, 125, cardHeight).fillAndStroke('#fef2f2', '#fecaca');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica')
      .text('CREDIT ACCOUNTS', 436, currentY + 6);
    doc.fillColor(alertColor).fontSize(13).font('Helvetica-Bold')
      .text(`${reportData.creditFarmers.length} Farmers`, 436, currentY + 22);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica')
      .text('Pending Settlement', 436, currentY + 38);

    currentY += 62;

    // Section 2: Detailed Sales & Farmer Purchases Breakdown
    doc.rect(40, currentY, 515, 18).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text('1. TODAY\'S FARMER SALES BREAKDOWN (RAITHARA KHAREEDI VIVARA)', 46, currentY + 4);

    currentY += 22;

    // Table Header for Sales
    doc.rect(40, currentY, 515, 16).fill('#e2e8f0');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold');
    doc.text('Invoice', 45, currentY + 4);
    doc.text('Farmer (Raitha)', 115, currentY + 4);
    doc.text('Village', 215, currentY + 4);
    doc.text('Items Purchased (Uthpannagalu)', 285, currentY + 4);
    doc.text('Total', 430, currentY + 4, { width: 40, align: 'right' });
    doc.text('Paid', 475, currentY + 4, { width: 35, align: 'right' });
    doc.text('Credit', 515, currentY + 4, { width: 35, align: 'right' });

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

        const itemsSummary = sale.items.map(i => `${i.name} (${i.qty})`).join(', ') || '-';
        const truncatedItems = itemsSummary.length > 28 ? itemsSummary.slice(0, 26) + '..' : itemsSummary;

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica');
        doc.text(sale.invoiceNumber, 45, currentY + 4);
        doc.font('Helvetica-Bold').text(sale.farmerName, 115, currentY + 4);
        doc.font('Helvetica').text(sale.village, 215, currentY + 4);
        doc.text(truncatedItems, 285, currentY + 4);
        doc.font('Helvetica-Bold').text(`Rs.${sale.total}`, 425, currentY + 4, { width: 45, align: 'right' });
        doc.fillColor(secondaryColor).text(`Rs.${sale.paid}`, 470, currentY + 4, { width: 40, align: 'right' });
        doc.fillColor(sale.due > 0 ? alertColor : grayColor).text(`Rs.${sale.due}`, 510, currentY + 4, { width: 40, align: 'right' });

        currentY += 18;
      });
      currentY += 8;
    }

    // Section 3: Outstanding Credit by Farmers (Who took on credit)
    if (currentY > 640) {
      doc.addPage();
      currentY = 40;
    }

    doc.rect(40, currentY, 515, 18).fill('#7c2d12');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text('2. FARMER CREDIT SUMMARY & DUES (RAITHARA SALA BAKI VIVARA)', 46, currentY + 4);

    currentY += 22;

    doc.rect(40, currentY, 515, 16).fill('#fed7aa');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold');
    doc.text('#', 45, currentY + 4);
    doc.text('Farmer Name (Raithara Hesaru)', 70, currentY + 4);
    doc.text('Mobile Number', 230, currentY + 4);
    doc.text('Village (Grama)', 350, currentY + 4);
    doc.text('Total Outstanding Due (Baki)', 440, currentY + 4, { width: 110, align: 'right' });

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
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text('3. INVENTORY LOW STOCK ALERTS (DASTHANU KADIME IRUVA VIVARA)', 46, currentY + 4);

    currentY += 22;

    doc.rect(40, currentY, 515, 16).fill('#e2e8f0');
    doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold');
    doc.text('Product Name (Uthpanna)', 45, currentY + 4);
    doc.text('SKU / Code', 260, currentY + 4);
    doc.text('Current Stock', 370, currentY + 4);
    doc.text('Minimum Limit', 460, currentY + 4, { width: 90, align: 'right' });

    currentY += 18;

    if (reportData.lowStockItems.length === 0) {
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
        width: 495
      });

    doc.end();
  });
};

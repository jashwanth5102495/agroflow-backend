import { Sale } from '../models/Sale';
import { Inventory } from '../models/Inventory';
import { Shop } from '../models/Shop';
import mongoose from 'mongoose';

// @ts-ignore
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';

// WhatsApp Client Instance
export let wwebClient: any = null;
export let latestQrCode: string | null = null;
let isClientReady = false;

/**
 * Gets the current connection status and QR code string of the WhatsApp client
 */
export const getWhatsAppStatus = () => {
  return {
    status: isClientReady ? 'CONNECTED' : (latestQrCode ? 'QR_READY' : 'DISCONNECTED'),
    qr: latestQrCode,
  };
};

/**
 * Initializes the WhatsApp Web client with QR code generation in terminal
 */
export const initWhatsAppClient = () => {
  console.log('📱 Initializing WhatsApp Web Client...');
  
  wwebClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      handleSIGINT: false,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions'
      ]
    }
  });

  wwebClient.on('qr', (qr: string) => {
    latestQrCode = qr;
    isClientReady = false;
    console.log('\n⚡ ==================================================');
    console.log('⚡ SCAN THE QR CODE BELOW TO LINK SENDER WHATSAPP NUMBER (+91 93475 64390):');
    console.log('⚡ Go to WhatsApp on the sender phone -> Linked Devices -> Link a Device');
    console.log('⚡ ==================================================\n');
    qrcode.generate(qr, { small: true });
  });

  wwebClient.on('ready', () => {
    latestQrCode = null;
    isClientReady = true;
    console.log('\n==================================================');
    console.log('✅ WHATSAPP CLIENT IS AUTHENTICATED AND READY!');
    console.log('👤 Sender Account: +91 93475 64390');
    console.log('==================================================\n');
  });

  wwebClient.on('auth_failure', (msg: any) => {
    latestQrCode = null;
    isClientReady = false;
    console.error('❌ WhatsApp Web authentication failure:', msg);
  });

  wwebClient.on('disconnected', (reason: string) => {
    latestQrCode = null;
    isClientReady = false;
    console.log('❌ WhatsApp Client disconnected. Reason:', reason);
  });

  wwebClient.initialize().catch((err: any) => {
    console.error('❌ Failed to initialize WhatsApp client:', err);
  });
};

/**
 * Generates the daily overview message including total sales, cash/credit split, and inventory alerts
 */
export const generateDailyOverviewMessage = async (shopId: string, dateStr: string) => {
  const shop = await Shop.findById(shopId);
  const shopName = shop ? shop.name : 'AgroFlow Shop';

  // Parse start and end of day in India standard time (GMT+5:30)
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  const salesSummary = await Sale.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = salesSummary[0] || { totalSales: 0, totalPaid: 0, totalDue: 0, count: 0 };

  // Fetch products with low stock (quantity <= minimumStock)
  const lowStockProducts = await Inventory.aggregate([
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
    { $limit: 10 },
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

  // Construct standard report message (Bilingual)
  let message = `*🌾 AgroFlow Daily Overview / ದೈನಂದಿನ ವರದಿ 🌾*\n`;
  message += `📅 *Date (ದಿನಾಂಕ):* ${dateStr}\n`;
  message += `🏪 *Shop (ಅಂಗಡಿ):* ${shopName}\n\n`;
  message += `💰 *SALES SUMMARY / ಮಾರಾಟದ ವಿವರ:*\n`;
  message += `• *Total Sale (ಒಟ್ಟು ಮಾರಾಟ):* ₹${summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  message += `• *Today's Cash (ನಗದು ಮಾರಾಟ):* ₹${summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  message += `• *Today's Credit (ಸಾಲದ ಮಾರಾಟ):* ₹${summary.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  message += `• *Total Invoices (ರಶೀದಿಗಳು):* ${summary.count}\n\n`;

  message += `📦 *INVENTORY STATUS / ದಾಸ್ತಾನು ವಿವರ:*\n`;
  if (lowStockProducts.length === 0) {
    message += `• All active products are above minimum stock levels. ✅\n`;
  } else {
    message += `• ${lowStockProducts.length} product(s) in low stock:\n`;
    lowStockProducts.forEach((item) => {
      message += `  - *${item.name}*: ${item.quantity} ${item.unit} (Min limit: ${item.minimumStock})\n`;
    });
  }

  message += `\n📄 *Attached PDF includes complete itemized farmer bills & credit dues in English & Kannada.*`;

  return message;
};

/**
 * Sends a WhatsApp message with optional PDF attachment.
 */
export const sendWhatsAppMessage = async (
  to: string,
  message: string,
  pdfBuffer?: Buffer,
  pdfFileName?: string
) => {
  const senderNumber = '+91 9347564390';
  let cleanNumber = to.replace(/[^\d]/g, '');
  
  // Format to standard WhatsApp format (India by default if 10 digits)
  if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }

  if (isClientReady && wwebClient) {
    try {
      const chatId = `${cleanNumber}@c.us`;
      if (pdfBuffer && pdfBuffer.length > 0) {
        const media = new MessageMedia(
          'application/pdf',
          pdfBuffer.toString('base64'),
          pdfFileName || 'AgroFlow_Daily_Report.pdf'
        );
        await wwebClient.sendMessage(chatId, media, { caption: message });
      } else {
        await wwebClient.sendMessage(chatId, message);
      }
      console.log(`[WhatsApp Service] Message & PDF successfully sent from ${senderNumber} to recipient ${cleanNumber}.`);
      return { success: true, sender: senderNumber, receiver: cleanNumber, hasPdf: !!pdfBuffer };
    } catch (error) {
      console.error(`[WhatsApp Service] Error sending message to ${cleanNumber} via Web client:`, error);
    }
  }

  // Fallback to mock log
  console.log(`\n==================================================`);
  console.log(`📱 WHATSAPP MESSAGE LOG (MOCK FALLBACK)`);
  console.log(`👤 Sender: ${senderNumber} (Requires QR Scan to send real message)`);
  console.log(`👤 Recipient: ${cleanNumber}`);
  console.log(`📎 PDF Attachment: ${pdfFileName || (pdfBuffer ? 'Attached PDF Document' : 'None')}`);
  console.log(`✉️ Message:\n${message}`);
  console.log(`==================================================\n`);

  return { success: true, sender: senderNumber, receiver: cleanNumber, mocked: true, hasPdf: !!pdfBuffer };
};

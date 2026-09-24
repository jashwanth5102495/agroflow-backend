import { Sale } from '../models/Sale';
import { Inventory } from '../models/Inventory';
import { Shop } from '../models/Shop';
import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Gets the current Telegram Bot status
 */
export const getTelegramStatus = () => {
  const tokenConfigured = Boolean(env.TELEGRAM_BOT_TOKEN);
  return {
    status: tokenConfigured ? 'READY' : 'MOCK_MODE',
    botTokenSet: tokenConfigured,
    message: tokenConfigured
      ? 'Telegram Bot is configured and ready to send notifications.'
      : 'TELEGRAM_BOT_TOKEN is not set. System will run in Mock Mode (logging messages to console).',
  };
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

  // Construct standard report message for Telegram
  let message = `🌾 *AgroFlow Daily Overview / ದೈನಂದಿನ ವರದಿ* 🌾\n`;
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
 * Sends a Telegram message with optional PDF attachment via Telegram Bot API
 */
export const sendTelegramMessage = async (
  chatId: string,
  message: string,
  pdfBuffer?: Buffer,
  pdfFileName?: string
) => {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const cleanChatId = chatId.trim();

  const customFetch = (globalThis as any).fetch;
  const CustomFormData = (globalThis as any).FormData;
  const CustomBlob = (globalThis as any).Blob;

  if (botToken && cleanChatId && customFetch) {
    try {
      if (pdfBuffer && pdfBuffer.length > 0 && CustomFormData && CustomBlob) {
        // Send document with caption
        const docUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
        const formData = new CustomFormData();
        formData.append('chat_id', cleanChatId);
        formData.append('caption', message.substring(0, 1000));
        formData.append('parse_mode', 'Markdown');
        
        const blob = new CustomBlob([pdfBuffer], { type: 'application/pdf' });
        formData.append('document', blob, pdfFileName || 'AgroFlow_Daily_Report.pdf');

        const response = await customFetch(docUrl, {
          method: 'POST',
          body: formData,
        });

        const resData = await response.json();
        if (response.ok && resData.ok) {
          console.log(`[Telegram Service] PDF & Message sent successfully to Chat ID: ${cleanChatId}`);
          return { success: true, receiver: cleanChatId, hasPdf: true };
        } else {
          console.error(`[Telegram Service] Telegram API Error:`, resData);
        }
      } else {
        // Send text message
        const msgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await customFetch(msgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });

        const resData = await response.json();
        if (response.ok && resData.ok) {
          console.log(`[Telegram Service] Message sent successfully to Chat ID: ${cleanChatId}`);
          return { success: true, receiver: cleanChatId, hasPdf: false };
        } else {
          console.error(`[Telegram Service] Telegram API Error:`, resData);
        }
      }
    } catch (error: any) {
      console.error(`[Telegram Service] Exception sending Telegram message:`, error?.message || error);
    }
  }

  // Fallback / Mock log when TELEGRAM_BOT_TOKEN is not configured or fails
  console.log(`\n==================================================`);
  console.log(`✈️ TELEGRAM MESSAGE LOG (MOCK FALLBACK)`);
  console.log(`👤 Target Chat ID: ${cleanChatId}`);
  console.log(`📎 PDF Attachment: ${pdfFileName || (pdfBuffer ? 'Attached PDF Document' : 'None')}`);
  console.log(`✉️ Message:\n${message}`);
  console.log(`==================================================\n`);

  return { success: true, receiver: cleanChatId, mocked: true, hasPdf: !!pdfBuffer };
};

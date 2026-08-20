"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = exports.generateDailyOverviewMessage = exports.initWhatsAppClient = exports.getWhatsAppStatus = exports.latestQrCode = exports.wwebClient = void 0;
const Sale_1 = require("../models/Sale");
const Inventory_1 = require("../models/Inventory");
const Shop_1 = require("../models/Shop");
const mongoose_1 = __importDefault(require("mongoose"));
// @ts-ignore
const whatsapp_web_js_1 = require("whatsapp-web.js");
// @ts-ignore
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
// WhatsApp Client Instance
exports.wwebClient = null;
exports.latestQrCode = null;
let isClientReady = false;
/**
 * Gets the current connection status and QR code string of the WhatsApp client
 */
const getWhatsAppStatus = () => {
    return {
        status: isClientReady ? 'CONNECTED' : (exports.latestQrCode ? 'QR_READY' : 'DISCONNECTED'),
        qr: exports.latestQrCode,
    };
};
exports.getWhatsAppStatus = getWhatsAppStatus;
/**
 * Initializes the WhatsApp Web client with QR code generation in terminal
 */
const initWhatsAppClient = () => {
    console.log('📱 Initializing WhatsApp Web Client...');
    exports.wwebClient = new whatsapp_web_js_1.Client({
        authStrategy: new whatsapp_web_js_1.LocalAuth({
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
    exports.wwebClient.on('qr', (qr) => {
        exports.latestQrCode = qr;
        isClientReady = false;
        console.log('\n⚡ ==================================================');
        console.log('⚡ SCAN THE QR CODE BELOW TO LINK SENDER WHATSAPP NUMBER (+91 93475 64390):');
        console.log('⚡ Go to WhatsApp on the sender phone -> Linked Devices -> Link a Device');
        console.log('⚡ ==================================================\n');
        qrcode_terminal_1.default.generate(qr, { small: true });
    });
    exports.wwebClient.on('ready', () => {
        exports.latestQrCode = null;
        isClientReady = true;
        console.log('\n==================================================');
        console.log('✅ WHATSAPP CLIENT IS AUTHENTICATED AND READY!');
        console.log('👤 Sender Account: +91 93475 64390');
        console.log('==================================================\n');
    });
    exports.wwebClient.on('auth_failure', (msg) => {
        exports.latestQrCode = null;
        isClientReady = false;
        console.error('❌ WhatsApp Web authentication failure:', msg);
    });
    exports.wwebClient.on('disconnected', (reason) => {
        exports.latestQrCode = null;
        isClientReady = false;
        console.log('❌ WhatsApp Client disconnected. Reason:', reason);
    });
    exports.wwebClient.initialize().catch((err) => {
        console.error('❌ Failed to initialize WhatsApp client:', err);
    });
};
exports.initWhatsAppClient = initWhatsAppClient;
/**
 * Generates the daily overview message including total sales, cash/credit split, and inventory alerts
 */
const generateDailyOverviewMessage = async (shopId, dateStr) => {
    const shop = await Shop_1.Shop.findById(shopId);
    const shopName = shop ? shop.name : 'AgroFlow Shop';
    // Parse start and end of day in India standard time (GMT+5:30)
    const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);
    const salesSummary = await Sale_1.Sale.aggregate([
        {
            $match: {
                shopId: new mongoose_1.default.Types.ObjectId(shopId),
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
    const lowStockProducts = await Inventory_1.Inventory.aggregate([
        { $match: { shopId: new mongoose_1.default.Types.ObjectId(shopId) } },
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
    // Construct standard report message
    let message = `*🌾 AgroFlow Daily Overview 🌾*\n`;
    message += `📅 *Date:* ${dateStr}\n`;
    message += `🏪 *Shop:* ${shopName}\n\n`;
    message += `💰 *SALES SUMMARY:*\n`;
    message += `• *Total Sale:* ₹${summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    message += `• *Today's Total Cash Sale:* ₹${summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    message += `• *Today's Total Credit Sale:* ₹${summary.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
    message += `📦 *INVENTORY STATUS:*\n`;
    if (lowStockProducts.length === 0) {
        message += `• All active products are above minimum stock levels. ✅\n`;
    }
    else {
        message += `• ${lowStockProducts.length} low stock product(s) require attention:\n`;
        lowStockProducts.forEach((item) => {
            message += `  - *${item.name}*: ${item.quantity} ${item.unit} (Min limit: ${item.minimumStock})\n`;
        });
    }
    return message;
};
exports.generateDailyOverviewMessage = generateDailyOverviewMessage;
/**
 * Sends a WhatsApp message from the authenticated client.
 * Falls back to mock console output if client is not authenticated.
 */
const sendWhatsAppMessage = async (to, message) => {
    const senderNumber = '+91 9347564390';
    let cleanNumber = to.replace(/[^\d]/g, '');
    // Format to standard WhatsApp format (India by default if 10 digits)
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }
    if (isClientReady && exports.wwebClient) {
        try {
            const chatId = `${cleanNumber}@c.us`;
            await exports.wwebClient.sendMessage(chatId, message);
            console.log(`[WhatsApp Service] Message successfully sent from ${senderNumber} to recipient ${cleanNumber}.`);
            return { success: true, sender: senderNumber, receiver: cleanNumber };
        }
        catch (error) {
            console.error(`[WhatsApp Service] Error sending message to ${cleanNumber} via Web client:`, error);
        }
    }
    // Fallback to mock log
    console.log(`\n==================================================`);
    console.log(`📱 WHATSAPP MESSAGE LOG (MOCK FALLBACK)`);
    console.log(`👤 Sender: ${senderNumber} (Requires QR Scan to send real message)`);
    console.log(`👤 Recipient: ${cleanNumber}`);
    console.log(`✉️ Message:\n${message}`);
    console.log(`==================================================\n`);
    return { success: true, sender: senderNumber, receiver: cleanNumber, mocked: true };
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
//# sourceMappingURL=whatsapp.service.js.map
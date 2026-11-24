import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import { Sale, PaymentMethod } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';
import { Shop } from '../models/Shop';
import { NotificationConfig } from '../models/NotificationConfig';
import { fetchDailyReportData, generateDailyReportPDF } from './pdfReport.service';

export type WhatsAppStatus = 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED';

interface WhatsAppSession {
  socket?: WASocket;
  status: WhatsAppStatus;
  qrCode?: string; // base64 data URL
  connectedNumber?: string;
  reconnectAttempts: number;
  qrWaiters: Array<(qr: string) => void>;
  sessionDir: string;
}

const sessions = new Map<string, WhatsAppSession>();

/**
 * Cloud-Safe Session Storage Directory
 * Checks write permission in process.cwd()/whatsapp_sessions.
 * Falls back to os.tmpdir()/whatsapp_sessions for read-only cloud hosts (Railway, Render, AWS ECS).
 */
export const getSessionsBaseDir = (): string => {
  const preferredDir = path.join(process.cwd(), 'whatsapp_sessions');
  try {
    if (!fs.existsSync(preferredDir)) {
      fs.mkdirSync(preferredDir, { recursive: true });
    }
    const testFile = path.join(preferredDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return preferredDir;
  } catch (err) {
    // Cloud container fallback: tmpdir is always writable
    const tmpDir = path.join(os.tmpdir(), 'whatsapp_sessions');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
};

/**
 * Initializes or retrieves the Baileys WebSocket connection for a given shop/tenant
 */
export const initWhatsAppSocket = async (tenantId: string): Promise<WhatsAppSession> => {
  const existing = sessions.get(tenantId);
  if (existing?.socket && existing.status === 'CONNECTED') {
    return existing;
  }

  const baseDir = getSessionsBaseDir();
  const sessionDir = path.join(baseDir, `session_${tenantId}`);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sessionObj: WhatsAppSession = existing || {
    status: 'CONNECTING',
    reconnectAttempts: 0,
    qrWaiters: [],
    sessionDir,
  };

  sessionObj.sessionDir = sessionDir;
  sessionObj.status = 'CONNECTING';
  sessions.set(tenantId, sessionObj);

  try {
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['AgroFlow', 'Chrome', '1.0.0'],
      printQRInTerminal: false,
      syncFullHistory: false,
    });

    sessionObj.socket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. QR Challenge Emitted
      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, width: 280 });
          sessionObj.qrCode = qrDataUrl;
          sessionObj.status = 'SCAN_QR';

          // Notify any pending requestQrCode promise waiters
          while (sessionObj.qrWaiters.length > 0) {
            const waiter = sessionObj.qrWaiters.shift();
            if (waiter) waiter(qrDataUrl);
          }
        } catch (qrErr) {
          console.error(`[WhatsApp ${tenantId}] QR Generation Error:`, qrErr);
        }
      }

      // 2. Connection Opened
      if (connection === 'open') {
        sessionObj.status = 'CONNECTED';
        sessionObj.qrCode = undefined;
        sessionObj.reconnectAttempts = 0;
        const rawUser = sock.user?.id || '';
        const phone = rawUser.split(':')[0]?.split('@')[0] || '';
        sessionObj.connectedNumber = phone;
        console.log(`✅ [WhatsApp ${tenantId}] Device linked successfully! Connected as +${phone}`);

        // Persist connected number to shop config
        try {
          await NotificationConfig.findOneAndUpdate(
            { shopId: new mongoose.Types.ObjectId(tenantId) },
            { $set: { whatsappConnectedNumber: phone } }
          );
        } catch (dbErr) {
          console.error(`[WhatsApp ${tenantId}] Could not update NotificationConfig:`, dbErr);
        }
      }

      // 3. Connection Closed
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`⚠️ [WhatsApp ${tenantId}] Connection closed. StatusCode: ${statusCode}. LoggedOut: ${isLoggedOut}`);

        if (!isLoggedOut) {
          // Reconnect with exponential backoff (up to 5 attempts)
          if (sessionObj.reconnectAttempts < 5) {
            sessionObj.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, sessionObj.reconnectAttempts), 15000);
            console.log(`[WhatsApp ${tenantId}] Reconnecting in ${delay}ms (Attempt ${sessionObj.reconnectAttempts}/5)...`);
            setTimeout(() => {
              initWhatsAppSocket(tenantId).catch(console.error);
            }, delay);
          } else {
            sessionObj.status = 'DISCONNECTED';
          }
        } else {
          // Explicit logout from user's phone -> wipe session folder
          console.log(`🗑️ [WhatsApp ${tenantId}] Device unlinked from WhatsApp app. Clearing session.`);
          sessionObj.status = 'DISCONNECTED';
          sessionObj.socket = undefined;
          sessionObj.qrCode = undefined;
          sessionObj.connectedNumber = undefined;
          try {
            if (fs.existsSync(sessionDir)) {
              fs.rmSync(sessionDir, { recursive: true, force: true });
            }
            await NotificationConfig.findOneAndUpdate(
              { shopId: new mongoose.Types.ObjectId(tenantId) },
              { $unset: { whatsappConnectedNumber: 1 } }
            );
          } catch (rmErr) {
            console.error(`[WhatsApp ${tenantId}] Error clearing session directory:`, rmErr);
          }
        }
      }
    });

    return sessionObj;
  } catch (err: any) {
    console.error(`[WhatsApp ${tenantId}] Socket Initialization Error:`, err?.message || err);
    sessionObj.status = 'DISCONNECTED';
    return sessionObj;
  }
};

/**
 * Requests or refreshes the QR code synchronously
 * Awaits up to 7.5 seconds for WhatsApp WebSockets to emit the initial challenge
 */
export const requestQrCode = async (
  tenantId: string
): Promise<{ status: WhatsAppStatus; qrCode?: string; connectedNumber?: string }> => {
  let session = sessions.get(tenantId);

  // If already connected, return active state
  if (session?.status === 'CONNECTED' && session.socket) {
    return {
      status: 'CONNECTED',
      connectedNumber: session.connectedNumber,
    };
  }

  // If valid QR already ready
  if (session?.status === 'SCAN_QR' && session.qrCode) {
    return {
      status: 'SCAN_QR',
      qrCode: session.qrCode,
    };
  }

  // Initialize socket
  session = await initWhatsAppSocket(tenantId);

  return new Promise((resolve) => {
    if (session!.status === 'CONNECTED') {
      return resolve({ status: 'CONNECTED', connectedNumber: session!.connectedNumber });
    }
    if (session!.status === 'SCAN_QR' && session!.qrCode) {
      return resolve({ status: 'SCAN_QR', qrCode: session!.qrCode });
    }

    const timer = setTimeout(() => {
      const current = sessions.get(tenantId);
      resolve({
        status: current?.status || 'CONNECTING',
        qrCode: current?.qrCode,
        connectedNumber: current?.connectedNumber,
      });
    }, 7500);

    session!.qrWaiters.push((qr) => {
      clearTimeout(timer);
      resolve({
        status: 'SCAN_QR',
        qrCode: qr,
      });
    });
  });
};

/**
 * Returns current status of WhatsApp connection for a shop
 */
export const getWhatsAppStatus = (
  tenantId: string
): { status: WhatsAppStatus; qrCode?: string; connectedNumber?: string } => {
  const session = sessions.get(tenantId);
  if (!session) {
    const baseDir = getSessionsBaseDir();
    const sessionDir = path.join(baseDir, `session_${tenantId}`);
    const hasCreds = fs.existsSync(path.join(sessionDir, 'creds.json'));
    return {
      status: hasCreds ? 'CONNECTING' : 'DISCONNECTED',
    };
  }

  return {
    status: session.status,
    qrCode: session.qrCode,
    connectedNumber: session.connectedNumber,
  };
};

/**
 * Disconnects socket and clears session folder
 */
export const disconnectWhatsApp = async (tenantId: string): Promise<void> => {
  const session = sessions.get(tenantId);
  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch (e) {
      try {
        session.socket.end(undefined);
      } catch (err) {}
    }
  }

  const baseDir = getSessionsBaseDir();
  const sessionDir = path.join(baseDir, `session_${tenantId}`);
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    await NotificationConfig.findOneAndUpdate(
      { shopId: new mongoose.Types.ObjectId(tenantId) },
      { $unset: { whatsappConnectedNumber: 1 } }
    );
  } catch (err) {
    console.error(`[WhatsApp ${tenantId}] Error deleting session folder:`, err);
  }

  sessions.delete(tenantId);
};

/**
 * Dispatches text and optional document/PDF via WhatsApp Web multi-device
 */
export const sendWhatsAppMessage = async (
  tenantId: string,
  toPhone: string,
  textMessage: string,
  attachment?: {
    buffer?: Buffer;
    path?: string;
    fileName?: string;
    mimetype?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    let session = sessions.get(tenantId);

    // If socket is not active, try to initialize if credentials exist
    if (!session?.socket || session.status !== 'CONNECTED') {
      session = await initWhatsAppSocket(tenantId);
      let waited = 0;
      while (waited < 5000 && session.status !== 'CONNECTED') {
        await new Promise((r) => setTimeout(r, 500));
        waited += 500;
      }
    }

    if (!session?.socket || session.status !== 'CONNECTED') {
      throw new Error('WhatsApp device is not linked. Please scan QR code in Settings.');
    }

    const digits = toPhone.replace(/\D/g, '');
    if (!digits) {
      throw new Error('Invalid recipient phone number.');
    }

    // Default to country code 91 for 10-digit Indian numbers
    const cleanPhone = digits.length === 10 ? `91${digits}` : digits;
    const jid = `${cleanPhone}@s.whatsapp.net`;

    const docBuffer = attachment?.buffer || (attachment?.path ? fs.readFileSync(attachment.path) : undefined);

    let sentMsg;
    if (docBuffer) {
      sentMsg = await session.socket.sendMessage(jid, {
        document: docBuffer,
        mimetype: attachment?.mimetype || 'application/pdf',
        fileName: attachment?.fileName || 'AgroFlow_Report.pdf',
        caption: textMessage,
      });
    } else {
      sentMsg = await session.socket.sendMessage(jid, {
        text: textMessage,
      });
    }

    return {
      success: true,
      messageId: sentMsg?.key?.id || undefined,
    };
  } catch (err: any) {
    console.error(`[WhatsApp ${tenantId}] Dispatch Error:`, err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch WhatsApp message',
    };
  }
};

/**
 * Generates an aggregated shift or daily summary with financial breakdown,
 * order metrics, inventory movements, and attached branded PDF.
 */
export const generateShiftReport = async (
  shopId: string,
  shiftType: 'shift1' | 'shift2' | 'daily',
  targetDate?: string
) => {
  const shop = await Shop.findById(shopId);
  const shopName = shop ? shop.name : 'AgroFlow Store';

  const now = new Date();
  const dateStr = targetDate || now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  let startTime: Date;
  let endTime: Date;
  let shiftTitle = '';

  if (shiftType === 'shift1') {
    // Day Shift: 10:00 AM to 23:30 PM
    startTime = new Date(`${dateStr}T10:00:00+05:30`);
    endTime = new Date(`${dateStr}T23:30:00+05:30`);
    shiftTitle = '☀️ Shift 1 Report (Day / ದಿನದ ಪಾಳಿ)';
  } else if (shiftType === 'shift2') {
    // Overnight Shift: 23:31 PM of previous day to 09:59 AM of current day
    const prevDate = new Date(new Date(`${dateStr}T00:00:00+05:30`).getTime() - 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    startTime = new Date(`${prevDate}T23:31:00+05:30`);
    endTime = new Date(`${dateStr}T09:59:59+05:30`);
    shiftTitle = '🌙 Shift 2 Report (Overnight / ರಾತ್ರಿ ಪಾಳಿ)';
  } else {
    // Full Daily: 00:00 to 23:59:59
    startTime = new Date(`${dateStr}T00:00:00+05:30`);
    endTime = new Date(`${dateStr}T23:59:59.999+05:30`);
    shiftTitle = '🌾 Daily Business Overview / ದೈನಂದಿನ ವರದಿ';
  }

  // 1. Fetch Sales during window
  const sales = await Sale.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    createdAt: { $gte: startTime, $lte: endTime },
  }).lean();

  let totalGrossSales = 0;
  let totalDiscounts = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let cardTotal = 0;
  let creditTotal = 0;
  let bankTransferTotal = 0;

  for (const s of sales) {
    totalGrossSales += s.total || 0;
    totalDiscounts += s.discount || 0;

    const method = s.paymentMethod;
    const paid = s.amountPaid || 0;
    const due = s.amountDue || 0;

    creditTotal += due;

    if (method === PaymentMethod.UPI) {
      upiTotal += paid;
    } else if (method === PaymentMethod.CARD) {
      cardTotal += paid;
    } else if (method === PaymentMethod.BANK_TRANSFER) {
      bankTransferTotal += paid;
    } else {
      cashTotal += paid;
    }
  }

  const completedOrders = sales.length;
  const netSales = Math.max(0, totalGrossSales - totalDiscounts);
  const avgTicketSize = completedOrders > 0 ? totalGrossSales / completedOrders : 0;

  // 2. Fetch Inventory Stock Activity during shift
  const stockTransactions = await InventoryTransaction.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    createdAt: { $gte: startTime, $lte: endTime },
  }).populate('productId', 'name sku unit').lean();

  const movedItemsMap = new Map<string, {
    name: string;
    unit: string;
    soldQty: number;
    restockedQty: number;
    closingQty: number;
  }>();

  for (const tx of stockTransactions) {
    const prod = tx.productId as any;
    if (!prod?._id) continue;
    const pId = prod._id.toString();

    if (!movedItemsMap.has(pId)) {
      movedItemsMap.set(pId, {
        name: prod.name || 'Item',
        unit: prod.unit || 'pcs',
        soldQty: 0,
        restockedQty: 0,
        closingQty: tx.newQuantity || 0,
      });
    }

    const item = movedItemsMap.get(pId)!;
    if (tx.type === TransactionType.SALE) {
      item.soldQty += Math.abs(tx.quantity);
    } else if (tx.type === TransactionType.PURCHASE || (tx.type === TransactionType.ADJUSTMENT && tx.quantity > 0)) {
      item.restockedQty += Math.abs(tx.quantity);
    }
  }

  // 3. Zero-stock & Low-stock Alerts
  const zeroStockItems = await Inventory.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId), quantity: { $lte: 0 } } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $limit: 8 },
    { $project: { name: '$p.name', unit: '$p.unit' } },
  ]);

  const lowStockItems = await Inventory.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId), quantity: { $gt: 0 } } },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $match: { $expr: { $lte: ['$quantity', '$p.minimumStock'] } } },
    { $limit: 8 },
    { $project: { name: '$p.name', quantity: '$quantity', unit: '$p.unit', min: '$p.minimumStock' } },
  ]);

  // Construct Formatted WhatsApp Message
  let text = `*${shiftTitle}*\n`;
  text += `🏪 *Store:* ${shopName}\n`;
  text += `📅 *Date:* ${dateStr}\n`;
  text += `⏱️ *Window:* ${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n`;

  text += `📊 *FINANCIAL SUMMARY:*\n`;
  text += `• *Total Gross Revenue:* ₹${totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
  text += `• *Net Sales:* ₹${netSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
  text += `• *Invoices Completed:* ${completedOrders}\n`;
  text += `• *Avg Bill Value:* ₹${avgTicketSize.toFixed(2)}\n\n`;

  text += `💳 *PAYMENT BREAKDOWN:*\n`;
  text += `• 💵 *Cash:* ₹${cashTotal.toLocaleString('en-IN')}\n`;
  if (upiTotal > 0) text += `• 📱 *UPI:* ₹${upiTotal.toLocaleString('en-IN')}\n`;
  if (cardTotal > 0) text += `• 💳 *Card:* ₹${cardTotal.toLocaleString('en-IN')}\n`;
  if (bankTransferTotal > 0) text += `• 🏦 *Bank Transfer:* ₹${bankTransferTotal.toLocaleString('en-IN')}\n`;
  text += `• 📝 *Credit Due (Udhar):* ₹${creditTotal.toLocaleString('en-IN')}\n\n`;

  // Inventory movements
  if (movedItemsMap.size > 0) {
    text += `📦 *STOCK MOVEMENTS (${movedItemsMap.size} items):*\n`;
    const movedItems = Array.from(movedItemsMap.values()).slice(0, 8);
    movedItems.forEach((it) => {
      text += `• *${it.name}:* Sold ${it.soldQty} ${it.unit} | Closing: ${it.closingQty} ${it.unit}\n`;
    });
    if (movedItemsMap.size > 8) {
      text += `  _...and ${movedItemsMap.size - 8} more in attached PDF_\n`;
    }
    text += `\n`;
  }

  // Stock alerts
  if (zeroStockItems.length > 0) {
    text += `🚨 *OUT OF STOCK ALERTS (${zeroStockItems.length}):*\n`;
    zeroStockItems.forEach((it) => {
      text += `• ❌ ${it.name} (0 ${it.unit})\n`;
    });
    text += `\n`;
  }

  if (lowStockItems.length > 0) {
    text += `⚠️ *LOW STOCK ALERTS:*\n`;
    lowStockItems.forEach((it) => {
      text += `• ⚠️ ${it.name}: ${it.quantity} ${it.unit} (Alert at ${it.min})\n`;
    });
    text += `\n`;
  }

  text += `📄 _Attached PDF contains complete itemized farmer billing, payments, and full audit ledger._`;

  // Generate Branded PDF
  let pdfBuffer: Buffer | undefined;
  let fileName = `AgroFlow_${shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${shiftType}_${dateStr}.pdf`;
  try {
    const reportData = await fetchDailyReportData(shopId, dateStr);
    pdfBuffer = await generateDailyReportPDF(reportData);
  } catch (pdfErr) {
    console.error(`[WhatsApp ${shopId}] PDF generation error:`, pdfErr);
  }

  return {
    message: text,
    pdfBuffer,
    fileName,
    totalGrossSales,
    completedOrders,
  };
};

/**
 * Auto-initializes stored sessions on server boot
 */
export const autoResumeStoredSessions = async (): Promise<void> => {
  try {
    const baseDir = getSessionsBaseDir();
    if (!fs.existsSync(baseDir)) return;

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('session_')) {
        const tenantId = entry.name.replace('session_', '');
        const credsFile = path.join(baseDir, entry.name, 'creds.json');
        if (fs.existsSync(credsFile)) {
          console.log(`🔄 [WhatsApp Auto-Resume] Found saved session for tenant ${tenantId}. Resuming...`);
          initWhatsAppSocket(tenantId).catch((err) => {
            console.warn(`[WhatsApp Auto-Resume] Failed to resume session ${tenantId}:`, err?.message || err);
          });
        }
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Auto-Resume] Error inspecting stored sessions:', err);
  }
};

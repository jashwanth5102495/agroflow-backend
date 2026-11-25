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
      // 1. Send the comprehensive formatted text summary message first
      sentMsg = await session.socket.sendMessage(jid, {
        text: textMessage,
      });

      // 2. Attach the branded PDF audit statement directly below it
      try {
        await session.socket.sendMessage(jid, {
          document: docBuffer,
          mimetype: attachment?.mimetype || 'application/pdf',
          fileName: attachment?.fileName || 'AgroFlow_Daily_Report.pdf',
          caption: `📄 Daily Business & Profit Audit Statement (${attachment?.fileName || 'Report.pdf'})`,
        });
      } catch (docErr) {
        console.warn(`[WhatsApp ${tenantId}] Document attachment dispatch warning:`, docErr);
      }
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
 * Generates an aggregated daily business and profit summary with financial breakdown,
 * item-by-item profit calculations, farmer credit ledger, stock activity, and attached branded PDF.
 */
export const generateDailyReport = async (
  shopId: string,
  targetDate?: string,
  shiftType: string = 'daily'
) => {
  const now = new Date();
  const dateStr = targetDate || now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // 1. Fetch complete report data with accurate profits, COGS, sales, and credit
  const reportData = await fetchDailyReportData(shopId, dateStr);
  const shopName = reportData.shopName || 'AgroFlow Store';

  // 2. Fetch Inventory Stock Activity during the day
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  const stockTransactions = await InventoryTransaction.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    createdAt: { $gte: startOfDay, $lte: endOfDay },
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
        name: (prod.name || 'Item').toUpperCase(),
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

  const {
    totalSales,
    totalCash,
    totalUpi,
    totalCard,
    totalCredit,
    totalCollected,
    totalCogs,
    totalProfit,
    profitMargin,
    totalCount: completedOrders,
    totalOutstandingCredit,
  } = reportData.summary;

  const avgTicketSize = completedOrders > 0 ? totalSales / completedOrders : 0;

  // 3. Construct Formatted WhatsApp Message (Bilingual English + Kannada)
  let text = `*🌾 AgroFlow Daily Business & Profit Report*\n`;
  text += `*(ದೈನಂದಿನ ವ್ಯಾಪಾರ ಮತ್ತು ಲಾಭದ ವರದಿ)*\n\n`;
  text += `🏪 *Store:* ${shopName}\n`;
  if (reportData.ownerName) text += `👤 *Proprietor:* ${reportData.ownerName}\n`;
  text += `📅 *Date:* ${dateStr}\n`;
  text += `⏱️ *Window:* 00:00 – 23:59 (Full Day)\n\n`;

  text += `💰 *FINANCIAL & PROFIT SUMMARY (ಆರ್ಥಿಕ & ಲಾಭದ ಸಾರಾಂಶ):*\n`;
  text += `• *Total Sales (ಒಟ್ಟು ಮಾರಾಟ):* ₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
  text += `• *Purchase Cost (ಖರೀದಿ ವೆಚ್ಚ / COGS):* ₹${totalCogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
  text += `• *Gross Profit (ಒಟ್ಟು ನಿವ್ವಳ ಲಾಭ):* ₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${profitMargin.toFixed(1)}% margin)\n`;
  text += `• *Invoices Completed (ಒಟ್ಟು ಬಿಲ್ಲುಗಳು):* ${completedOrders}\n`;
  text += `• *Avg Bill Value:* ₹${avgTicketSize.toFixed(2)}\n\n`;

  text += `💳 *COLLECTIONS & CREDIT BREAKDOWN (ನಗದು & ಸಾಲದ ವಿವರ):*\n`;
  text += `• 💵 *Cash Collected (ನಗದು):* ₹${totalCash.toLocaleString('en-IN')}\n`;
  if (totalUpi > 0) text += `• 📱 *UPI / Online:* ₹${totalUpi.toLocaleString('en-IN')}\n`;
  if (totalCard > 0) text += `• 💳 *Card / Bank:* ₹${totalCard.toLocaleString('en-IN')}\n`;
  text += `• 📥 *Total Collected in Hand (ಒಟ್ಟು ನಗದು):* ₹${totalCollected.toLocaleString('en-IN')}\n`;
  text += `• 📝 *Credit Given Today (ಇಂದಿನ ಸಾಲ):* ₹${totalCredit.toLocaleString('en-IN')}\n\n`;

  // Credit Ledger
  text += `👥 *FARMER CREDIT LEDGER (ರೈತರ ಸಾಲದ ಬಾಕಿ):*\n`;
  text += `• *Pending Credit Accounts:* ${reportData.creditFarmers.length} farmers\n`;
  text += `• *Total Outstanding Balance (ಒಟ್ಟು ಬಾಕಿ):* ₹${totalOutstandingCredit.toLocaleString('en-IN')}\n`;
  if (reportData.creditFarmers.length > 0) {
    const topDues = reportData.creditFarmers.slice(0, 5);
    topDues.forEach((f) => {
      text += `  - ${f.farmerName}: ₹${f.balance.toLocaleString('en-IN')}\n`;
    });
    if (reportData.creditFarmers.length > 5) {
      text += `  _...and ${reportData.creditFarmers.length - 5} more in attached PDF_\n`;
    }
  }
  text += `\n`;

  // Top products profit analysis
  if (reportData.topSoldProducts && reportData.topSoldProducts.length > 0) {
    text += `📈 *TOP PRODUCTS SOLD & PROFIT:*\n`;
    reportData.topSoldProducts.slice(0, 5).forEach((p) => {
      text += `• *${p.name}* (Qty: ${p.qty}) -> Revenue: ₹${p.revenue.toLocaleString('en-IN')} | Profit: +₹${p.profit.toLocaleString('en-IN')}\n`;
    });
    text += `\n`;
  }

  // Inventory movements
  if (movedItemsMap.size > 0) {
    text += `📦 *STOCK MOVEMENTS (${movedItemsMap.size} products):*\n`;
    const movedItems = Array.from(movedItemsMap.values()).slice(0, 6);
    movedItems.forEach((it) => {
      text += `• *${it.name}:* Sold ${it.soldQty} ${it.unit} | Closing: ${it.closingQty} ${it.unit}\n`;
    });
    if (movedItemsMap.size > 6) {
      text += `  _...and ${movedItemsMap.size - 6} more in attached PDF_\n`;
    }
    text += `\n`;
  }

  // Stock alerts
  if (reportData.zeroStockItems && reportData.zeroStockItems.length > 0) {
    text += `🚨 *OUT OF STOCK ALERTS (${reportData.zeroStockItems.length}):*\n`;
    reportData.zeroStockItems.slice(0, 6).forEach((it) => {
      text += `• ❌ ${it.name} (0 ${it.unit})\n`;
    });
    text += `\n`;
  }

  if (reportData.lowStockItems && reportData.lowStockItems.length > 0) {
    text += `⚠️ *LOW STOCK ALERTS (${reportData.lowStockItems.length}):*\n`;
    reportData.lowStockItems.slice(0, 6).forEach((it) => {
      text += `• ⚠️ ${it.name}: ${it.quantity} ${it.unit} (Min limit: ${it.minimumStock})\n`;
    });
    text += `\n`;
  }

  text += `📄 _Attached PDF contains complete itemized farmer billing, profit breakdown, and full audit ledger._`;

  // Generate Branded PDF
  let pdfBuffer: Buffer | undefined;
  const fileName = `AgroFlow_${shopName.replace(/[^a-zA-Z0-9]/g, '_')}_Daily_Report_${dateStr}.pdf`;
  try {
    pdfBuffer = await generateDailyReportPDF(reportData);
  } catch (pdfErr) {
    console.error(`[WhatsApp ${shopId}] PDF generation error:`, pdfErr);
  }

  return {
    message: text,
    pdfBuffer,
    fileName,
    totalGrossSales: totalSales,
    totalGrossProfit: totalProfit,
    completedOrders,
  };
};

/**
 * Backward compatible alias for generateDailyReport
 */
export const generateShiftReport = async (
  shopId: string,
  shiftType: 'shift1' | 'shift2' | 'daily' = 'daily',
  targetDate?: string
) => {
  return generateDailyReport(shopId, targetDate, shiftType);
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

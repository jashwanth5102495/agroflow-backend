import { Request, Response, NextFunction } from 'express';
import { NotificationConfig, NotificationChannel } from '../models/NotificationConfig';
import { generateDailyOverviewMessage, sendTelegramMessage, getTelegramStatus } from '../services/telegram.service';
import {
  getWhatsAppStatus as getBaileysStatus,
  requestQrCode,
  disconnectWhatsApp as baileysDisconnect,
  sendWhatsAppMessage,
  generateShiftReport,
} from '../services/whatsapp.service';
import { fetchDailyReportData, generateDailyReportPDF } from '../services/pdfReport.service';
import { getLocalTimeInfo } from '../services/scheduler.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Resolves shopId from authenticated user context or route parameter
 */
const resolveShopId = (req: Request): string => {
  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const shopId = paramId || req.user?.shopId;
  if (!shopId) {
    throw { message: 'Shop context required', statusCode: 401, errorCode: 'UNAUTHORIZED' };
  }
  return shopId.toString();
};

const resolveShopAndUser = async (req: Request) => {
  const shopId = resolveShopId(req);
  const userId = req.user?.userId;

  if (!userId) {
    throw { message: 'Authentication required', statusCode: 401, errorCode: 'UNAUTHORIZED' };
  }

  return { shopId, userId };
};

/**
 * Retrieves the connection status of Telegram & WhatsApp gateways
 */
export const getGatewayStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const shopId = rawId || req.user?.shopId?.toString();
    const telegramStatus = getTelegramStatus();
    const whatsappStatus = shopId ? getBaileysStatus(shopId) : { status: 'DISCONNECTED' };

    return sendSuccess(
      res,
      {
        telegram: telegramStatus,
        whatsapp: whatsappStatus,
      },
      'Notification gateways status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves WhatsApp connection status for a specific shop/tenant
 */
export const getWhatsAppStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = resolveShopId(req);
    const status = getBaileysStatus(shopId);
    return sendSuccess(res, status, 'WhatsApp status retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Synchronously initializes or refreshes WhatsApp QR code
 */
export const requestWhatsAppQrController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = resolveShopId(req);
    const result = await requestQrCode(shopId);
    return sendSuccess(res, result, 'WhatsApp QR code ready');
  } catch (error) {
    next(error);
  }
};

/**
 * Logs out and disconnects WhatsApp device
 */
export const disconnectWhatsAppController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = resolveShopId(req);
    await baileysDisconnect(shopId);
    return sendSuccess(res, { status: 'DISCONNECTED' }, 'WhatsApp device disconnected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers an immediate test WhatsApp report (shift1, shift2, or daily) with PDF attached
 */
export const triggerWhatsAppTestReportController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = resolveShopId(req);
    const shiftType = (req.body.shiftType as 'shift1' | 'shift2' | 'daily') || 'daily';

    // Retrieve recipient phone from request body or saved configuration
    let targetPhone = req.body.phone || req.body.whatsappNumber;
    if (!targetPhone) {
      const config = await NotificationConfig.findOne({ shopId });
      targetPhone = config?.whatsappPhoneNumber || (config as any)?.whatsappNumber;
    }

    if (!targetPhone) {
      return sendError(
        res,
        'Please provide a recipient WhatsApp phone number or save it in settings first.',
        'VALIDATION_ERROR',
        400
      );
    }

    const { dateString } = getLocalTimeInfo();
    const report = await generateShiftReport(shopId, 'daily', dateString);

    const result = await sendWhatsAppMessage(shopId, targetPhone, report.message, {
      buffer: report.pdfBuffer,
      fileName: report.fileName,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to dispatch WhatsApp message.', 'WHATSAPP_ERROR', 400);
    }

    return sendSuccess(
      res,
      {
        sentTo: targetPhone,
        messageId: result.messageId,
        pdfAttached: !!report.pdfBuffer,
        fileName: report.fileName,
        totalSales: report.totalGrossSales,
        totalProfit: report.totalGrossProfit,
      },
      `WhatsApp Daily Report & PDF sent successfully to ${targetPhone}!`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the notification config for the logged-in user
 */
export const getNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    let config = await NotificationConfig.findOne({ shopId, userId });
    const waStatus = getBaileysStatus(shopId);

    // Return empty defaults if not configured yet
    if (!config) {
      return sendSuccess(
        res,
        {
          channel: 'WHATSAPP',
          whatsappPhoneNumber: '',
          telegramChatId: '',
          shift1Time: '23:30',
          shift2Time: '10:00',
          reportTime: '20:00',
          enabled: false,
          whatsappStatus: waStatus.status,
          whatsappConnectedNumber: waStatus.connectedNumber,
          whatsappQrCode: waStatus.qrCode,
        },
        'Default notification config retrieved'
      );
    }

    return sendSuccess(
      res,
      {
        ...config.toObject(),
        channel: config.channel || 'WHATSAPP',
        whatsappPhoneNumber: config.whatsappPhoneNumber || (config as any).whatsappNumber || '',
        telegramChatId: config.telegramChatId || '',
        shift1Time: config.shift1Time || '23:30',
        shift2Time: config.shift2Time || '10:00',
        reportTime: config.reportTime || '20:00',
        whatsappStatus: waStatus.status,
        whatsappConnectedNumber: waStatus.connectedNumber || config.whatsappConnectedNumber,
        whatsappQrCode: waStatus.qrCode,
      },
      'Notification configuration retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Updates or creates the notification configuration
 */
export const updateNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);
    const {
      channel,
      whatsappPhoneNumber,
      whatsappNumber,
      telegramChatId,
      shift1Time,
      shift2Time,
      reportTime,
      enabled,
    } = req.body;

    const phone = (whatsappPhoneNumber || whatsappNumber || '').trim();
    const tgChatId = (telegramChatId || '').trim();
    const chosenChannel: NotificationChannel = channel || (phone ? 'WHATSAPP' : 'TELEGRAM');

    // Time validations
    const timeRegex = /^\d{2}:\d{2}$/;
    const validShift1 = shift1Time && timeRegex.test(shift1Time) ? shift1Time : '23:30';
    const validShift2 = shift2Time && timeRegex.test(shift2Time) ? shift2Time : '10:00';
    const validReport = reportTime && timeRegex.test(reportTime) ? reportTime : '20:00';

    const config = await NotificationConfig.findOneAndUpdate(
      { shopId, userId },
      {
        $set: {
          channel: chosenChannel,
          whatsappPhoneNumber: phone,
          telegramChatId: tgChatId,
          shift1Time: validShift1,
          shift2Time: validShift2,
          reportTime: validReport,
          enabled: !!enabled,
        },
      },
      { new: true, upsert: true }
    );

    return sendSuccess(res, config, 'Notification configuration updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers an immediate test Telegram daily report
 */
export const triggerTestMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    const config = await NotificationConfig.findOne({ shopId, userId });
    const chatId = config?.telegramChatId;

    if (!config || !chatId) {
      return sendError(
        res,
        'Please save a valid Telegram Chat ID before sending a test message',
        'NOT_FOUND',
        400
      );
    }

    const { dateString } = getLocalTimeInfo();
    const message = await generateDailyOverviewMessage(shopId, dateString);

    // Generate bilingual PDF report
    const reportData = await fetchDailyReportData(shopId, dateString);
    const pdfBuffer = await generateDailyReportPDF(reportData);
    const fileName = `AgroFlow_${reportData.shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateString}.pdf`;

    await sendTelegramMessage(chatId, message, pdfBuffer, fileName);

    return sendSuccess(
      res,
      { sentTo: chatId, pdfAttached: true, fileName },
      'Daily overview Telegram message & PDF report triggered successfully'
    );
  } catch (error) {
    next(error);
  }
};

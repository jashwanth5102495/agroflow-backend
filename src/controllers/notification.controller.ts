import { Request, Response, NextFunction } from 'express';
import { NotificationConfig } from '../models/NotificationConfig';
import { generateDailyOverviewMessage, sendTelegramMessage, getTelegramStatus } from '../services/telegram.service';
import { fetchDailyReportData, generateDailyReportPDF } from '../services/pdfReport.service';
import { getLocalTimeInfo } from '../services/scheduler.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * Resolves shopId and userId from authenticated user context
 */
const resolveShopAndUser = async (req: Request) => {
  const shopId = req.user?.shopId;
  const userId = req.user?.userId;

  if (!shopId || !userId) {
    throw { message: 'Authentication required', statusCode: 401, errorCode: 'UNAUTHORIZED' };
  }

  return { shopId, userId };
};

/**
 * Retrieves the connection status and bot info of Telegram
 */
export const getGatewayStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = getTelegramStatus();
    return sendSuccess(res, status, 'Telegram Bot Gateway status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the Telegram notification config for the logged-in user
 */
export const getNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    let config = await NotificationConfig.findOne({ shopId, userId });
    
    // Return empty defaults if not configured yet
    if (!config) {
      return sendSuccess(res, {
        telegramChatId: '',
        whatsappNumber: '', // backwards compatibility
        reportTime: '20:00',
        enabled: false
      }, 'Default notification config retrieved');
    }

    return sendSuccess(res, {
      ...config.toObject(),
      telegramChatId: config.telegramChatId || (config as any).whatsappNumber || '',
    }, 'Notification configuration retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Updates or creates the Telegram notification configuration for the logged-in user
 */
export const updateNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);
    const { telegramChatId, whatsappNumber, reportTime, enabled } = req.body;

    const chatId = (telegramChatId || whatsappNumber || '').trim();

    // Basic validation
    if (!chatId) {
      return sendError(res, 'Telegram Chat ID (or recipient username) is required', 'VALIDATION_ERROR', 400);
    }
    if (!reportTime || !/^\d{2}:\d{2}$/.test(reportTime)) {
      return sendError(res, 'Report time must be in HH:MM (24-hour) format', 'VALIDATION_ERROR', 400);
    }

    const config = await NotificationConfig.findOneAndUpdate(
      { shopId, userId },
      { 
        telegramChatId: chatId, 
        reportTime, 
        enabled: !!enabled 
      },
      { new: true, upsert: true }
    );

    return sendSuccess(res, config, 'Notification configuration updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers an immediate test Telegram daily report to the configured Chat ID with PDF attached
 */
export const triggerTestMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    const config = await NotificationConfig.findOne({ shopId, userId });
    const chatId = config?.telegramChatId || (config as any)?.whatsappNumber;

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

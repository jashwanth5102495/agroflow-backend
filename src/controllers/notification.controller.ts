import { Request, Response, NextFunction } from 'express';
import { NotificationConfig } from '../models/NotificationConfig';
import { generateDailyOverviewMessage, sendWhatsAppMessage, getWhatsAppStatus } from '../services/whatsapp.service';
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
 * Retrieves the connection status and QR code of the global WhatsApp client
 */
export const getGatewayStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = getWhatsAppStatus();
    return sendSuccess(res, status, 'WhatsApp Gateway status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the WhatsApp notification config for the logged-in user
 */
export const getNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    let config = await NotificationConfig.findOne({ shopId, userId });
    
    // Return empty defaults if not configured yet
    if (!config) {
      return sendSuccess(res, {
        whatsappNumber: '',
        reportTime: '20:00',
        enabled: false
      }, 'Default notification config retrieved');
    }

    return sendSuccess(res, config, 'Notification configuration retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Updates or creates the WhatsApp notification configuration for the logged-in user
 */
export const updateNotificationConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);
    const { whatsappNumber, reportTime, enabled } = req.body;

    // Basic validation
    if (!whatsappNumber) {
      return sendError(res, 'WhatsApp number is required', 'VALIDATION_ERROR', 400);
    }
    if (!reportTime || !/^\d{2}:\d{2}$/.test(reportTime)) {
      return sendError(res, 'Report time must be in HH:MM (24-hour) format', 'VALIDATION_ERROR', 400);
    }

    const config = await NotificationConfig.findOneAndUpdate(
      { shopId, userId },
      { 
        whatsappNumber, 
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
 * Triggers an immediate test WhatsApp daily report to the configured number with PDF attached
 */
export const triggerTestMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shopId, userId } = await resolveShopAndUser(req);

    const config = await NotificationConfig.findOne({ shopId, userId });
    if (!config || !config.whatsappNumber) {
      return sendError(
        res,
        'Please save a valid WhatsApp number before sending a test message',
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

    await sendWhatsAppMessage(config.whatsappNumber, message, pdfBuffer, fileName);

    return sendSuccess(
      res,
      { sentTo: config.whatsappNumber, pdfAttached: true, fileName },
      'Daily overview WhatsApp message & PDF report triggered successfully'
    );
  } catch (error) {
    next(error);
  }
};

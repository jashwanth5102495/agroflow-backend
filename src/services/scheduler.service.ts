import cron from 'node-cron';
import { NotificationConfig } from '../models/NotificationConfig';
import { generateDailyOverviewMessage, sendTelegramMessage } from './telegram.service';
import { sendWhatsAppMessage, generateShiftReport } from './whatsapp.service';
import { fetchDailyReportData, generateDailyReportPDF } from './pdfReport.service';
import { env } from '../config/env';

/**
 * Gets current date and time formatted for Asia/Kolkata timezone
 */
export const getLocalTimeInfo = (timezone: string = 'Asia/Kolkata') => {
  const now = new Date();
  
  // Format current time in 24h format (HH:MM)
  const timeString = now.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Format current date in YYYY-MM-DD
  const dateString = now.toLocaleDateString('en-CA', {
    timeZone: timezone,
  });

  return { timeString, dateString };
};

/**
 * Initializes the global notification background cron scheduler.
 * Runs every minute to check if any shop needs automated WhatsApp or Telegram shift/daily reports.
 */
export const initNotificationScheduler = () => {
  console.log('⏰ Initializing automated notification scheduler cron (WhatsApp & Telegram)...');
  
  // Cron schedule: runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const { timeString, dateString } = getLocalTimeInfo();

      // Find all active configs where reportTime matches current time (Single Daily Closing Report)
      const activeConfigs = await NotificationConfig.find({
        enabled: true,
        reportTime: timeString,
        lastSentDate: { $ne: dateString },
      });

      if (activeConfigs.length === 0) return;

      console.log(`[Scheduler] Found ${activeConfigs.length} notification configuration(s) for daily report at ${timeString}`);

      for (const config of activeConfigs) {
        try {
          const shopId = config.shopId.toString();
          const channel = config.channel || 'WHATSAPP';

          // 1. Generate Comprehensive Daily Business & Profit Report with Branded PDF
          const dailyReport = await generateShiftReport(shopId, 'daily', dateString);

          // 2. Dispatch via WhatsApp if enabled
          if ((channel === 'WHATSAPP' || channel === 'BOTH') && config.whatsappPhoneNumber) {
            const waResult = await sendWhatsAppMessage(
              shopId,
              config.whatsappPhoneNumber,
              dailyReport.message,
              {
                buffer: dailyReport.pdfBuffer,
                fileName: dailyReport.fileName,
              }
            );
            if (waResult.success) {
              console.log(`[Scheduler] Daily WhatsApp report sent to ${config.whatsappPhoneNumber} for Shop ${shopId}`);
            } else {
              console.warn(`[Scheduler] Daily WhatsApp delivery notice for Shop ${shopId}:`, waResult.error);
            }
          }

          // 3. Dispatch via Telegram if enabled and token configured
          if ((channel === 'TELEGRAM' || channel === 'BOTH') && config.telegramChatId) {
            try {
              let tgMessage = await generateDailyOverviewMessage(shopId, dateString);
              let pdfBuffer = dailyReport.pdfBuffer;
              let fileName = dailyReport.fileName;

              if (!pdfBuffer) {
                const reportData = await fetchDailyReportData(shopId, dateString);
                pdfBuffer = await generateDailyReportPDF(reportData);
                fileName = `AgroFlow_${reportData.shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateString}.pdf`;
              }

              await sendTelegramMessage(config.telegramChatId, tgMessage, pdfBuffer, fileName);
              console.log(`[Scheduler] Telegram daily report sent to ${config.telegramChatId} for Shop ${shopId}`);
            } catch (tgErr) {
              console.error(`[Scheduler] Error sending Telegram report to ${config.telegramChatId}:`, tgErr);
            }
          }

          // 4. Update lastSentDate marker
          config.lastSentDate = dateString;
          await config.save();
        } catch (configErr) {
          console.error(`[Scheduler] Error processing config ${config._id} for shop ${config.shopId}:`, configErr);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Critical error in notification cron tick:', error);
    }
  });
};

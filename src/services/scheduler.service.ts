import cron from 'node-cron';
import { NotificationConfig } from '../models/NotificationConfig';
import { generateDailyOverviewMessage, sendTelegramMessage } from './telegram.service';
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
 * Runs every minute to check if any shop needs daily Telegram report.
 */
export const initNotificationScheduler = () => {
  if (!env.IS_TELEGRAM_ENABLED) {
    console.log('⏰ Telegram notification scheduler is DISABLED via env (ENABLE_TELEGRAM=false).');
    return;
  }

  console.log('⏰ Initializing Telegram notification scheduler cron...');
  
  // Cron schedule: every minute
  cron.schedule('* * * * *', async () => {
    try {
      const { timeString, dateString } = getLocalTimeInfo();
      
      // Find all active configs where the report time matches current HH:MM and hasn't been sent today yet
      const activeConfigs = await NotificationConfig.find({
        enabled: true,
        reportTime: timeString,
        $or: [
          { lastSentDate: { $ne: dateString } },
          { lastSentDate: { $exists: false } },
        ],
      });

      if (activeConfigs.length > 0) {
        console.log(`[Scheduler] Found ${activeConfigs.length} notification(s) to process for ${timeString}`);
        
        for (const config of activeConfigs) {
          try {
            const chatId = config.telegramChatId || (config as any).whatsappNumber;
            if (!chatId) continue;

            // 1. Generate text message content
            const message = await generateDailyOverviewMessage(
              config.shopId.toString(),
              dateString
            );
            
            // 2. Generate PDF report
            let pdfBuffer: Buffer | undefined;
            let fileName: string | undefined;
            try {
              const reportData = await fetchDailyReportData(config.shopId.toString(), dateString);
              pdfBuffer = await generateDailyReportPDF(reportData);
              fileName = `AgroFlow_${reportData.shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateString}.pdf`;
            } catch (pdfErr) {
              console.error('[Scheduler] Error generating PDF report:', pdfErr);
            }

            // 3. Send message with PDF via Telegram service
            await sendTelegramMessage(chatId, message, pdfBuffer, fileName);
            
            // 4. Mark config as sent for today
            config.lastSentDate = dateString;
            await config.save();
            
            console.log(`[Scheduler] Report & PDF sent successfully to Chat ID ${chatId} for Shop ID ${config.shopId}`);
          } catch (configError) {
            console.error(
              `[Scheduler] Error processing notification for shop ${config.shopId}:`,
              configError
            );
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Critical error in notification cron job:', error);
    }
  });
};

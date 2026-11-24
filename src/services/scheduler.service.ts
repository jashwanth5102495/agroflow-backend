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

      // Find all active configs where either shift1Time, shift2Time, or reportTime matches current time
      const activeConfigs = await NotificationConfig.find({
        enabled: true,
        $or: [
          { shift1Time: timeString, lastShift1SentDate: { $ne: dateString } },
          { shift2Time: timeString, lastShift2SentDate: { $ne: dateString } },
          { reportTime: timeString, lastSentDate: { $ne: dateString } },
        ],
      });

      if (activeConfigs.length === 0) return;

      console.log(`[Scheduler] Found ${activeConfigs.length} notification configuration(s) for ${timeString}`);

      for (const config of activeConfigs) {
        try {
          const shopId = config.shopId.toString();
          const channel = config.channel || 'WHATSAPP';
          const isShift1 = config.shift1Time === timeString && config.lastShift1SentDate !== dateString;
          const isShift2 = config.shift2Time === timeString && config.lastShift2SentDate !== dateString;
          const isDaily = config.reportTime === timeString && config.lastSentDate !== dateString;

          const shiftType: 'shift1' | 'shift2' | 'daily' = isShift1 ? 'shift1' : isShift2 ? 'shift2' : 'daily';

          // 1. Generate Report Message & Branded PDF
          const shiftData = await generateShiftReport(shopId, shiftType, dateString);

          // 2. Dispatch via WhatsApp if enabled
          if ((channel === 'WHATSAPP' || channel === 'BOTH') && config.whatsappPhoneNumber) {
            const waResult = await sendWhatsAppMessage(
              shopId,
              config.whatsappPhoneNumber,
              shiftData.message,
              {
                buffer: shiftData.pdfBuffer,
                fileName: shiftData.fileName,
              }
            );
            if (waResult.success) {
              console.log(`[Scheduler] WhatsApp ${shiftType} sent to ${config.whatsappPhoneNumber} for Shop ${shopId}`);
            } else {
              console.warn(`[Scheduler] WhatsApp ${shiftType} delivery notice for Shop ${shopId}:`, waResult.error);
            }
          }

          // 3. Dispatch via Telegram if enabled and token configured
          if ((channel === 'TELEGRAM' || channel === 'BOTH') && config.telegramChatId) {
            try {
              let tgMessage = await generateDailyOverviewMessage(shopId, dateString);
              let pdfBuffer = shiftData.pdfBuffer;
              let fileName = shiftData.fileName;

              if (!pdfBuffer) {
                const reportData = await fetchDailyReportData(shopId, dateString);
                pdfBuffer = await generateDailyReportPDF(reportData);
                fileName = `AgroFlow_${reportData.shopName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateString}.pdf`;
              }

              await sendTelegramMessage(config.telegramChatId, tgMessage, pdfBuffer, fileName);
              console.log(`[Scheduler] Telegram ${shiftType} sent to ${config.telegramChatId} for Shop ${shopId}`);
            } catch (tgErr) {
              console.error(`[Scheduler] Error sending Telegram report to ${config.telegramChatId}:`, tgErr);
            }
          }

          // 4. Update sent date markers
          if (isShift1) config.lastShift1SentDate = dateString;
          if (isShift2) config.lastShift2SentDate = dateString;
          if (isDaily) config.lastSentDate = dateString;
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

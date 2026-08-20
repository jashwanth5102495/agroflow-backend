"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNotificationScheduler = exports.getLocalTimeInfo = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const NotificationConfig_1 = require("../models/NotificationConfig");
const whatsapp_service_1 = require("./whatsapp.service");
/**
 * Gets current date and time formatted for Asia/Kolkata timezone
 */
const getLocalTimeInfo = (timezone = 'Asia/Kolkata') => {
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
exports.getLocalTimeInfo = getLocalTimeInfo;
/**
 * Initializes the global notification background cron scheduler.
 * Runs every minute to check if any shop needs daily WhatsApp report.
 */
const initNotificationScheduler = () => {
    console.log('⏰ Initializing WhatsApp notification scheduler cron...');
    // Cron schedule: every minute
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            const { timeString, dateString } = (0, exports.getLocalTimeInfo)();
            // Find all active configs where the report time matches current HH:MM and hasn't been sent today yet
            const activeConfigs = await NotificationConfig_1.NotificationConfig.find({
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
                        // 1. Generate message content
                        const message = await (0, whatsapp_service_1.generateDailyOverviewMessage)(config.shopId.toString(), dateString);
                        // 2. Send the message via WhatsApp service
                        await (0, whatsapp_service_1.sendWhatsAppMessage)(config.whatsappNumber, message);
                        // 3. Mark config as sent for today
                        config.lastSentDate = dateString;
                        await config.save();
                        console.log(`[Scheduler] Report sent successfully to ${config.whatsappNumber} for Shop ID ${config.shopId}`);
                    }
                    catch (configError) {
                        console.error(`[Scheduler] Error processing notification for shop ${config.shopId}:`, configError);
                    }
                }
            }
        }
        catch (error) {
            console.error('[Scheduler] Critical error in notification cron job:', error);
        }
    });
};
exports.initNotificationScheduler = initNotificationScheduler;
//# sourceMappingURL=scheduler.service.js.map
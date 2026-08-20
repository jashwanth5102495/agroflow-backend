/**
 * Gets current date and time formatted for Asia/Kolkata timezone
 */
export declare const getLocalTimeInfo: (timezone?: string) => {
    timeString: string;
    dateString: string;
};
/**
 * Initializes the global notification background cron scheduler.
 * Runs every minute to check if any shop needs daily WhatsApp report.
 */
export declare const initNotificationScheduler: () => void;
//# sourceMappingURL=scheduler.service.d.ts.map
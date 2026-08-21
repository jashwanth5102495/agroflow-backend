export declare let wwebClient: any;
export declare let latestQrCode: string | null;
/**
 * Gets the current connection status and QR code string of the WhatsApp client
 */
export declare const getWhatsAppStatus: () => {
    status: string;
    qr: string;
};
/**
 * Initializes the WhatsApp Web client with QR code generation in terminal
 */
export declare const initWhatsAppClient: () => void;
/**
 * Generates the daily overview message including total sales, cash/credit split, and inventory alerts
 */
export declare const generateDailyOverviewMessage: (shopId: string, dateStr: string) => Promise<string>;
/**
 * Sends a WhatsApp message with optional PDF attachment.
 */
export declare const sendWhatsAppMessage: (to: string, message: string, pdfBuffer?: Buffer, pdfFileName?: string) => Promise<{
    success: boolean;
    sender: string;
    receiver: string;
    hasPdf: boolean;
    mocked?: undefined;
} | {
    success: boolean;
    sender: string;
    receiver: string;
    mocked: boolean;
    hasPdf: boolean;
}>;
//# sourceMappingURL=whatsapp.service.d.ts.map
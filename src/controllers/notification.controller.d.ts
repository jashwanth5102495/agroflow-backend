import { Request, Response, NextFunction } from 'express';
/**
 * Retrieves the connection status and QR code of the global WhatsApp client
 */
export declare const getGatewayStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Retrieves the WhatsApp notification config for the logged-in user
 */
export declare const getNotificationConfig: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Updates or creates the WhatsApp notification configuration for the logged-in user
 */
export declare const updateNotificationConfig: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Triggers an immediate test WhatsApp daily report to the configured number
 */
export declare const triggerTestMessage: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=notification.controller.d.ts.map
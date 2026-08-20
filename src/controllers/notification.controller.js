"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerTestMessage = exports.updateNotificationConfig = exports.getNotificationConfig = exports.getGatewayStatus = void 0;
const NotificationConfig_1 = require("../models/NotificationConfig");
const whatsapp_service_1 = require("../services/whatsapp.service");
const scheduler_service_1 = require("../services/scheduler.service");
const response_1 = require("../utils/response");
/**
 * Resolves shopId and userId from authenticated user context
 */
const resolveShopAndUser = async (req) => {
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
const getGatewayStatus = async (req, res, next) => {
    try {
        const status = (0, whatsapp_service_1.getWhatsAppStatus)();
        return (0, response_1.sendSuccess)(res, status, 'WhatsApp Gateway status retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getGatewayStatus = getGatewayStatus;
/**
 * Retrieves the WhatsApp notification config for the logged-in user
 */
const getNotificationConfig = async (req, res, next) => {
    try {
        const { shopId, userId } = await resolveShopAndUser(req);
        let config = await NotificationConfig_1.NotificationConfig.findOne({ shopId, userId });
        // Return empty defaults if not configured yet
        if (!config) {
            return (0, response_1.sendSuccess)(res, {
                whatsappNumber: '',
                reportTime: '20:00',
                enabled: false
            }, 'Default notification config retrieved');
        }
        return (0, response_1.sendSuccess)(res, config, 'Notification configuration retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getNotificationConfig = getNotificationConfig;
/**
 * Updates or creates the WhatsApp notification configuration for the logged-in user
 */
const updateNotificationConfig = async (req, res, next) => {
    try {
        const { shopId, userId } = await resolveShopAndUser(req);
        const { whatsappNumber, reportTime, enabled } = req.body;
        // Basic validation
        if (!whatsappNumber) {
            return (0, response_1.sendError)(res, 'WhatsApp number is required', 'VALIDATION_ERROR', 400);
        }
        if (!reportTime || !/^\d{2}:\d{2}$/.test(reportTime)) {
            return (0, response_1.sendError)(res, 'Report time must be in HH:MM (24-hour) format', 'VALIDATION_ERROR', 400);
        }
        const config = await NotificationConfig_1.NotificationConfig.findOneAndUpdate({ shopId, userId }, {
            whatsappNumber,
            reportTime,
            enabled: !!enabled
        }, { new: true, upsert: true });
        return (0, response_1.sendSuccess)(res, config, 'Notification configuration updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateNotificationConfig = updateNotificationConfig;
/**
 * Triggers an immediate test WhatsApp daily report to the configured number
 */
const triggerTestMessage = async (req, res, next) => {
    try {
        const { shopId, userId } = await resolveShopAndUser(req);
        const config = await NotificationConfig_1.NotificationConfig.findOne({ shopId, userId });
        if (!config || !config.whatsappNumber) {
            return (0, response_1.sendError)(res, 'Please save a valid WhatsApp number before sending a test message', 'NOT_FOUND', 400);
        }
        const { dateString } = (0, scheduler_service_1.getLocalTimeInfo)();
        const message = await (0, whatsapp_service_1.generateDailyOverviewMessage)(shopId, dateString);
        await (0, whatsapp_service_1.sendWhatsAppMessage)(config.whatsappNumber, message);
        return (0, response_1.sendSuccess)(res, { sentTo: config.whatsappNumber }, 'Test daily overview WhatsApp message triggered successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.triggerTestMessage = triggerTestMessage;
//# sourceMappingURL=notification.controller.js.map
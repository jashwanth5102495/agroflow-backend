"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const scheduler_service_1 = require("./services/scheduler.service");
const whatsapp_service_1 = require("./services/whatsapp.service");
const startServer = async () => {
    // Connect to Database
    await (0, database_1.connectDB)();
    // Initialize WhatsApp Web Client (for QR device linking)
    (0, whatsapp_service_1.initWhatsAppClient)();
    // Initialize background notification cron job
    (0, scheduler_service_1.initNotificationScheduler)();
    // Start the server
    app_1.default.listen(env_1.env.PORT, () => {
        console.log(`🚀 Server is running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
    });
};
startServer();
// Handle Unhandled Rejections and Exceptions
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map
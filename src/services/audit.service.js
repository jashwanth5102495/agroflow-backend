"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = void 0;
const AuditLog_1 = require("../models/AuditLog");
const createAuditLog = async (data) => {
    try {
        // Avoid storing sensitive data like passwords or tokens
        if (data.before && data.before.passwordHash)
            delete data.before.passwordHash;
        if (data.after && data.after.passwordHash)
            delete data.after.passwordHash;
        const log = new AuditLog_1.AuditLog(data);
        await log.save();
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to prevent failing the main transaction if logging fails
    }
};
exports.createAuditLog = createAuditLog;
//# sourceMappingURL=audit.service.js.map
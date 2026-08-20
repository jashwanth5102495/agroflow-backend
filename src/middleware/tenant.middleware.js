"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenant = void 0;
const response_1 = require("../utils/response");
const requireTenant = (req, res, next) => {
    if (!req.user || !req.user.shopId) {
        return (0, response_1.sendError)(res, 'Tenant context missing', 'FORBIDDEN', 403);
    }
    // Optional: We could also attach it explicitly to a specific `req.tenantId` 
    // but req.user.shopId is sufficient for tenant isolation.
    next();
};
exports.requireTenant = requireTenant;
//# sourceMappingURL=tenant.middleware.js.map
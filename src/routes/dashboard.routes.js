"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.get('/summary', dashboard_controller_1.getDashboardSummary);
router.get('/recent-transactions', dashboard_controller_1.getRecentTransactions);
router.get('/inventory-alerts', dashboard_controller_1.getInventoryAlerts);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map
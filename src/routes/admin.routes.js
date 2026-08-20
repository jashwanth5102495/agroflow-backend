"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Admin routes
router.get('/shops', admin_controller_1.getAllShops);
router.get('/stats', admin_controller_1.getAdminDashboardStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map
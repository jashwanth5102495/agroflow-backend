"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
// Public gateway status checking for dashboard setup
router.get('/gateway-status', notification_controller_1.getGatewayStatus);
// Secure notification endpoints
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.get('/config', notification_controller_1.getNotificationConfig);
router.post('/config', notification_controller_1.updateNotificationConfig);
router.post('/test-message', notification_controller_1.triggerTestMessage);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map
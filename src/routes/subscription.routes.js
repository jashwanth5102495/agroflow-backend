"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/status', subscription_controller_1.getSubscriptionStatus);
router.post('/pay', subscription_controller_1.paySubscription);
router.post('/set-price', subscription_controller_1.setShopSubscriptionPrice);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map
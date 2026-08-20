"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const payment_validation_1 = require("../validations/payment.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(payment_validation_1.createPaymentSchema), payment_controller_1.createPayment);
router.get('/', payment_controller_1.getPayments);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map
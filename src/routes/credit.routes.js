"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const credit_controller_1 = require("../controllers/credit.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const credit_validation_1 = require("../validations/credit.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.get('/outstanding', credit_controller_1.getOutstandingCredits);
router.get('/:farmerId', credit_controller_1.getFarmerCredit);
router.post('/:farmerId/payment', (0, validate_middleware_1.validateRequest)(credit_validation_1.addCreditPaymentSchema), credit_controller_1.addCreditPayment);
exports.default = router;
//# sourceMappingURL=credit.routes.js.map
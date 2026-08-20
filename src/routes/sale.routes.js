"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const sale_validation_1 = require("../validations/sale.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(sale_validation_1.createSaleSchema), sale_controller_1.createSale);
router.get('/', sale_controller_1.getSales);
router.get('/:id', sale_controller_1.getSaleById);
exports.default = router;
//# sourceMappingURL=sale.routes.js.map
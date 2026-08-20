"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const farmer_controller_1 = require("../controllers/farmer.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const farmer_validation_1 = require("../validations/farmer.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(farmer_validation_1.createFarmerSchema), farmer_controller_1.createFarmer);
router.get('/', farmer_controller_1.getFarmers);
router.get('/:id', farmer_controller_1.getFarmerById);
router.patch('/:id', (0, validate_middleware_1.validateRequest)(farmer_validation_1.updateFarmerSchema), farmer_controller_1.updateFarmer);
router.delete('/:id', farmer_controller_1.deleteFarmer);
exports.default = router;
//# sourceMappingURL=farmer.routes.js.map
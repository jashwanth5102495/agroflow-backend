"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.getSupplierById = exports.getSuppliers = exports.createSupplier = void 0;
const supplierService = __importStar(require("../services/supplier.service"));
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const createSupplier = async (req, res, next) => {
    try {
        const supplier = await supplierService.createSupplierService(req.user.shopId, req.body);
        return (0, response_1.sendSuccess)(res, supplier, 'Supplier created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createSupplier = createSupplier;
const getSuppliers = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationOptions)(req.query);
        const search = req.query.search || '';
        const { suppliers, total } = await supplierService.getSuppliersService(req.user.shopId, search, skip, limit);
        return (0, response_1.sendPaginatedSuccess)(res, suppliers, (0, pagination_1.formatPagination)(page, limit, total));
    }
    catch (error) {
        next(error);
    }
};
exports.getSuppliers = getSuppliers;
const getSupplierById = async (req, res, next) => {
    try {
        const supplier = await supplierService.getSupplierByIdService(req.user.shopId, req.params.id);
        return (0, response_1.sendSuccess)(res, supplier, 'Supplier retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getSupplierById = getSupplierById;
const updateSupplier = async (req, res, next) => {
    try {
        const supplier = await supplierService.updateSupplierService(req.user.shopId, req.params.id, req.body);
        return (0, response_1.sendSuccess)(res, supplier, 'Supplier updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res, next) => {
    try {
        await supplierService.deleteSupplierService(req.user.shopId, req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Supplier deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSupplier = deleteSupplier;
//# sourceMappingURL=supplier.controller.js.map
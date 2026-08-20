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
exports.getPurchaseById = exports.getPurchases = exports.createPurchase = void 0;
const purchaseService = __importStar(require("../services/purchase.service"));
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const createPurchase = async (req, res, next) => {
    try {
        const purchase = await purchaseService.createPurchaseService(req.user.shopId, req.user.userId, req.body);
        return (0, response_1.sendSuccess)(res, purchase, 'Purchase created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createPurchase = createPurchase;
const getPurchases = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationOptions)(req.query);
        const { purchases, total } = await purchaseService.getPurchasesService(req.user.shopId, skip, limit);
        return (0, response_1.sendPaginatedSuccess)(res, purchases, (0, pagination_1.formatPagination)(page, limit, total));
    }
    catch (error) {
        next(error);
    }
};
exports.getPurchases = getPurchases;
const getPurchaseById = async (req, res, next) => {
    try {
        const purchaseData = await purchaseService.getPurchaseByIdService(req.user.shopId, req.params.id);
        return (0, response_1.sendSuccess)(res, purchaseData, 'Purchase retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getPurchaseById = getPurchaseById;
//# sourceMappingURL=purchase.controller.js.map
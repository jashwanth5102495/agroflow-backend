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
exports.adjustInventory = exports.getInventory = void 0;
const inventoryService = __importStar(require("../services/inventory.service"));
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const InventoryTransaction_1 = require("../models/InventoryTransaction");
const getInventory = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationOptions)(req.query);
        const { inventory, total } = await inventoryService.getInventoryService(req.user.shopId, skip, limit);
        return (0, response_1.sendPaginatedSuccess)(res, inventory, (0, pagination_1.formatPagination)(page, limit, total));
    }
    catch (error) {
        next(error);
    }
};
exports.getInventory = getInventory;
const adjustInventory = async (req, res, next) => {
    try {
        const { productId, quantityChange, type, reason } = req.body;
        const inventory = await inventoryService.adjustInventoryService(req.user.shopId, productId, quantityChange, type || InventoryTransaction_1.TransactionType.ADJUSTMENT, req.user.userId, undefined, undefined, reason);
        return (0, response_1.sendSuccess)(res, inventory, 'Inventory adjusted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.adjustInventory = adjustInventory;
//# sourceMappingURL=inventory.controller.js.map
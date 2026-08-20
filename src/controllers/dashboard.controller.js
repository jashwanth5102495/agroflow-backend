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
exports.getInventoryAlerts = exports.getRecentTransactions = exports.getDashboardSummary = void 0;
const dashboardService = __importStar(require("../services/dashboard.service"));
const response_1 = require("../utils/response");
const getDashboardSummary = async (req, res, next) => {
    try {
        const summary = await dashboardService.getDashboardSummaryService(req.user.shopId);
        return (0, response_1.sendSuccess)(res, summary, 'Dashboard summary retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardSummary = getDashboardSummary;
const getRecentTransactions = async (req, res, next) => {
    try {
        const transactions = await dashboardService.getRecentTransactionsService(req.user.shopId);
        return (0, response_1.sendSuccess)(res, transactions, 'Recent transactions retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getRecentTransactions = getRecentTransactions;
const getInventoryAlerts = async (req, res, next) => {
    try {
        const alerts = await dashboardService.getInventoryAlertsService(req.user.shopId);
        return (0, response_1.sendSuccess)(res, alerts, 'Inventory alerts retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getInventoryAlerts = getInventoryAlerts;
//# sourceMappingURL=dashboard.controller.js.map
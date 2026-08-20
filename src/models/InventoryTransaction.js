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
exports.InventoryTransaction = exports.TransactionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var TransactionType;
(function (TransactionType) {
    TransactionType["PURCHASE"] = "PURCHASE";
    TransactionType["SALE"] = "SALE";
    TransactionType["RETURN"] = "RETURN";
    TransactionType["ADJUSTMENT"] = "ADJUSTMENT";
    TransactionType["DAMAGE"] = "DAMAGE";
    TransactionType["CORRECTION"] = "CORRECTION";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
const inventoryTransactionSchema = new mongoose_1.Schema({
    shopId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    quantity: { type: Number, required: true }, // positive or negative
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    reason: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
inventoryTransactionSchema.index({ shopId: 1, productId: 1, createdAt: -1 });
exports.InventoryTransaction = mongoose_1.default.model('InventoryTransaction', inventoryTransactionSchema);
//# sourceMappingURL=InventoryTransaction.js.map
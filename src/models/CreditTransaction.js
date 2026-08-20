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
exports.CreditTransaction = exports.CreditTransactionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CreditTransactionType;
(function (CreditTransactionType) {
    CreditTransactionType["CREDIT_ADDED"] = "CREDIT_ADDED";
    CreditTransactionType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    CreditTransactionType["ADJUSTMENT"] = "ADJUSTMENT";
})(CreditTransactionType || (exports.CreditTransactionType = CreditTransactionType = {}));
const creditTransactionSchema = new mongoose_1.Schema({
    shopId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    farmerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    type: { type: String, enum: Object.values(CreditTransactionType), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    notes: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
creditTransactionSchema.index({ shopId: 1, farmerId: 1, createdAt: -1 });
exports.CreditTransaction = mongoose_1.default.model('CreditTransaction', creditTransactionSchema);
//# sourceMappingURL=CreditTransaction.js.map
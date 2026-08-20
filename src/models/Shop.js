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
exports.Shop = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const billingRecordSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    plan: { type: String, default: 'Standard Shop Plan' },
    cycle: { type: String, enum: ['MONTHLY', 'ANNUAL'], default: 'MONTHLY' },
    status: { type: String, enum: ['PAID', 'FAILED', 'PENDING'], default: 'PAID' },
    paymentMethod: { type: String, default: 'UPI AutoPay' },
    transactionId: { type: String, required: true },
}, { _id: true });
const shopSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true },
    village: { type: String, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true },
    agentCode: { type: String, trim: true },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE',
    },
    subscriptionPrice: {
        type: Number,
        default: 1500, // Monthly base price set by agent/admin
    },
    subscriptionStatus: {
        type: String,
        enum: ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
        default: 'PENDING_PAYMENT',
    },
    billingCycle: {
        type: String,
        enum: ['MONTHLY', 'ANNUAL'],
        default: 'MONTHLY',
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    autoPay: {
        type: Boolean,
        default: true,
    },
    billingHistory: [billingRecordSchema],
}, {
    timestamps: true,
});
exports.Shop = mongoose_1.default.model('Shop', shopSchema);
//# sourceMappingURL=Shop.js.map
import mongoose, { Document, Schema } from 'mongoose';

export interface IBillingRecord {
  date: Date;
  amount: number;
  plan: string;
  cycle: 'MONTHLY' | 'ANNUAL';
  status: 'PAID' | 'FAILED' | 'PENDING';
  paymentMethod: string;
  transactionId: string;
}

export interface IShop extends Document {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  village?: string;
  district: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  agentCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  subscriptionPrice: number;
  subscriptionStatus: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  autoPay: boolean;
  billingHistory: IBillingRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const billingRecordSchema = new Schema<IBillingRecord>(
  {
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    plan: { type: String, default: 'Standard Shop Plan' },
    cycle: { type: String, enum: ['MONTHLY', 'ANNUAL'], default: 'MONTHLY' },
    status: { type: String, enum: ['PAID', 'FAILED', 'PENDING'], default: 'PAID' },
    paymentMethod: { type: String, default: 'UPI AutoPay' },
    transactionId: { type: String, required: true },
  },
  { _id: true }
);

const shopSchema = new Schema<IShop>(
  {
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
  },
  {
    timestamps: true,
  }
);

export const Shop = mongoose.model<IShop>('Shop', shopSchema);

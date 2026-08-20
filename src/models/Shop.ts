import mongoose, { Document, Schema } from 'mongoose';

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
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

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
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Shop = mongoose.model<IShop>('Shop', shopSchema);

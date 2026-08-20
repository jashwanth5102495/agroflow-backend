import mongoose, { Document, Schema } from 'mongoose';

export interface IFarmer extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  alternatePhone?: string;
  village?: string;
  address?: string;
  farmerCode?: string;
  creditLimit: number;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const farmerSchema = new Schema<IFarmer>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    village: { type: String, trim: true },
    address: { type: String, trim: true },
    farmerCode: { type: String, trim: true },
    creditLimit: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
farmerSchema.index({ shopId: 1, phone: 1 });
farmerSchema.index({ shopId: 1, farmerCode: 1 });

export const Farmer = mongoose.model<IFarmer>('Farmer', farmerSchema);

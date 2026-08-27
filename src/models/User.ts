import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  BILLING_STAFF = 'BILLING_STAFF',
  INVENTORY_STAFF = 'INVENTORY_STAFF',
  ACCOUNTANT = 'ACCOUNTANT',
}

export interface IUser extends Document {
  shopId?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    shopId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Shop', 
      required: function(this: any) { return this.role !== UserRole.ADMIN; }, 
      index: true 
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BILLING_STAFF,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure phone is unique per shop (or globally if preferred)
userSchema.index({ phone: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);

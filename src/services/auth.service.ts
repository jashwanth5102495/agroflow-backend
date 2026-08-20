import bcrypt from 'bcrypt';
import { Shop } from '../models/Shop';
import { User, UserRole } from '../models/User';
import { generateToken, JwtPayload } from '../utils/jwt';

export const registerShopService = async (data: any) => {
  // Check if phone number is already registered
  const existingUser = await User.findOne({ phone: data.phone });
  if (existingUser) {
    throw { message: 'Phone number already registered', statusCode: 400, errorCode: 'VALIDATION_ERROR' };
  }

  // Create Shop
  const shop = new Shop({
    name: data.shopName,
    ownerName: data.ownerName,
    phone: data.phone,
    email: data.email,
    address: data.address,
    village: data.village,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    gstNumber: data.gstNumber,
  });
  await shop.save();

  try {
    // Create Owner User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = new User({
      shopId: shop._id,
      name: data.ownerName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: UserRole.OWNER,
    });
    await user.save();

    // Generate Token
    const payload: JwtPayload = {
      userId: user._id.toString(),
      shopId: shop._id.toString(),
      role: user.role,
    };
    const token = generateToken(payload);

    return {
      shop,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  } catch (err) {
    // Cleanup shop if user creation failed
    await Shop.findByIdAndDelete(shop._id);
    throw err;
  }
};

export const loginService = async (data: any) => {
  const user = await User.findOne({ phone: data.phone });
  if (!user) {
    throw { message: 'Invalid credentials', statusCode: 401, errorCode: 'UNAUTHORIZED' };
  }

  if (user.status !== 'ACTIVE') {
    throw { message: 'User account is not active', statusCode: 403, errorCode: 'FORBIDDEN' };
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw { message: 'Invalid credentials', statusCode: 401, errorCode: 'UNAUTHORIZED' };
  }

  // Check shop status
  const shop = await Shop.findById(user.shopId);
  if (!shop || shop.status !== 'ACTIVE') {
    throw { message: 'Shop is not active', statusCode: 403, errorCode: 'FORBIDDEN' };
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const payload: JwtPayload = {
    userId: user._id.toString(),
    shopId: user.shopId.toString(),
    role: user.role,
  };
  const token = generateToken(payload);

  return {
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      shopId: user.shopId,
    },
    shop,
    token,
  };
};

export const getMeService = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw { message: 'User not found', statusCode: 404, errorCode: 'NOT_FOUND' };
  }

  const shop = await Shop.findById(user.shopId);
  
  return { user, shop };
};

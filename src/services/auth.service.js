"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeService = exports.loginService = exports.registerShopService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const Shop_1 = require("../models/Shop");
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const registerShopService = async (data) => {
    // Check if phone number is already registered
    const existingUser = await User_1.User.findOne({ phone: data.phone });
    if (existingUser) {
        throw { message: 'Phone number already registered', statusCode: 400, errorCode: 'VALIDATION_ERROR' };
    }
    // Create Shop
    const shop = new Shop_1.Shop({
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
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(data.password, salt);
        const user = new User_1.User({
            shopId: shop._id,
            name: data.ownerName,
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: User_1.UserRole.OWNER,
        });
        await user.save();
        // Generate Token
        const payload = {
            userId: user._id.toString(),
            shopId: shop._id.toString(),
            role: user.role,
        };
        const token = (0, jwt_1.generateToken)(payload);
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
    }
    catch (err) {
        // Cleanup shop if user creation failed
        await Shop_1.Shop.findByIdAndDelete(shop._id);
        throw err;
    }
};
exports.registerShopService = registerShopService;
const loginService = async (data) => {
    const user = await User_1.User.findOne({ phone: data.phone });
    if (!user) {
        throw { message: 'Invalid credentials', statusCode: 401, errorCode: 'UNAUTHORIZED' };
    }
    if (user.status !== 'ACTIVE') {
        throw { message: 'User account is not active', statusCode: 403, errorCode: 'FORBIDDEN' };
    }
    const isMatch = await bcrypt_1.default.compare(data.password, user.passwordHash);
    if (!isMatch) {
        throw { message: 'Invalid credentials', statusCode: 401, errorCode: 'UNAUTHORIZED' };
    }
    // Check shop status
    const shop = await Shop_1.Shop.findById(user.shopId);
    if (!shop || shop.status !== 'ACTIVE') {
        throw { message: 'Shop is not active', statusCode: 403, errorCode: 'FORBIDDEN' };
    }
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    const payload = {
        userId: user._id.toString(),
        shopId: user.shopId.toString(),
        role: user.role,
    };
    const token = (0, jwt_1.generateToken)(payload);
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
exports.loginService = loginService;
const getMeService = async (userId) => {
    const user = await User_1.User.findById(userId).select('-passwordHash');
    if (!user) {
        throw { message: 'User not found', statusCode: 404, errorCode: 'NOT_FOUND' };
    }
    const shop = await Shop_1.Shop.findById(user.shopId);
    return { user, shop };
};
exports.getMeService = getMeService;
//# sourceMappingURL=auth.service.js.map
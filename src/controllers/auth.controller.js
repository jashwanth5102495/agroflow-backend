"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.registerShop = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const registerShop = async (req, res, next) => {
    try {
        const result = await (0, auth_service_1.registerShopService)(req.body);
        return (0, response_1.sendSuccess)(res, result, 'Shop registered successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.registerShop = registerShop;
const login = async (req, res, next) => {
    try {
        const result = await (0, auth_service_1.loginService)(req.body);
        return (0, response_1.sendSuccess)(res, result, 'Login successful');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        // In a stateless JWT implementation, logout is usually handled client-side by deleting the token.
        // If blacklisting is needed, it would be implemented here.
        return (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw { message: 'User context missing', statusCode: 401 };
        const result = await (0, auth_service_1.getMeService)(userId);
        return (0, response_1.sendSuccess)(res, result, 'User retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map
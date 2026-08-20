"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return (0, response_1.sendError)(res, `Validation Error: ${errorMessages}`, 'VALIDATION_ERROR', 400);
    }
    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return (0, response_1.sendError)(res, `${field} already exists`, 'DUPLICATE_ERROR', 409);
    }
    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return (0, response_1.sendError)(res, 'Invalid token', 'UNAUTHORIZED', 401);
    }
    if (err.name === 'TokenExpiredError') {
        return (0, response_1.sendError)(res, 'Token expired', 'UNAUTHORIZED', 401);
    }
    // General Error
    const statusCode = err.statusCode || 500;
    const message = env_1.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : err.message || 'Something went wrong';
    return (0, response_1.sendError)(res, message, err.errorCode || 'SERVER_ERROR', statusCode);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map
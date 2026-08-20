"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedSuccess = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Something went wrong', errorCode = 'SERVER_ERROR', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
    });
};
exports.sendError = sendError;
const sendPaginatedSuccess = (res, data, pagination, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
        pagination
    });
};
exports.sendPaginatedSuccess = sendPaginatedSuccess;
//# sourceMappingURL=response.js.map
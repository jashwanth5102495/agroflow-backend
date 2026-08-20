"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const response_1 = require("../utils/response");
const notFoundHandler = (req, res) => {
    return (0, response_1.sendError)(res, `Route not found: ${req.originalUrl}`, 'NOT_FOUND', 404);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFound.middleware.js.map
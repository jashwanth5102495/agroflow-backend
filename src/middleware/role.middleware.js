"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const response_1 = require("../utils/response");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'User context missing', 'UNAUTHORIZED', 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
            return (0, response_1.sendError)(res, 'Insufficient permissions', 'FORBIDDEN', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=role.middleware.js.map
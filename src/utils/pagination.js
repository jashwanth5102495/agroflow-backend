"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPagination = exports.getPaginationOptions = void 0;
const getPaginationOptions = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationOptions = getPaginationOptions;
const formatPagination = (page, limit, total) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
};
exports.formatPagination = formatPagination;
//# sourceMappingURL=pagination.js.map
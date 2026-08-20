"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const productService = __importStar(require("../services/product.service"));
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProductService(req.user.shopId, req.body);
        return (0, response_1.sendSuccess)(res, product, 'Product created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res, next) => {
    try {
        const { page, limit, skip } = (0, pagination_1.getPaginationOptions)(req.query);
        const search = req.query.search || '';
        const { products, total } = await productService.getProductsService(req.user.shopId, search, skip, limit);
        return (0, response_1.sendPaginatedSuccess)(res, products, (0, pagination_1.formatPagination)(page, limit, total));
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res, next) => {
    try {
        const product = await productService.getProductByIdService(req.user.shopId, req.params.id);
        return (0, response_1.sendSuccess)(res, product, 'Product retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProductService(req.user.shopId, req.params.id, req.body);
        return (0, response_1.sendSuccess)(res, product, 'Product updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProductService(req.user.shopId, req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Product deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.controller.js.map
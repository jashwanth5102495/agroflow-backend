"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductService = exports.updateProductService = exports.getProductByIdService = exports.getProductsService = exports.createProductService = void 0;
const Product_1 = require("../models/Product");
const createProductService = async (shopId, data) => {
    if (data.sku) {
        const existingSku = await Product_1.Product.findOne({ shopId, sku: data.sku });
        if (existingSku)
            throw { message: 'Product with this SKU already exists', statusCode: 400 };
    }
    const product = new Product_1.Product({ ...data, shopId });
    await product.save();
    return product;
};
exports.createProductService = createProductService;
const getProductsService = async (shopId, search, skip, limit) => {
    const query = { shopId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ];
    }
    const [products, total] = await Promise.all([
        Product_1.Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Product_1.Product.countDocuments(query),
    ]);
    return { products, total };
};
exports.getProductsService = getProductsService;
const getProductByIdService = async (shopId, productId) => {
    const product = await Product_1.Product.findOne({ _id: productId, shopId });
    if (!product)
        throw { message: 'Product not found', statusCode: 404 };
    return product;
};
exports.getProductByIdService = getProductByIdService;
const updateProductService = async (shopId, productId, data) => {
    if (data.sku) {
        const existingSku = await Product_1.Product.findOne({ shopId, sku: data.sku, _id: { $ne: productId } });
        if (existingSku)
            throw { message: 'Product with this SKU already exists', statusCode: 400 };
    }
    const product = await Product_1.Product.findOneAndUpdate({ _id: productId, shopId }, { $set: data }, { new: true, runValidators: true });
    if (!product)
        throw { message: 'Product not found', statusCode: 404 };
    return product;
};
exports.updateProductService = updateProductService;
const deleteProductService = async (shopId, productId) => {
    const product = await Product_1.Product.findOneAndDelete({ _id: productId, shopId });
    if (!product)
        throw { message: 'Product not found', statusCode: 404 };
    return product;
};
exports.deleteProductService = deleteProductService;
//# sourceMappingURL=product.service.js.map
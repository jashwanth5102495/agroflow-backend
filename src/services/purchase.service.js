"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseByIdService = exports.getPurchasesService = exports.createPurchaseService = void 0;
const Purchase_1 = require("../models/Purchase");
const PurchaseItem_1 = require("../models/PurchaseItem");
const inventory_service_1 = require("./inventory.service");
const InventoryTransaction_1 = require("../models/InventoryTransaction");
const Product_1 = require("../models/Product");
const createPurchaseService = async (shopId, userId, data) => {
    let subtotal = 0;
    // Validate products and calculate true subtotal securely
    for (const item of data.items) {
        const product = await Product_1.Product.findOne({ _id: item.productId, shopId });
        if (!product)
            throw { message: `Product ${item.productId} not found`, statusCode: 404 };
        subtotal += item.quantity * item.purchasePrice;
    }
    const total = subtotal - (data.discount || 0) + (data.tax || 0);
    const amountDue = total - (data.amountPaid || 0);
    const paymentStatus = amountDue <= 0 ? 'PAID' : (data.amountPaid > 0 ? 'PARTIAL' : 'UNPAID');
    // Create Purchase Record
    const purchase = new Purchase_1.Purchase({
        shopId,
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        purchaseDate: new Date(data.purchaseDate),
        subtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total,
        paymentStatus,
        amountPaid: data.amountPaid || 0,
        amountDue,
        createdBy: userId,
    });
    await purchase.save();
    // Process Items and Inventory
    for (const item of data.items) {
        const itemSubtotal = item.quantity * item.purchasePrice;
        const purchaseItem = new PurchaseItem_1.PurchaseItem({
            purchaseId: purchase._id,
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            subtotal: itemSubtotal,
        });
        await purchaseItem.save();
        // Increase Inventory
        await (0, inventory_service_1.adjustInventoryService)(shopId, item.productId, item.quantity, InventoryTransaction_1.TransactionType.PURCHASE, userId, purchase._id, 'PURCHASE', 'Stock inward from purchase');
        // Update Product purchase price if needed
        await Product_1.Product.findByIdAndUpdate(item.productId, { purchasePrice: item.purchasePrice });
    }
    return purchase;
};
exports.createPurchaseService = createPurchaseService;
const getPurchasesService = async (shopId, skip, limit) => {
    const [purchases, total] = await Promise.all([
        Purchase_1.Purchase.find({ shopId }).populate('supplierId', 'name companyName').skip(skip).limit(limit).sort({ purchaseDate: -1 }),
        Purchase_1.Purchase.countDocuments({ shopId }),
    ]);
    return { purchases, total };
};
exports.getPurchasesService = getPurchasesService;
const getPurchaseByIdService = async (shopId, purchaseId) => {
    const purchase = await Purchase_1.Purchase.findOne({ _id: purchaseId, shopId }).populate('supplierId', 'name companyName email phone');
    if (!purchase)
        throw { message: 'Purchase not found', statusCode: 404 };
    const items = await PurchaseItem_1.PurchaseItem.find({ purchaseId: purchase._id }).populate('productId', 'name sku unit');
    return { purchase, items };
};
exports.getPurchaseByIdService = getPurchaseByIdService;
//# sourceMappingURL=purchase.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustInventoryService = exports.getInventoryService = void 0;
const Inventory_1 = require("../models/Inventory");
const InventoryTransaction_1 = require("../models/InventoryTransaction");
const getInventoryService = async (shopId, skip, limit) => {
    const [inventory, total] = await Promise.all([
        Inventory_1.Inventory.find({ shopId }).populate('productId', 'name sku category').skip(skip).limit(limit),
        Inventory_1.Inventory.countDocuments({ shopId }),
    ]);
    return { inventory, total };
};
exports.getInventoryService = getInventoryService;
const adjustInventoryService = async (shopId, productId, quantityChange, type, userId, referenceId, referenceType, reason, session) => {
    // Find or create inventory record
    let inventory = await Inventory_1.Inventory.findOne({ shopId, productId }).session(session || null);
    const previousQuantity = inventory ? inventory.quantity : 0;
    const newQuantity = previousQuantity + quantityChange;
    if (newQuantity < 0) {
        throw { message: 'Insufficient inventory', statusCode: 400 };
    }
    if (!inventory) {
        inventory = new Inventory_1.Inventory({ shopId, productId, quantity: newQuantity });
    }
    else {
        inventory.quantity = newQuantity;
        inventory.lastUpdated = new Date();
    }
    await inventory.save({ session });
    // Create transaction log
    const transaction = new InventoryTransaction_1.InventoryTransaction({
        shopId,
        productId,
        type,
        quantity: quantityChange,
        previousQuantity,
        newQuantity,
        referenceType,
        referenceId,
        reason,
        createdBy: userId,
    });
    await transaction.save({ session });
    return inventory;
};
exports.adjustInventoryService = adjustInventoryService;
//# sourceMappingURL=inventory.service.js.map
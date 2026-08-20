"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaleByIdService = exports.getSalesService = exports.createSaleService = void 0;
const Sale_1 = require("../models/Sale");
const SaleItem_1 = require("../models/SaleItem");
const Product_1 = require("../models/Product");
const Farmer_1 = require("../models/Farmer");
const Sale_2 = require("../models/Sale");
const inventory_service_1 = require("./inventory.service");
const InventoryTransaction_1 = require("../models/InventoryTransaction");
const credit_service_1 = require("./credit.service");
const CreditTransaction_1 = require("../models/CreditTransaction");
const payment_service_1 = require("./payment.service");
const createSaleService = async (shopId, userId, data) => {
    const farmer = await Farmer_1.Farmer.findOne({ _id: data.farmerId, shopId });
    if (!farmer)
        throw { message: 'Farmer not found', statusCode: 404 };
    let subtotal = 0;
    const processedItems = [];
    for (const item of data.items) {
        const product = await Product_1.Product.findOne({ _id: item.productId, shopId });
        if (!product)
            throw { message: `Product ${item.productId} not found`, statusCode: 404 };
        if (product.status !== 'ACTIVE')
            throw { message: `Product ${product.name} is not active`, statusCode: 400 };
        const itemDiscount = item.discount || 0;
        const itemSubtotal = (product.sellingPrice * item.quantity) - itemDiscount;
        subtotal += itemSubtotal;
        processedItems.push({
            productId: product._id,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.sellingPrice,
            discount: itemDiscount,
            total: itemSubtotal,
        });
    }
    const total = subtotal - (data.discount || 0) + (data.tax || 0);
    let amountPaid = data.amountPaid || 0;
    if (data.paymentMethod === Sale_2.PaymentMethod.CREDIT) {
        amountPaid = 0;
    }
    const amountDue = total - amountPaid;
    let paymentStatus = 'UNPAID';
    if (amountDue <= 0)
        paymentStatus = 'PAID';
    else if (amountPaid > 0)
        paymentStatus = 'PARTIAL';
    const sale = new Sale_1.Sale({
        shopId,
        farmerId: data.farmerId,
        invoiceNumber: data.invoiceNumber,
        subtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total,
        amountPaid,
        amountDue,
        paymentStatus,
        paymentMethod: data.paymentMethod,
        createdBy: userId,
    });
    await sale.save();
    for (const pItem of processedItems) {
        const saleItem = new SaleItem_1.SaleItem({
            saleId: sale._id,
            ...pItem,
        });
        await saleItem.save();
        await (0, inventory_service_1.adjustInventoryService)(shopId, pItem.productId.toString(), -pItem.quantity, InventoryTransaction_1.TransactionType.SALE, userId, sale._id, 'SALE', `Sold in Invoice ${data.invoiceNumber}`);
    }
    // Handle Payment / Credit logic
    if (amountPaid > 0) {
        await (0, payment_service_1.createPaymentService)(shopId, userId, {
            referenceId: sale._id,
            referenceType: 'SALE',
            amount: amountPaid,
            paymentMethod: data.paymentMethod === Sale_2.PaymentMethod.PARTIAL ? Sale_2.PaymentMethod.CASH : data.paymentMethod,
            notes: `Payment for Invoice ${data.invoiceNumber}`,
        });
    }
    if (amountDue > 0) {
        await (0, credit_service_1.adjustCreditService)(shopId, data.farmerId, amountDue, CreditTransaction_1.CreditTransactionType.CREDIT_ADDED, userId, sale._id, `Credit for Invoice ${data.invoiceNumber}`);
    }
    return sale;
};
exports.createSaleService = createSaleService;
const getSalesService = async (shopId, skip, limit) => {
    const [sales, total] = await Promise.all([
        Sale_1.Sale.find({ shopId }).populate('farmerId', 'name phone').skip(skip).limit(limit).sort({ createdAt: -1 }),
        Sale_1.Sale.countDocuments({ shopId }),
    ]);
    return { sales, total };
};
exports.getSalesService = getSalesService;
const getSaleByIdService = async (shopId, saleId) => {
    const sale = await Sale_1.Sale.findOne({ _id: saleId, shopId }).populate('farmerId', 'name phone village address');
    if (!sale)
        throw { message: 'Sale not found', statusCode: 404 };
    const items = await SaleItem_1.SaleItem.find({ saleId: sale._id });
    return { sale, items };
};
exports.getSaleByIdService = getSaleByIdService;
//# sourceMappingURL=sale.service.js.map
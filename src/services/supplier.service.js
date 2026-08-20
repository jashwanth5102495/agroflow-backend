"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplierService = exports.updateSupplierService = exports.getSupplierByIdService = exports.getSuppliersService = exports.createSupplierService = void 0;
const Supplier_1 = require("../models/Supplier");
const createSupplierService = async (shopId, data) => {
    const existingSupplier = await Supplier_1.Supplier.findOne({ shopId, phone: data.phone });
    if (existingSupplier)
        throw { message: 'Supplier with this phone already exists', statusCode: 400 };
    const supplier = new Supplier_1.Supplier({ ...data, shopId });
    await supplier.save();
    return supplier;
};
exports.createSupplierService = createSupplierService;
const getSuppliersService = async (shopId, search, skip, limit) => {
    const query = { shopId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { companyName: { $regex: search, $options: 'i' } },
        ];
    }
    const [suppliers, total] = await Promise.all([
        Supplier_1.Supplier.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Supplier_1.Supplier.countDocuments(query),
    ]);
    return { suppliers, total };
};
exports.getSuppliersService = getSuppliersService;
const getSupplierByIdService = async (shopId, supplierId) => {
    const supplier = await Supplier_1.Supplier.findOne({ _id: supplierId, shopId });
    if (!supplier)
        throw { message: 'Supplier not found', statusCode: 404 };
    return supplier;
};
exports.getSupplierByIdService = getSupplierByIdService;
const updateSupplierService = async (shopId, supplierId, data) => {
    if (data.phone) {
        const existingPhone = await Supplier_1.Supplier.findOne({ shopId, phone: data.phone, _id: { $ne: supplierId } });
        if (existingPhone)
            throw { message: 'Supplier with this phone already exists', statusCode: 400 };
    }
    const supplier = await Supplier_1.Supplier.findOneAndUpdate({ _id: supplierId, shopId }, { $set: data }, { new: true, runValidators: true });
    if (!supplier)
        throw { message: 'Supplier not found', statusCode: 404 };
    return supplier;
};
exports.updateSupplierService = updateSupplierService;
const deleteSupplierService = async (shopId, supplierId) => {
    const supplier = await Supplier_1.Supplier.findOneAndDelete({ _id: supplierId, shopId });
    if (!supplier)
        throw { message: 'Supplier not found', statusCode: 404 };
    return supplier;
};
exports.deleteSupplierService = deleteSupplierService;
//# sourceMappingURL=supplier.service.js.map
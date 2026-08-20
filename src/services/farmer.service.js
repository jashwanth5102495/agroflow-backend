"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFarmerService = exports.updateFarmerService = exports.getFarmerByIdService = exports.getFarmersService = exports.createFarmerService = void 0;
const Farmer_1 = require("../models/Farmer");
const createFarmerService = async (shopId, data) => {
    const existingFarmer = await Farmer_1.Farmer.findOne({ shopId, phone: data.phone });
    if (existingFarmer) {
        throw { message: 'Farmer with this phone number already exists', statusCode: 400 };
    }
    const farmer = new Farmer_1.Farmer({ ...data, shopId });
    await farmer.save();
    return farmer;
};
exports.createFarmerService = createFarmerService;
const getFarmersService = async (shopId, search, skip, limit) => {
    const query = { shopId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { farmerCode: { $regex: search, $options: 'i' } },
        ];
    }
    const [farmers, total] = await Promise.all([
        Farmer_1.Farmer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Farmer_1.Farmer.countDocuments(query),
    ]);
    return { farmers, total };
};
exports.getFarmersService = getFarmersService;
const getFarmerByIdService = async (shopId, farmerId) => {
    const farmer = await Farmer_1.Farmer.findOne({ _id: farmerId, shopId });
    if (!farmer)
        throw { message: 'Farmer not found', statusCode: 404 };
    return farmer;
};
exports.getFarmerByIdService = getFarmerByIdService;
const updateFarmerService = async (shopId, farmerId, data) => {
    const farmer = await Farmer_1.Farmer.findOneAndUpdate({ _id: farmerId, shopId }, { $set: data }, { new: true, runValidators: true });
    if (!farmer)
        throw { message: 'Farmer not found', statusCode: 404 };
    return farmer;
};
exports.updateFarmerService = updateFarmerService;
const deleteFarmerService = async (shopId, farmerId) => {
    const farmer = await Farmer_1.Farmer.findOneAndDelete({ _id: farmerId, shopId });
    if (!farmer)
        throw { message: 'Farmer not found', statusCode: 404 };
    return farmer;
};
exports.deleteFarmerService = deleteFarmerService;
//# sourceMappingURL=farmer.service.js.map
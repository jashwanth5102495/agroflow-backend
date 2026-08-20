import { Farmer } from '../models/Farmer';

export const createFarmerService = async (shopId: string, data: any) => {
  const existingFarmer = await Farmer.findOne({ shopId, phone: data.phone });
  if (existingFarmer) {
    throw { message: 'Farmer with this phone number already exists', statusCode: 400 };
  }

  const farmer = new Farmer({ ...data, shopId });
  await farmer.save();
  return farmer;
};

export const getFarmersService = async (shopId: string, search: string, skip: number, limit: number) => {
  const query: any = { shopId };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { farmerCode: { $regex: search, $options: 'i' } },
    ];
  }

  const [farmers, total] = await Promise.all([
    Farmer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Farmer.countDocuments(query),
  ]);

  return { farmers, total };
};

export const getFarmerByIdService = async (shopId: string, farmerId: string) => {
  const farmer = await Farmer.findOne({ _id: farmerId, shopId });
  if (!farmer) throw { message: 'Farmer not found', statusCode: 404 };
  return farmer;
};

export const updateFarmerService = async (shopId: string, farmerId: string, data: any) => {
  const farmer = await Farmer.findOneAndUpdate(
    { _id: farmerId, shopId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!farmer) throw { message: 'Farmer not found', statusCode: 404 };
  return farmer;
};

export const deleteFarmerService = async (shopId: string, farmerId: string) => {
  const farmer = await Farmer.findOneAndDelete({ _id: farmerId, shopId });
  if (!farmer) throw { message: 'Farmer not found', statusCode: 404 };
  return farmer;
};

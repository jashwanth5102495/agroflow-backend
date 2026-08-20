import { Supplier } from '../models/Supplier';

export const createSupplierService = async (shopId: string, data: any) => {
  const existingSupplier = await Supplier.findOne({ shopId, phone: data.phone });
  if (existingSupplier) throw { message: 'Supplier with this phone already exists', statusCode: 400 };

  const supplier = new Supplier({ ...data, shopId });
  await supplier.save();
  return supplier;
};

export const getSuppliersService = async (shopId: string, search: string, skip: number, limit: number) => {
  const query: any = { shopId };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    Supplier.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Supplier.countDocuments(query),
  ]);

  return { suppliers, total };
};

export const getSupplierByIdService = async (shopId: string, supplierId: string) => {
  const supplier = await Supplier.findOne({ _id: supplierId, shopId });
  if (!supplier) throw { message: 'Supplier not found', statusCode: 404 };
  return supplier;
};

export const updateSupplierService = async (shopId: string, supplierId: string, data: any) => {
  if (data.phone) {
    const existingPhone = await Supplier.findOne({ shopId, phone: data.phone, _id: { $ne: supplierId } });
    if (existingPhone) throw { message: 'Supplier with this phone already exists', statusCode: 400 };
  }

  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId, shopId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!supplier) throw { message: 'Supplier not found', statusCode: 404 };
  return supplier;
};

export const deleteSupplierService = async (shopId: string, supplierId: string) => {
  const supplier = await Supplier.findOneAndDelete({ _id: supplierId, shopId });
  if (!supplier) throw { message: 'Supplier not found', statusCode: 404 };
  return supplier;
};

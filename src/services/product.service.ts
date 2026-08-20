import { Product } from '../models/Product';

export const createProductService = async (shopId: string, data: any) => {
  if (data.sku) {
    const existingSku = await Product.findOne({ shopId, sku: data.sku });
    if (existingSku) throw { message: 'Product with this SKU already exists', statusCode: 400 };
  }

  const product = new Product({ ...data, shopId });
  await product.save();
  return product;
};

export const getProductsService = async (shopId: string, search: string, skip: number, limit: number) => {
  const query: any = { shopId };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(query),
  ]);

  return { products, total };
};

export const getProductByIdService = async (shopId: string, productId: string) => {
  const product = await Product.findOne({ _id: productId, shopId });
  if (!product) throw { message: 'Product not found', statusCode: 404 };
  return product;
};

export const updateProductService = async (shopId: string, productId: string, data: any) => {
  if (data.sku) {
    const existingSku = await Product.findOne({ shopId, sku: data.sku, _id: { $ne: productId } });
    if (existingSku) throw { message: 'Product with this SKU already exists', statusCode: 400 };
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, shopId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!product) throw { message: 'Product not found', statusCode: 404 };
  return product;
};

export const deleteProductService = async (shopId: string, productId: string) => {
  const product = await Product.findOneAndDelete({ _id: productId, shopId });
  if (!product) throw { message: 'Product not found', statusCode: 404 };
  return product;
};

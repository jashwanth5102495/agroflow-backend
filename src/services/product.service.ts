import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';

export const createProductService = async (shopId: string, data: any) => {
  if (data.sku) {
    const existingSku = await Product.findOne({ shopId, sku: data.sku });
    if (existingSku) throw { message: 'Product with this SKU already exists', statusCode: 400 };
  }

  const productName = data.name ? String(data.name).trim().toUpperCase() : '';
  const product = new Product({
    ...data,
    name: productName,
    shopId,
    purchasePrice: Number(data.purchasePrice) || 0,
    sellingPrice: Number(data.sellingPrice) || 0,
    minimumStock: Number(data.minimumStock) || 10,
  });
  await product.save();

  // Automatically create corresponding inventory record
  const initialStock = Number(data.initialStock) || 0;
  await Inventory.findOneAndUpdate(
    { shopId, productId: product._id },
    { $setOnInsert: { shopId, productId: product._id, quantity: initialStock } },
    { upsert: true, new: true }
  );

  return product;
};

export const bulkCreateProductsService = async (shopId: string, items: any[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw { message: 'No products provided for import', statusCode: 400 };
  }

  const createdProducts = [];
  for (const item of items) {
    if (!item.name) continue;
    const cleanName = String(item.name).trim().toUpperCase();
    if (cleanName.length < 2) continue;

    const product = new Product({
      shopId,
      name: cleanName,
      category: item.category ? String(item.category).trim() : 'General',
      unit: item.unit ? String(item.unit).trim() : 'pcs',
      purchasePrice: Number(item.purchasePrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      minimumStock: Number(item.minimumStock) || 10,
      sku: item.sku ? String(item.sku).trim() : undefined,
      description: item.description ? String(item.description).trim() : undefined,
    });
    await product.save();

    const stock = Number(item.stock ?? item.quantity ?? item.initialStock) || 0;
    await Inventory.findOneAndUpdate(
      { shopId, productId: product._id },
      { $setOnInsert: { shopId, productId: product._id, quantity: stock } },
      { upsert: true, new: true }
    );
    createdProducts.push(product);
  }

  return { importedCount: createdProducts.length, products: createdProducts };
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

  if (data.name && typeof data.name === 'string') {
    data.name = data.name.trim().toUpperCase();
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
  await Inventory.findOneAndDelete({ shopId, productId });
  return product;
};

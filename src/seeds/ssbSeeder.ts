import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Shop } from '../models/Shop';
import { User, UserRole } from '../models/User';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { InventoryTransaction, TransactionType } from '../models/InventoryTransaction';
import { connectDB } from '../config/database';
import { ssbShopProfile, ssbProductsList } from './ssbProductsData';

export interface SeedOptions {
  force?: boolean;
}

export const seedSSBHiTechFarmProducts = async (options: SeedOptions = {}) => {
  console.log('🌱 [SSB Seeder] Checking SSB Hi-Tech farm shop and products...');

  // 1. Locate or create Shop
  let shop = await Shop.findOne({
    $or: [
      { phone: ssbShopProfile.phone },
      { name: { $regex: new RegExp(`^${ssbShopProfile.name}$`, 'i') } },
    ],
  });

  if (!shop) {
    console.log('🏢 [SSB Seeder] Shop not found. Registering "SSB Hi-Tech farm"...');
    shop = new Shop({
      ...ssbShopProfile,
    });
    await shop.save();
    console.log(`✅ [SSB Seeder] Created shop with ID: ${shop._id}`);
  } else {
    console.log(`🏢 [SSB Seeder] Found existing shop: ${shop.name} (${shop._id})`);
  }

  // 2. Locate or create Owner User
  let owner = await User.findOne({ phone: ssbShopProfile.phone });
  if (!owner) {
    console.log('👤 [SSB Seeder] Owner account not found. Creating user "Anand D"...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('ssbfarm123', salt);

    owner = new User({
      shopId: shop._id,
      name: ssbShopProfile.ownerName,
      phone: ssbShopProfile.phone,
      passwordHash,
      role: UserRole.OWNER,
      status: 'ACTIVE',
    });
    await owner.save();
    console.log(`✅ [SSB Seeder] Created owner user: ${owner.name} (${owner.phone})`);
  } else if (!owner.shopId || owner.shopId.toString() !== shop._id.toString()) {
    owner.shopId = shop._id as mongoose.Types.ObjectId;
    await owner.save();
  }

  // 3. Check existing products count
  const existingCount = await Product.countDocuments({ shopId: shop._id });
  console.log(`📦 [SSB Seeder] Currently ${existingCount} products exist for shop.`);

  if (existingCount >= 500 && !options.force) {
    console.log(`ℹ️ [SSB Seeder] SSB Hi-Tech farm already has ${existingCount} products seeded. Skipping.`);
    return {
      success: true,
      shopId: shop._id,
      shopName: shop.name,
      alreadySeeded: true,
      productCount: existingCount,
    };
  }

  // 4. Batch seed / upsert products and inventories
  console.log(`🚀 [SSB Seeder] Starting product and inventory seeding for ${ssbProductsList.length} items...`);
  let createdCount = 0;
  let updatedCount = 0;
  let totalStockCount = 0;

  for (const item of ssbProductsList) {
    totalStockCount += item.quantity;

    // Check if product exists by SKU or by Name
    let product = await Product.findOne({
      shopId: shop._id,
      $or: [{ sku: item.sku }, { name: item.name }],
    });

    if (!product) {
      product = new Product({
        shopId: shop._id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        sku: item.sku,
        description: item.description,
        unit: item.unit,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        minimumStock: item.minimumStock,
        status: 'ACTIVE',
      });
      await product.save();
      createdCount++;
    } else {
      // Update details if needed
      product.category = item.category;
      product.brand = item.brand;
      product.unit = item.unit;
      product.description = item.description;
      if (!product.sku) product.sku = item.sku;
      await product.save();
      updatedCount++;
    }

    // 5. Ensure Inventory record exists with the audited quantity
    let inventory = await Inventory.findOne({
      shopId: shop._id,
      productId: product._id,
    });

    if (!inventory) {
      inventory = new Inventory({
        shopId: shop._id,
        productId: product._id,
        quantity: item.quantity,
        lastUpdated: new Date(),
      });
      await inventory.save();

      // Record transaction
      if (item.quantity > 0) {
        await InventoryTransaction.create({
          shopId: shop._id,
          productId: product._id,
          type: TransactionType.ADJUSTMENT,
          quantity: item.quantity,
          previousQuantity: 0,
          newQuantity: item.quantity,
          reason: 'Physical Inventory Audit Initial Stock Seeding',
          createdBy: owner._id,
        });
      }
    } else if (options.force || inventory.quantity === 0) {
      const prev = inventory.quantity;
      inventory.quantity = item.quantity;
      inventory.lastUpdated = new Date();
      await inventory.save();

      if (item.quantity !== prev) {
        await InventoryTransaction.create({
          shopId: shop._id,
          productId: product._id,
          type: TransactionType.ADJUSTMENT,
          quantity: item.quantity - prev,
          previousQuantity: prev,
          newQuantity: item.quantity,
          reason: 'Physical Inventory Audit Stock Sync',
          createdBy: owner._id,
        });
      }
    }
  }

  const finalTotalProducts = await Product.countDocuments({ shopId: shop._id });
  console.log(`✅ [SSB Seeder] Seeding finished! Created: ${createdCount}, Updated: ${updatedCount}. Total Products: ${finalTotalProducts}. Total Stock: ${totalStockCount} units.`);

  return {
    success: true,
    shopId: shop._id,
    shopName: shop.name,
    created: createdCount,
    updated: updatedCount,
    totalProducts: finalTotalProducts,
    totalStock: totalStockCount,
  };
};

// Allow standalone CLI execution: tsx src/seeds/ssbSeeder.ts [--force]
if (require.main === module) {
  connectDB()
    .then(async () => {
      const isForce = process.argv.includes('--force');
      await seedSSBHiTechFarmProducts({ force: isForce });
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ [SSB Seeder CLI Error]:', err);
      process.exit(1);
    });
}

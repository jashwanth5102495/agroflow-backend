import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Shop } from '../models/Shop';
import { User, UserRole } from '../models/User';
import { Product } from '../models/Product';
import { SaleItem } from '../models/SaleItem';
import { PurchaseItem } from '../models/PurchaseItem';
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

  // Ensure all existing products have their stock unit updated to 'pcs' (pieces)
  const unitUpdateResult = await Product.updateMany(
    {
      $or: [
        { unit: { $in: ['gm', 'kg', 'ml', 'L', 'ltr', 'liter', 'litre', 'g', 'GM', 'KG', 'ML', 'LTR', 'Liter', 'Litre', 'unit'] } },
        { unit: { $exists: false } },
        { unit: null },
        { unit: '' },
      ],
    },
    { $set: { unit: 'pcs' } }
  );
  if (unitUpdateResult.modifiedCount > 0) {
    console.log(`✅ [SSB Seeder] Updated ${unitUpdateResult.modifiedCount} products' unit to 'pcs'.`);
  }

  // Safely update existing product names: "Name (Quantity)" -> "Name-Quantity" (e.g. Infinito (100 ml) -> Infinito-100 ml)
  // Strictly in-place updates: NO deletions, NO recreation, preserves all historical sales, inventory, and relations.
  const quantityBracketRegex = /\s*\(([0-9.]+\s*(?:gm|g|kg|ml|l|ltr|liter|litre|pcs|box|pkt|packet|bag|bottle)s?)\)\s*$/i;
  const productsWithQuantityBrackets = await Product.find({
    name: { $regex: /\([0-9.]+\s*(?:gm|g|kg|ml|l|ltr|liter|litre|pcs|box|pkt|packet|bag|bottle)s?\)/i },
  }).select('_id name');

  let renamedCount = 0;
  for (const p of productsWithQuantityBrackets) {
    const formattedName = p.name.replace(quantityBracketRegex, '-$1');
    if (formattedName !== p.name) {
      await Product.updateOne({ _id: p._id }, { $set: { name: formattedName } });
      renamedCount++;
    }
  }
  if (renamedCount > 0) {
    console.log(`✅ [SSB Seeder] Formatted ${renamedCount} products from "Name (Quantity)" to "Name-Quantity".`);
  }

  // Convert all existing product names to UPPERCASE in-place without deleting or dropping anything
  const allExistingProducts = await Product.find().select('_id name');
  let uppercaseCount = 0;
  for (const p of allExistingProducts) {
    if (p.name && p.name !== p.name.toUpperCase()) {
      await Product.updateOne({ _id: p._id }, { $set: { name: p.name.toUpperCase() } });
      uppercaseCount++;
    }
  }
  if (uppercaseCount > 0) {
    console.log(`✅ [SSB Seeder] Converted ${uppercaseCount} existing products to UPPERCASE in database.`);
  }

  // Also convert existing SaleItem and PurchaseItem product names to UPPERCASE
  const allSaleItems = await SaleItem.find().select('_id productName');
  let saleItemCount = 0;
  for (const si of allSaleItems) {
    if (si.productName && si.productName !== si.productName.toUpperCase()) {
      await SaleItem.updateOne({ _id: si._id }, { $set: { productName: si.productName.toUpperCase() } });
      saleItemCount++;
    }
  }
  if (saleItemCount > 0) {
    console.log(`✅ [SSB Seeder] Converted ${saleItemCount} sale item product names to UPPERCASE.`);
  }

  const allPurchaseItems = await PurchaseItem.find().select('_id productName');
  let purchaseItemCount = 0;
  for (const pi of allPurchaseItems) {
    if (pi.productName && pi.productName !== pi.productName.toUpperCase()) {
      await PurchaseItem.updateOne({ _id: pi._id }, { $set: { productName: pi.productName.toUpperCase() } });
      purchaseItemCount++;
    }
  }
  if (purchaseItemCount > 0) {
    console.log(`✅ [SSB Seeder] Converted ${purchaseItemCount} purchase item product names to UPPERCASE.`);
  }

  if (existingCount >= 500 && !options.force) {
    console.log(`ℹ️ [SSB Seeder] SSB Hi-Tech farm already has ${existingCount} products seeded. Skipping full re-insert.`);
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

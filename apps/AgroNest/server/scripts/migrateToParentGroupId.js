const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} total products.`);

    let updatedCount = 0;

    for (let p of products) {
      if (p.isParentProduct || p.hasVariations) {
        // If it's the old "Parent Shell", it's useless now, BUT wait! 
        // We shouldn't delete it, we should maybe make it the Base Weight product if it has stock,
        // or delete it and rely on its children.
        // Wait, the children have stock, the parent doesn't.
        // We can just keep it as a variation? Or delete it?
        // Let's just update all products to have parentGroupId = slug (if parent) or parent's slug (if child)
        
        p.parentGroupId = p.slug;
        p.weight = p.variationLabel || p.unit;
        await p.save();
        updatedCount++;
      } else if (p.parentProductId) {
        // Find its parent to get the slug
        const parent = products.find(prod => prod._id.toString() === p.parentProductId.toString());
        if (parent) {
          p.parentGroupId = parent.slug;
        } else {
          p.parentGroupId = p.slug; // Fallback
        }
        p.weight = p.variationLabel || p.unit;
        await p.save();
        updatedCount++;
      } else {
        // Single product
        p.parentGroupId = p.slug;
        p.weight = p.variationLabel || p.unit || '1 Unit';
        await p.save();
        updatedCount++;
      }
    }
    
    console.log(`Successfully migrated ${updatedCount} products to parentGroupId format.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();

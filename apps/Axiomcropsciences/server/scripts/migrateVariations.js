const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find all products that don't have a parentProductId and are not marked as isParentProduct
    const legacyProducts = await Product.find({ 
      isParentProduct: { $ne: true },
      parentProductId: null 
    });

    console.log(`Found ${legacyProducts.length} legacy products to migrate.`);

    for (let p of legacyProducts) {
      console.log(`Migrating: ${p.name} (ID: ${p._id})`);

      // 1. Create a NEW parent product
      // We take the slug, name, images, description, category, and feature flags.
      const parentData = {
        name: p.name,
        slug: p.slug, // Steal the SEO slug from the original
        category: p.category,
        description: p.description,
        shortDescription: p.shortDescription,
        images: p.images,
        isParentProduct: true,
        hasVariations: true,
        
        // Base values (just copied from original for display)
        price: p.price,
        stock: p.stock,
        unit: p.unit,

        visibleInB2B: p.visibleInB2B,
        visibleInB2C: p.visibleInB2C,
        isFeatured: p.isFeatured,
        isTopProduct: p.isTopProduct,
        isNewArrival: p.isNewArrival,
        isBestSeller: p.isBestSeller,
        isTrending: p.isTrending,
        isSeasonal: p.isSeasonal,
        status: p.status,
        badge: p.badge,
        brand: p.brand
      };

      // Since the original product is keeping its ID, we must free up its slug
      // before we can create the parent with the original slug.
      const originalSlug = p.slug;
      
      // Give the original product (which will become a variation) a unique child slug
      const newChildSlug = `${originalSlug}-default-var-${Math.floor(Math.random()*1000)}`;
      
      // Update the original BEFORE creating the parent to free the slug constraint
      await Product.updateOne({ _id: p._id }, { 
        $set: { 
          slug: newChildSlug,
          isParentProduct: false,
          hasVariations: false,
          variationLabel: p.unit || 'Default'
        }
      });

      // Now create the Parent
      const newParent = await Product.create(parentData);

      // Now map the child to the new parent
      await Product.updateOne({ _id: p._id }, {
        $set: { parentProductId: newParent._id }
      });

      console.log(` -> Parent created: ${newParent._id}`);
      console.log(` -> Original mapped as variation: ${newChildSlug}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();

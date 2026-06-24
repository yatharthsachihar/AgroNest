const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const syncImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all parent products
    const parents = await Product.find({ isParentProduct: true });
    
    for (const parent of parents) {
      await Product.updateMany(
        { parentProductId: parent._id },
        { $set: { images: parent.images } }
      );
      console.log(`Synced images for children of ${parent.name}`);
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

syncImages();

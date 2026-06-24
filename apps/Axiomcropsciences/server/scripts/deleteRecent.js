const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

const run = async () => {
  try {
    const uri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
    await mongoose.connect(uri);
    
    // Find products created in the last 6 hours
    const docs = await Product.find({ 
      createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } 
    });
    
    console.log(`Found ${docs.length} products created recently.`);
    
    if (docs.length > 0) {
      await Product.deleteMany({ _id: { $in: docs.map(d => d._id) } });
      console.log('Successfully deleted the recently created products.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
};

run();

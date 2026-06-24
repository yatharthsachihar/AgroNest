require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiomcropsciences';
  const fallbackUri = uri.includes('localhost') ? uri.replace('localhost', '127.0.0.1') : uri;

  try {
    await mongoose.connect(fallbackUri);
    console.log(`✓ MongoDB connected to: ${fallbackUri}`);
  } catch (err) {
    console.error(`✗ MongoDB connection to ${fallbackUri} failed:`, err.message);
    if (fallbackUri !== uri) {
      try {
        console.log(`Retrying with original URI: ${uri}`);
        await mongoose.connect(uri);
        console.log('✓ MongoDB connected to: ' + uri);
      } catch (retryErr) {
        console.error('✗ MongoDB retry connection failed:', retryErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const updateCategories = async () => {
  await connectDB();

  const categoryImages = [
    { slug: 'seeds', image: '/uploads/ChatGPT seed category Jun 9, 2026, 05_26_44 PM.png' },
    { slug: 'fertilizers', image: '/uploads/Fertilizer_category_card_design_202606091808.jpeg' },
    { slug: 'pesticides', image: '/uploads/ChatGPT pesticides Jun 9, 2026, 05_44_17 PM.png' },
    { slug: 'herbicides', image: '/uploads/Herbicides_category_202606091815.jpeg' },
    { slug: 'tools', image: '/uploads/ChatGPT seed category Jun 9, 2026, 05_26_44 PM.png' },
    { slug: 'irrigation', image: '/uploads/ChatGPT seed category Jun 9, 2026, 05_26_44 PM.png' },
    { slug: 'organic', image: '/uploads/ChatGPT seed category Jun 9, 2026, 05_26_44 PM.png' },
  ];

  for (const cat of categoryImages) {
    const result = await Category.updateOne(
      { slug: cat.slug },
      { $set: { image: cat.image } }
    );
    console.log(`✓ Updated category: ${cat.slug}`);
  }

  console.log('\n✓ All categories updated with images!');
  mongoose.connection.close();
};

updateCategories().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

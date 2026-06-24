const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiomcropsciences';
  const fallbackUri = uri.includes('localhost') ? uri.replace('localhost', '127.0.0.1') : uri;

  try {
    await mongoose.connect(fallbackUri);
    console.log(`MongoDB connected to: ${fallbackUri}`);
  } catch (err) {
    console.error(`MongoDB connection to ${fallbackUri} failed:`, err.message);
    if (fallbackUri !== uri) {
      try {
        console.log(`Retrying connection with original URI: ${uri}`);
        await mongoose.connect(uri);
        console.log('MongoDB connected to: ' + uri);
      } catch (retryErr) {
        console.error('MongoDB retry connection failed:', retryErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;

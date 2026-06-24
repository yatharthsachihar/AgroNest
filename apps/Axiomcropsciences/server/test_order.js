const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1:27017/axiomcropsciences').then(async () => {
  const User = require('./models/User');
  const Product = require('./models/Product');
  const user = await User.findOne();
  const product = await Product.findOne();
  if(!user || !product) { console.log('Missing user or product'); process.exit(); }
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
  
  try {
    const res = await axios.post('http://localhost:5001/api/orders', {
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      customerName: 'Test',
      customerEmail: user.email,
      customerPhone: '1234567890',
      address: 'Test',
      city: 'Test',
      state: 'Test',
      pincode: '123456',
      paymentMethod: 'Razorpay'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data._id);
  } catch(err) {
    console.error('Error:', err.response?.data || err.message);
  }
  process.exit();
});

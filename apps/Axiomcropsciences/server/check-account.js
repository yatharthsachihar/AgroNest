/**
 * Diagnostic: check if yatharthsachihar@gmail.com exists in admins vs users collection
 */
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiomcropsciences';

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const email = 'yatharthsachihar@gmail.com';

  const adminDoc = await db.collection('admins').findOne({ email });
  const userDoc  = await db.collection('users').findOne({ email });

  console.log('--- admins collection ---');
  console.log(adminDoc ? JSON.stringify(adminDoc, null, 2) : 'NOT FOUND');

  console.log('--- users collection ---');
  console.log(userDoc ? JSON.stringify(userDoc, null, 2) : 'NOT FOUND');

  await mongoose.disconnect();
})();

/**
 * DB Connectivity & User-Collection Diagnostic
 * -----------------------------------------------
 * Run with:  node check-db.js
 *
 * What it does:
 * 1. Connects to MongoDB using the same logic as config/db.js
 * 2. Confirms the connection and prints the DB name
 * 3. Counts documents in `admins` and `users` collections
 * 4. Lists ALL indexes on the `users` collection — flags any
 *    unexpected unique index (e.g. a leftover `username_1` from
 *    an old schema) which causes E11000 duplicate-key errors on
 *    every new registration/login attempt.
 * 5. Prints the first 3 user documents (without password) so you
 *    can see if accounts already exist.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiomcropsciences';
const fallbackUri = uri.includes('localhost') ? uri.replace('localhost', '127.0.0.1') : uri;

const EXPECTED_USER_INDEX_FIELDS = ['_id', 'email', 'mobile'];

async function run() {
  console.log('Connecting to:', fallbackUri);
  try {
    await mongoose.connect(fallbackUri);
  } catch (err) {
    console.error('❌ Connection failed on', fallbackUri, '-', err.message);
    if (fallbackUri !== uri) {
      console.log('Retrying with:', uri);
      await mongoose.connect(uri);
    } else {
      throw err;
    }
  }

  const db = mongoose.connection.db;
  console.log('✅ Connected. Database name:', db.databaseName);
  console.log('---------------------------------------------');

  // Collections present
  const collections = await db.listCollections().toArray();
  console.log('Collections found:', collections.map(c => c.name).join(', '));
  console.log('---------------------------------------------');

  // Admin count
  const adminCount = await db.collection('admins').countDocuments().catch(() => 'collection not found');
  console.log('admins documents:', adminCount);

  // User count
  const userCount = await db.collection('users').countDocuments().catch(() => 'collection not found');
  console.log('users documents:', userCount);
  console.log('---------------------------------------------');

  // Indexes on users collection
  try {
    const indexes = await db.collection('users').indexes();
    console.log('Indexes on "users" collection:');
    let foundStale = false;
    indexes.forEach(idx => {
      const fields = Object.keys(idx.key);
      const isExpected = fields.every(f => EXPECTED_USER_INDEX_FIELDS.includes(f));
      const flag = (idx.unique && !isExpected) ? '  ⚠️  STALE / UNEXPECTED UNIQUE INDEX' : '';
      console.log(`  - ${idx.name}  fields=[${fields.join(', ')}]  unique=${!!idx.unique}${flag}`);
      if (flag) foundStale = true;
    });
    if (foundStale) {
      console.log('');
      console.log('⚠️  Found a unique index on a field that is no longer in the User schema.');
      console.log('   This will cause "E11000 duplicate key error" on every new registration');
      console.log('   if existing documents (or even zero documents) have null/missing values');
      console.log('   for that field, because MongoDB treats multiple nulls as duplicates.');
      console.log('');
      console.log('   FIX: drop the stale index by running this in a Mongo shell / Compass:');
      console.log('     db.users.dropIndex("<index_name_from_above>")');
    } else {
      console.log('No stale indexes found — index list matches the current schema.');
    }
  } catch (err) {
    console.log('Could not read indexes (collection may not exist yet):', err.message);
  }
  console.log('---------------------------------------------');

  // Sample users
  const sampleUsers = await db.collection('users').find({}, { projection: { password: 0 } }).limit(3).toArray().catch(() => []);
  console.log('Sample user documents (max 3):');
  console.log(JSON.stringify(sampleUsers, null, 2));

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/axiomcropsciences').then(async () => {
  await mongoose.connection.db.collection('admins').updateMany(
    { role: 'superadmin' },
    { $set: { role: 'super_admin' } }
  );
  console.log('Updated DB');
  process.exit(0);
});

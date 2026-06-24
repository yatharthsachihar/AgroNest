const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const OLD_DB_URI = 'mongodb://127.0.0.1:27017/agronest';
const NEW_DB_URI = 'mongodb://127.0.0.1:27017/axiomcropsciences';

async function migrate() {
    try {
        console.log('Connecting to old database...');
        const oldConn = await mongoose.createConnection(OLD_DB_URI).asPromise();
        console.log('Connected to agronest');

        const newConn = await mongoose.createConnection(NEW_DB_URI).asPromise();
        console.log('Connected to axiomcropsciences');

        const db = oldConn.db;
        const newDb = newConn.db;

        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        const backupData = {};

        for (let colInfo of collections) {
            const colName = colInfo.name;
            if (colName === 'system.profile') continue;

            console.log(`Processing collection: ${colName}...`);
            const oldCol = db.collection(colName);
            const docs = await oldCol.find({}).toArray();

            // Save to backup
            backupData[colName] = docs;

            if (docs.length > 0) {
                // Rename agronest to axiomcropsciences in strings inside the documents
                const processDoc = (obj) => {
                    if (typeof obj === 'string') {
                        let newStr = obj.replace(/agronest/gi, 'axiomcropsciences');
                        newStr = newStr.replace(/AgroNest/g, 'Axiom Seeds');
                        newStr = newStr.replace(/Agro Nest/g, 'Axiom Seeds');
                        return newStr;
                    } else if (Array.isArray(obj)) {
                        return obj.map(processDoc);
                    } else if (obj !== null && typeof obj === 'object') {
                        if (obj instanceof Date || obj instanceof mongoose.Types.ObjectId || obj.__v != null) {
                            return obj; // Leave ObjectIds and Dates as is
                        }
                        const newObj = {};
                        for (let [k, v] of Object.entries(obj)) {
                            // Leave keys alone mostly unless needed, just change values
                            let newKey = k.replace(/agronest/gi, 'axiomcropsciences');
                            newObj[newKey] = processDoc(v);
                        }
                        return newObj;
                    }
                    return obj;
                };

                const newDocs = docs.map(doc => {
                    const newDoc = processDoc(doc);
                    // ensure _id is properly set to old _id
                    newDoc._id = doc._id;
                    return newDoc;
                });

                // Clear new collection and insert
                const newCol = newDb.collection(colName.replace(/agronest/gi, 'axiomcropsciences'));
                await newCol.deleteMany({});
                await newCol.insertMany(newDocs);
                console.log(`Migrated ${docs.length} documents in ${colName}`);
            }
        }

        // Write backup file
        const backupPath = path.join(__dirname, 'agronest_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`\nBackup saved to ${backupPath}`);
        console.log('Migration complete!');

        await oldConn.close();
        await newConn.close();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();

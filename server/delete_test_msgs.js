require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Find and delete the test messages
  const result = await db.collection('conversations').deleteMany({
    $or: [
      { content: { $regex: /test message/i } },
      { content: { $regex: /simulated message/i } },
      { content: { $regex: /Hello from test/i } }
    ]
  });
  
  console.log(`Deleted ${result.deletedCount} test messages from the database.`);
  process.exit(0);
});

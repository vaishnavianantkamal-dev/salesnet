require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const msgs = await db.collection('conversations').find({direction: 'inbound'}).sort({createdAt: -1}).limit(5).toArray();
  const logs = await db.collection('webhooklogs').find().sort({createdAt: -1}).limit(5).toArray();
  console.log('Inbound msgs:', JSON.stringify(msgs, null, 2));
  console.log('Webhook logs:', JSON.stringify(logs, null, 2));
  process.exit(0);
});

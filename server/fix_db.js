require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('integrations').updateOne(
    { name: 'meta_whatsapp' },
    { $set: { 'config.appSecret': '6aacd309fefef2bc39637b72804dd36c' } }
  );
  console.log('Updated DB App Secret successfully');
  process.exit(0);
});

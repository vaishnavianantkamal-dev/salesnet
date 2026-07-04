require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const Integration = require('./src/models/Integration.model');

async function checkWA() {
  try {
    await mongoose.connect(env.MONGO_URI);
    const doc = await Integration.findOne({ name: 'meta_whatsapp' }).lean();
    console.log('Current DB state:', doc);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkWA();

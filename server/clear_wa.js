require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const Integration = require('./src/models/Integration.model');

async function clearWA() {
  try {
    await mongoose.connect(env.MONGO_URI);
    await Integration.deleteOne({ name: 'meta_whatsapp' });
    console.log('Successfully cleared WA integration from DB.');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

clearWA();

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const Conversation = require('./src/models/Conversation.model');

async function checkConv() {
  try {
    await mongoose.connect(env.MONGO_URI);
    const list = await Conversation.find().sort({ createdAt: -1 }).limit(5).lean();
    console.log('Last 5 conversations saved in DB:');
    list.forEach(c => {
      console.log(`Lead: ${c.lead}, Channel: ${c.channel}, Direction: ${c.direction}, Content: "${c.content}"`);
    });
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkConv();
//jhnxjnx
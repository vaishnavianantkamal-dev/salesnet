require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const env = require('./src/config/env');
const Lead = require('./src/models/Lead.model');

async function testInbox() {
  try {
    await mongoose.connect(env.MONGO_URI);
    
    // Find an active lead
    const lead = await Lead.findOne({ isDeleted: false });
    if (!lead) {
      console.log('No leads found in DB. Please create a lead first.');
      mongoose.disconnect();
      return;
    }
    
    const phone = lead.contact.phone;
    console.log(`Found lead: ${lead.contact.name} with phone: ${phone}`);

    // Simulate WhatsApp message from this lead via Wapzio
    const payloadWA = {
      from: phone,
      text: 'Hello from test WhatsApp message!',
      channel: 'whatsapp',
      id: 'wa-msg-' + Date.now()
    };

    // Simulate Facebook message from this lead via Wapzio
    const payloadFB = {
      from: phone,
      text: 'Hello from test Facebook message!',
      channel: 'facebook',
      id: 'fb-msg-' + Date.now()
    };

    console.log('Sending WhatsApp webhook simulation...');
    const resWA = await axios.post('http://localhost:5000/api/webhooks/wapzio', payloadWA);
    console.log('WhatsApp Response:', resWA.status, resWA.data);

    console.log('Sending Facebook webhook simulation...');
    const resFB = await axios.post('http://localhost:5000/api/webhooks/wapzio', payloadFB);
    console.log('Facebook Response:', resFB.status, resFB.data);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
    mongoose.disconnect();
  }
}

testInbox();

const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/temp/Desktop/salesnet/SalesNets-Crm/server/.env' });
const Lead = require('c:/Users/temp/Desktop/salesnet/SalesNets-Crm/server/src/models/Lead.model.js');

async function checkLeads() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  const leads = await Lead.find({
    $or: [
      { 'contact.name': /sachin shelar/i },
      { 'contact.name': /avinash pagar/i }
    ]
  }).lean();
  
  console.log('Found leads:', JSON.stringify(leads, null, 2));
  process.exit(0);
}
checkLeads().catch(console.error);

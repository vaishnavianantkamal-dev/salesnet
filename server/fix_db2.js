require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('integrations').updateOne(
    { name: 'meta_whatsapp' },
    { 
      $set: { 
        'config.appSecret': '6aacd309fefef2bc39537b72004dd36c',
        'config.accessToken': 'EAAjFlCwmZA9kBRZCZBvP8PZAbJAmEUgvB9CZByyMWH528HtOpcZBhGZAP2XtFEE68bQKvFKhn95sLt4y1gnJBVkZBtBQpUXpi6yx6LxzZBLhTWZABevK8EM2B7mGvZBIAyf4EQWmzVZCaqEJoCUYPxr4BUuRR0VeIax9oufFdfvHO3ZBneVBD585ei3iIoXQt1Mu5X5NzkAZDZD',
        'config.phoneNumberId': '1202917926235376',
        'config.businessAccountId': '1714076823244592'
      } 
    },
    { upsert: true }
  );
  console.log('Updated DB with provided Meta config successfully');
  process.exit(0);
});

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const Integration = require('./src/models/Integration.model');

async function seedWA() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to DB');

    const config = {
      appSecret: '6aacd309fefef2bc39537b72004dd36c',
      webhookVerifyToken: 'c08FK1XjscUDRIXpmBJPr03G1kxnduxXacoo7b1a39fe4a0c',
      phoneNumberId: '1202917926235376',
      accessToken: 'EAAjFlCwmZA9kBRZCZBvP8PZAbJAmEUgvB9CZByyMWH528HtOpcZBhGZAP2XtFEE68bQKvFKhn95sLt4y1gnJBVkZBtBQpUXpi6yx6LxzZBLhTWZABevK8EM2B7mGvZBIAyf4EQWmzVZCaqEJoCUYPxr4BUuRR0VeIax9oufFdfvHO3ZBneVBD585ei3iIoXQt1Mu5X5NzkAZDZD',
      businessAccountId: '1714076823244592',
    };

    const doc = await Integration.findOneAndUpdate(
      { name: 'meta_whatsapp' },
      {
        $set: {
          type: 'whatsapp',
          config,
          isActive: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Successfully updated WA integration in DB:', doc._id);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

seedWA();

const mongoose = require('mongoose');
const uri = 'mongodb://anantkamalai_db_user:DW12qkFT1p7wOPWC@ac-knem00p-shard-00-00.u813olb.mongodb.net:27017,ac-knem00p-shard-00-01.u813olb.mongodb.net:27017,ac-knem00p-shard-00-02.u813olb.mongodb.net:27017/salesnest?ssl=true&replicaSet=atlas-knem00p-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });

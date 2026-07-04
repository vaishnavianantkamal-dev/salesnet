const fs = require('fs');
const path = require('path');

const paths = [
  path.join(process.env.LOCALAPPDATA, 'AntiGravity'),
  path.join(process.env.APPDATA, 'AntiGravity'),
  path.join(process.env.LOCALAPPDATA, 'Google/Chrome/User Data'),
  'C:\\Program Files\\AntiGravity',
  'C:\\Program Files (x86)\\AntiGravity'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    console.log(`FOUND PATH: ${p}`);
    try {
      const files = fs.readdirSync(p);
      console.log(`Contents:`, files.slice(0, 10));
    } catch(err) {
      console.log(`Error reading: ${err.message}`);
    }
  } else {
    console.log(`Not found: ${p}`);
  }
});

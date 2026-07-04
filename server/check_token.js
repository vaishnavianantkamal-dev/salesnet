const https = require('https');

const token = 'EAAXUewM6B0sBRw6bBF7oua7rPRzHoGVCDXsF3npqkqTSoKp01QAsdk2gZAvPRFxZBdVblZA6QI4h8FMat4KAzBzoYxeP20Hexat6uWZC9QgpnZBnQEVOiSNjYfOHbdnJVaxgpQwIz5Ic3bkcgMnCr9679wchXdZA5r8lRfFVkaIngyH2rXZAWZBzAJrr5aqRq5T4YvdYMR5kPxKnSn81Npaw';

https.get(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Permissions:', data);
  });
}).on('error', console.error);

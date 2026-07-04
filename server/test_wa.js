const https = require('https');

const phoneNumberId = '1040211572513739';
const accessToken = 'EAAXUewM6B0sBRw6bBF7oua7rPRzHoGVCDXsF3npqkqTSoKp01QAsdk2gZAvPRFxZBdVblZA6QI4h8FMat4KAzBzoYxeP20Hexat6uWZC9QgpnZBnQEVOiSNjYfOHbdnJVaxgpQwIz5Ic3bkcgMnCr9679wchXdZA5r8lRfFVkaIngyH2rXZAWZBzAJrr5aqRq5T4YvdYMR5kPxKnSn81Npaw';

const url = `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=id,display_phone_number,verified_name`;

const req = https.request(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', console.error);
req.end();

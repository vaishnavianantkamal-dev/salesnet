const http = require('http');

const ports = [9222, 9333, 9444, 9555, 9666, 9999];

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, { timeout: 1000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ port, active: true, data: JSON.parse(data) });
        } else {
          resolve({ port, active: false });
        }
      });
    });

    req.on('error', () => {
      resolve({ port, active: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ port, active: false });
    });
  });
}

async function detect() {
  console.log('Detecting active CDP ports...');
  for (const port of ports) {
    const result = await checkPort(port);
    if (result.active) {
      console.log(`Port ${port} is ACTIVE:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`Port ${port} is inactive.`);
    }
  }
}

detect();

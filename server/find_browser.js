const { exec } = require('child_process');

const cmd = 'wmic process where "name like \'%chrome%\' or name like \'%browser%\' or name like \'%antigravity%\'" get CommandLine,ProcessId';

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  
  const lines = stdout.split('\n');
  console.log('Main Browser Processes:');
  lines.forEach(line => {
    if (line.includes('chrome.exe') && !line.includes('--type=')) {
      console.log(line.trim());
    }
  });
});

const { Client } = require('ssh2');

const conn = new Client();
//console.log(Client)

const remoteHost = '192.168.0.8'; // Replace with your remote server IP
const username = 'ptcs'; // Replace with your remote server username
const password = 'ptcs'; // Replace with your password
const folderToFind = 'content'; // Folder to search for
const requiredSubdirs = ['poster', 'movies', 'music']; // Required subdirectories

conn.on('ready', () => {
  console.log('SSH connection established');

  // Command to search for the folder across the entire system and check required subdirectories
  const command = `
    find / -type d -name "${folderToFind}" 2>/dev/null | while read -r folder; do
      if [ -d "$folder/${requiredSubdirs[0]}" ] && [ -d "$folder/${requiredSubdirs[1]}" ] && [ -d "$folder/${requiredSubdirs[2]}" ]; then
        echo "$folder";
      fi;
    done
  `;

  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('Error executing command:', err.message);
      conn.end();
      return;
    }

    let result = '';

    stream.on('data', (data) => {
      result += data.toString();
      //console.log(result);
    });

    stream.on('close', (code) => {
      if (code === 0 && result.trim()) {
        console.log('Folders with required subdirectories:');
        console.log(result.trim());
      } else {
        console.log(`No folder named '${folderToFind}' with the required subdirectories was found.`);
      }
      conn.end();
    });

    stream.stderr.on('data', (data) => {
      console.error('Error output:', data.toString());
    });
  });
}).on('error', (err) => {
  console.error('SSH connection failed:', err.message);
}).connect({
  host: remoteHost,
  port: 22, // Default SSH port
  username: username,
  password: password,
});

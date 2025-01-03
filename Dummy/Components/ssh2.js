const { Client } = require("ssh2");
const fs = require("fs");
const path = require("path");

let mainWindow;

const mainWindowfn = (window) => {
  // console.log("Setting mainWindow:", window);
  mainWindow = window;
};

const connectToActiveHosts = (hosts) => {
  if (!mainWindow) {
    console.error("Error: mainWindow is not defined.");
    return;
  }

  // Filter out only active hosts
  const activeHosts = hosts.filter((host) => host.status === "active");

  if (activeHosts.length === 0) {
    console.log("No active hosts found.");
    return;
  }

  activeHosts.forEach((host) => {
   // console.log(`Connecting to ${host.alianceName} (${host.ip})...`);
    connectViaSSH(host);
  });
};

const connectViaSSH = (host) => {
  const conn = new Client();
  const { ip, alianceName } = host;
  const privateKeyPath = path.join(__dirname, "../key/PTCS_key11.ppk");

  let connectionAttempted = false;

  const onConnectionSuccess = () => {
  //  console.log(`Connected to ${alianceName} (${ip})`);

    // Static paths to check
    const pathsToCheck = [
      "/home/ptcs/Desktop/ppsWebsite/src/content/database/INDEX.SYS",
      "/usr/share/apache2/htdocs/content/database/INDEX.SYS",
    ];

    // Iterate through the paths and check for the INDEX.SYS file
    checkFileExists(pathsToCheck);
  };

  const onConnectionFailure = (err) => {
    if (!connectionAttempted) {
      connectionAttempted = true;
      connectWithPassword(); // Try password authentication
    } else {
      console.error(`Connection to ${ip} failed: ${err.message}`);
      conn.end(); // Close the connection on failure
    }
  };

  const connectWithPassword = () => {
    conn
      .on("ready", onConnectionSuccess)
      .on("error", onConnectionFailure)
      .connect({
        host: ip,
        port: 22,
        username: "ptcs", // Username for password authentication
        password: "ptcs", // Password for password authentication
      });
  };

  const connectWithPrivateKey = () => {
    conn
      .on("ready", onConnectionSuccess)
      .on("error", onConnectionFailure)
      .connect({
        host: ip,
        port: 22,
        username: "root", // Username for private key authentication
        privateKey: fs.readFileSync(privateKeyPath), // Private key for authentication
      });
  };

  if (fs.existsSync(privateKeyPath)) {
    connectWithPrivateKey();
  } else {
    connectWithPassword();
  }

  // Function to check if the file exists at the specified paths
  const checkFileExists = (paths) => {
    for (let i = 0; i < paths.length; i++) {
      const checkPath = paths[i];
      const checkFileCommand = `test -f ${checkPath} && echo "exists" || echo "not found"`;

      conn.exec(checkFileCommand, (err, stream) => {
        if (err) {
          console.error(`Error checking file at ${checkPath}:`, err);
          return;
        }

        let fileStatus = "";
        stream.on("data", (data) => {
          fileStatus += data.toString("utf-8").trim();
        });

        stream.on("close", () => {
          if (fileStatus === "exists") {
            readFileContent(checkPath); // Proceed to read the file
          } else {
          //  console.log(`INDEX.SYS file not found at: ${checkPath}`);
          }
        });
      });
    }
  };

  // Function to read the content of the INDEX.SYS file
  const readFileContent = (filePath) => {
    const readFileCommand = `/bin/bash -c "cat ${filePath}"`;

    conn.exec(readFileCommand, (err, stream) => {
      if (err) {
        console.error("Error reading INDEX.SYS file:", err);
        conn.end();
        return;
      }

      let fileData = "";
      stream.on("data", (data) => {
        fileData += data.toString("utf-8");
      });

      stream.on("close", () => {
        const version_name = parseIndexSysData(fileData, ip, alianceName);
        conn.end(); // Close the connection after reading the file
      });
    });
  };
};

// Function to parse the INDEX.SYS data and log IP with version name
const parseIndexSysData = (data, ip, alianceName) => {
  let version_name = null;
  const rows = data.split("\n");

  rows.forEach((row) => {
    row = row.trim();
    if (row === "") return;

    const parts = row.split(/\s+/);

    if (parts.length >= 3) {
      const size = parts[1];
      const filename = parts.slice(2).join(" ");

      if (size === "00000000") {
        version_name = filename;
        console.log([
          `${ip}`,`${version_name}`
        ]);

        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send("Database_version_name_module", [
            `${ip}`, `${version_name}`
          ]);
        }
      }
    }
  });

  return version_name;
};

module.exports = { connectToActiveHosts, mainWindowfn };

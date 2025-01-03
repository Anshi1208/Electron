const { Client } = require("ssh2");
const fs = require("fs");

const connectViaSSH = (host) => {
  const conn = new Client();
  const { ip, alianceName } = host;
  const privateKeyPath =
    "C:/Users/PTC-SW1/Desktop/PTCS_SPUT_Tool/PTCS_key11.ppk";

  let connectionAttempted = false;

  const onConnectionSuccess = () => {
    console.log(`Connected to ${alianceName} (${ip})`);

    // Command to search for the INDEX.SYS file
    const findFileCommand = `find / -type f -name "INDEX.SYS" 2>/dev/null`;

    conn.exec(findFileCommand, (err, stream) => {
      if (err) {
        console.error("Error searching for INDEX.SYS file:", err);
        conn.end();
        return;
      }

      stream.on("data", (data) => {
        // Convert buffer to string
        const dataStr = data.toString("utf-8").trim();

        if (dataStr) {
          console.log(`INDEX.SYS file found at: ${dataStr}`);

          // Now that we have the file path, let's read the content
          const readFileCommand = `/bin/bash -c "cat ${dataStr}"`; // Run the command in a bash shell

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
              // Parse the file content into an array
              const fileArray = parseIndexSysData(fileData);
              // console.log("Parsed INDEX.SYS Data:", fileArray);
              conn.end(); // Close the connection after reading the file
            });
          });
        } else {
          console.log("No INDEX.SYS file found.");
          conn.end(); // Close the connection after search
        }
      });
    });
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
};

// Function to parse the INDEX.SYS data and return an array of objects
const parseIndexSysData = (data) => {
  // Arrays to store data for each column
  const crcArray = [];
  const sizeArray = [];
  const filenameArray = [];
  let version_name = null;
  const rows = data.split("\n");

  // Process each row to extract data
  rows.forEach((row) => {
    // Trim any extra spaces
    row = row.trim();

    // Skip empty lines
    if (row === "") return;

    // Split the row by whitespace (using regular expression to handle multiple spaces)
    const parts = row.split(/\s+/);

    // Ensure the row has 3 parts: CRC, SIZE, and FILENAME
    if (parts.length >= 3) {
      const crc = parts[0];
      const size = parts[1];
      const filename = parts.slice(2).join(" "); // Join the rest as filename

      // Push each value to its respective array
      crcArray.push(crc);
      sizeArray.push(size);
      filenameArray.push(filename);
      // Check if the size is "00000000" and log the filename
      if (size === "00000000") {
        version_name = filename;
        console.log(filename);
      }
    }
  });

  return version_name;
};

module.exports = {
  connectViaSSH,
};

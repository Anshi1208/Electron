const { Client } = require("ssh2");
const fs = require("fs");


const connectViaSSH = () => {
  const conn = new Client();

  const host = "192.168.0.243"; // Replace with your server address
  const port = 22; // Default SSH port

  // Attempt connection with the private key
  const privateKeyPath = "C:/Users/PTC-SW1/Desktop/PTCS_SPUT_Tool/PTCS_key11.ppk"; // Replace with the path to your private key

  // Check if the private key exists
  if (fs.existsSync(privateKeyPath)) {
    console.log("Attempting connection with private key...");
    conn
      .on("ready", () => {
        console.log("Connected via private key!");
        conn.end();
      })
      .connect({
        host,
        port,
        username: "root", // Username for private key connection
        privateKey: fs.readFileSync(privateKeyPath),
      });
  } else {
    console.log(
      "Private key not found. Attempting connection with password..."
    );
    conn
      .on("ready", () => {
        console.log("Connected via password!");
        conn.end();
      })
      .connect({
        host,
        port,
        username: "ptcs", // Username for password connection
        password: "ptcs", // Password for fallback connection
      });
  }

  conn.on("error", (err) => {
    console.error("Connection failed:", err.message);
  });
};

connectViaSSH();

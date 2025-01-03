
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");
const ping = require("ping");
const { connectToActiveHosts } = require("./ssh2");

//extract Ip address function
function extractIpAddresses() {
  const parser = new xml2js.Parser({ explicitArray: false });
  const xmlPath = path.join(__dirname, "../resources/Iot_Config.xml");
  const xmlData = fs.readFileSync(xmlPath, "utf-8");

  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        return reject(err);
      }

      const devices = result.IOTConfig.Device_list.Ipaddress;

      // Check if devices is an array based on the presence of a `length` property
      const ipAddresses = devices.length
        ? devices.map((device) => ({
            ip: device.$.ip,
            alianceName: device.$.aliance_name,
            status: "inactive",
          }))
        : [
            {
              ip: devices.$.ip,
              alianceName: devices.$.aliance_name,
              status: "inactive",
            },
          ];

      resolve(ipAddresses);
    });
  });
}
// Function to start the interval for continuous ping checking every second

// Function to check the status of all IP addresses (ping each host)
async function pingAllHosts(ipAddresses) {
  // Create an array of promises for pinging all hosts
  const pingPromises = ipAddresses.map(async (host) => {
    const isAlive = await new Promise((resolve) => {
      ping.sys.probe(host.ip, function (isAlive) {
        resolve(isAlive);
      });
    });
    // Update the host status based on the ping response
    host.status = isAlive ? "active" : "inactive";
    return host;
  });

  // Wait for all pings to complete and maintain the order of IP addresses
  const allUpdatedHosts = await Promise.all(pingPromises);
  // console.log(allUpdatedHosts);
  // Call the function to start connecting to active hosts
  connectToActiveHosts(allUpdatedHosts);

  // Return the updated hosts with their current status
  return allUpdatedHosts;
}


module.exports = {
  extractIpAddresses,
  pingAllHosts,
};

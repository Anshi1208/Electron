const fs = require("fs");
const path = require("path");

async function checkIndexSysForZeroSize(directory, mainWindow) {
  const indexSysPath = path.join(directory, "INDEX.SYS");
//console.log(indexSysPath);
  try {
    if (!fs.existsSync(indexSysPath)) {
  
      mainWindow.webContents.send("Database_version_name", ["DB Ver: _._._"]);
          throw new Error("INDEX.SYS file not found");
    }

    const data = fs.readFileSync(indexSysPath, "utf8");

    const version_name = data
      .split("\n")
      .filter((line) => {
        const parts = line.trim().split(/\s+/);
        return parts[1] === "00000000";
      })
      .map((line) => {
        // Extract the full file name (everything after the size field)
        const parts = line.trim().split(/\s+/); // Split by spaces or tabs
        return parts.slice(2).join(" "); // Join the remaining parts to form the full file name
      });

    if (version_name.length > 0) {
     // console.log("Zero-size files:", version_name);
      mainWindow.webContents.send("Database_version_name", version_name);
    } else {
     // console.log("No zero-size files found.");
      mainWindow.webContents.send("Database_version_name", ["DB Ver: _._._"]);
    }
  } catch (error) {
   // console.error("Error checking INDEX.SYS:", error.message);
    // mainWindow.webContents.send("Database_version_name-error", error.message);
  }
}

module.exports = { checkIndexSysForZeroSize };

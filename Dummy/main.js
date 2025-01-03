const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { mainWindowfn } = require("./Components/ssh2");
let mainWindow;
const { extractIpAddresses, pingAllHosts } = require("./Components/Connection");
const {
  chooseDirectory,
  handleDirectorySelection,
  checkSubfolders,
} = require("./Components/Directory");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
    //  resizable: false,
    title: "PTCS SPUT Tool",
    icon: path.join(__dirname, "./assets/pt_logo.jpg"), // Set your logo as the window icon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("./views/index.html");
  createMenu();
}

function createMenu() {
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Choose Directory",
          accelerator: "Ctrl+D",
          click: () => chooseDirectory(mainWindow),
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Open Toggle Developer Tools",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  // Fetch the list of IP addresses from XML or other source
  const ipAddresses = await extractIpAddresses();
  // Perform an initial ping check to update the status of all IP addresses
  const initialIpStatuses = await pingAllHosts(ipAddresses);
  // Start the continuous ping check every second for live status updates
  startPingInterval(ipAddresses);
  createWindow(); // Create the main window
  mainWindowfn(mainWindow)
  mainWindow.webContents.send("get-ip-addresses", initialIpStatuses);
});

function startPingInterval(ipAddresses) {
  setInterval(async () => {
    // Continuously update the status of each host every second
    const updatedHosts = await pingAllHosts(ipAddresses);
    // Send the updated status of each host to the renderer process

    mainWindow.webContents.send("ip-status-update", updatedHosts);
  }, 5000); // Ping every second (1000 ms)
}

ipcMain.on("selectedIps", (event, selectedIps) => {
  console.log("Selected IPs:", selectedIps);
});

ipcMain.on(
  "upload-folder",
  async (event, { selectedIps, selectedDirectory }) => {
    if (!selectedDirectory) {
      event.reply("upload-status", "No folder selected!");
      return;
    }

    if (selectedIps.length === 0) {
      event.reply("upload-status", "No IP addresses selected!");
      return;
    }
  }
);

ipcMain.on("choose-directory", async () => {
  await chooseDirectory(mainWindow);
});




ipcMain.on("zero-size-files", (event, zeroSizeFiles) => {
  console.log("Received zero-size files:", zeroSizeFiles); // Log to see the received files
  // Further logic to handle this data if necessary
});
